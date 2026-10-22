import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';

interface PoolBall {
  id: number;
  type: 'cue' | 'blue' | 'red' | 'eight';
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPocketed: boolean;
}

interface PoolGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

const INITIAL_BALLS: PoolBall[] = [
  { id: 0, type: 'cue', x: 135, y: 240, vx: 0, vy: 0, isPocketed: false },
  { id: 1, type: 'blue', x: 135, y: 70, vx: 0, vy: 0, isPocketed: false },
  { id: 2, type: 'red', x: 120, y: 55, vx: 0, vy: 0, isPocketed: false },
  { id: 3, type: 'blue', x: 150, y: 55, vx: 0, vy: 0, isPocketed: false },
  { id: 4, type: 'eight', x: 135, y: 40, vx: 0, vy: 0, isPocketed: false },
  { id: 5, type: 'red', x: 105, y: 40, vx: 0, vy: 0, isPocketed: false },
  { id: 6, type: 'blue', x: 165, y: 40, vx: 0, vy: 0, isPocketed: false },
];

export const PoolGame: React.FC<PoolGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [aimAngle, setAimAngle] = useState(0); // 0 to 360 degrees
  const [power, setPower] = useState(60); // 10 to 100
  const [isShooting, setIsShooting] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [balls, setBalls] = useState<PoolBall[]>(() => INITIAL_BALLS.map((b) => ({ ...b })));

  const ballsRef = useRef<PoolBall[]>(INITIAL_BALLS.map((b) => ({ ...b })));
  const isShootingRef = useRef(false);
  const turnRef = useRef<'p1' | 'p2'>('p1');
  const winnerRef = useRef<'p1' | 'p2' | null>(null);

  useEffect(() => {
    isShootingRef.current = isShooting;
  }, [isShooting]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => {
    winnerRef.current = winner;
    if (winner) {
      kakaoAudio.playGameWin();
      const timer = setTimeout(() => {
        onGameOver(winner);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [winner, onGameOver]);

  // Pockets coordinates
  const pockets = [
    { x: 15, y: 15 },
    { x: 135, y: 12 },
    { x: 255, y: 15 },
    { x: 15, y: 305 },
    { x: 135, y: 308 },
    { x: 255, y: 305 },
  ];

  // Physics animation loop (28ms)
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current) return;

      const currentBalls = ballsRef.current;
      let anyMoving = false;
      let eightSunkWinner: 'p1' | 'p2' | null = null;

      const updated = currentBalls.map((b) => {
        if (b.isPocketed) return b;

        let nx = b.x + b.vx;
        let ny = b.y + b.vy;
        let nvx = b.vx * 0.96; // friction
        let nvy = b.vy * 0.96;

        if (Math.abs(nvx) < 0.05) nvx = 0;
        if (Math.abs(nvy) < 0.05) nvy = 0;

        if (nvx !== 0 || nvy !== 0) anyMoving = true;

        // Cushion bounces
        if (nx <= 18 || nx >= 252) {
          nvx = -nvx * 0.9;
          kakaoAudio.playGameHit();
        }
        if (ny <= 18 || ny >= 302) {
          nvy = -nvy * 0.9;
          kakaoAudio.playGameHit();
        }

        // Check pocket sink
        const sunk = pockets.some((p) => Math.hypot(p.x - nx, p.y - ny) < 16);

        if (sunk) {
          kakaoAudio.playGameHit();
          if (b.type === 'eight') {
            const isP1Win = turnRef.current === 'p1';
            eightSunkWinner = isP1Win ? 'p1' : 'p2';
          }
          return { ...b, x: -100, y: -100, vx: 0, vy: 0, isPocketed: true };
        }

        return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
      });

      // Simple ball-to-ball elastic collision
      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const b1 = updated[i];
          const b2 = updated[j];
          if (b1.isPocketed || b2.isPocketed) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 16 && dist > 0) {
            kakaoAudio.playGameHit();
            const angle = Math.atan2(dy, dx);
            const speed1 = Math.hypot(b1.vx, b1.vy);
            const speed2 = Math.hypot(b2.vx, b2.vy);
            b1.vx = -Math.cos(angle) * (speed1 + speed2) * 0.5;
            b1.vy = -Math.sin(angle) * (speed1 + speed2) * 0.5;
            b2.vx = Math.cos(angle) * (speed1 + speed2) * 0.5;
            b2.vy = Math.sin(angle) * (speed1 + speed2) * 0.5;
          }
        }
      }

      // Check if shot has finished
      if (!anyMoving && isShootingRef.current) {
        isShootingRef.current = false;
        setIsShooting(false);

        // Respawn cue ball if sunk
        const cue = updated.find((b) => b.type === 'cue');
        if (cue?.isPocketed) {
          cue.x = 135;
          cue.y = 240;
          cue.vx = 0;
          cue.vy = 0;
          cue.isPocketed = false;
        }

        // Switch turn cleanly
        const nextTurn = turnRef.current === 'p1' ? 'p2' : 'p1';
        turnRef.current = nextTurn;
        setTurn(nextTurn);
      }

      ballsRef.current = updated;
      setBalls([...updated]);

      // Check game win
      if (eightSunkWinner && !winnerRef.current) {
        winnerRef.current = eightSunkWinner;
        setWinner(eightSunkWinner);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [winner]);

  // AI Opponent shoot
  useEffect(() => {
    if (!isOnline || turn !== 'p2' || isShooting || winner) return;

    const timer = setTimeout(() => {
      setAimAngle(-90 + (Math.random() - 0.5) * 40);
      setPower(50 + Math.random() * 30);
      handleStrike();
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, isOnline, isShooting, winner]);

  const handleStrike = () => {
    if (isShootingRef.current || winnerRef.current) return;
    kakaoAudio.playGameHit();
    isShootingRef.current = true;
    setIsShooting(true);

    const rad = ((aimAngle - 90) * Math.PI) / 180;
    const force = (power / 100) * 14;

    const updated = ballsRef.current.map((b) =>
      b.type === 'cue'
        ? { ...b, vx: Math.cos(rad) * force, vy: Math.sin(rad) * force }
        : b
    );
    ballsRef.current = updated;
    setBalls([...updated]);
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    const fresh = INITIAL_BALLS.map((b) => ({ ...b }));
    ballsRef.current = fresh;
    isShootingRef.current = false;
    turnRef.current = 'p1';
    winnerRef.current = null;

    setBalls(fresh);
    setTurn('p1');
    setIsShooting(false);
    setWinner(null);
  };

  const cueBall = balls.find((b) => b.type === 'cue' && !b.isPocketed);

  return (
    <div className="relative w-full h-[500px] bg-[#0284C7]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Turn Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-2xl border-2 border-black">
        <span className={`text-xs font-black ${turn === 'p1' ? 'text-[#2563EB]' : 'text-slate-400'}`}>
          {turn === 'p1' ? '▶ YOUR TURN (Blue)' : 'You (Blue)'}
        </span>
        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🎱 8-Ball Pool
        </span>
        <span className={`text-xs font-black ${turn === 'p2' ? 'text-[#DC2626]' : 'text-slate-400'}`}>
          {turn === 'p2' ? `▶ ${opponentName}'s TURN` : opponentName}
        </span>
      </div>

      {/* Billiards Table */}
      <div className="relative w-full h-[320px] bg-[#15803D] rounded-3xl border-[10px] border-[#92400E] shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Table Felt Inner Cushion */}
        <div className="absolute inset-1 border border-black/30 pointer-events-none" />

        {/* 6 Pockets */}
        {pockets.map((p, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 rounded-full bg-black border-2 border-slate-700 shadow-inner -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
          />
        ))}

        {/* Cue Stick & Aim Line */}
        {!isShooting && cueBall && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${cueBall.x}px`,
              top: `${cueBall.y}px`,
              transform: `rotate(${aimAngle}deg)`,
            }}
          >
            {/* Dotted Aim Trajectory Line */}
            <div className="w-0.5 h-36 border-l-2 border-dashed border-white/70 absolute bottom-0 left-0 -translate-x-1/2" />
            {/* Cue Stick */}
            <div className="w-2.5 h-32 bg-amber-200 border-2 border-black rounded-b-md absolute top-4 left-0 -translate-x-1/2 shadow-md" />
          </div>
        )}

        {/* Balls on Table */}
        {balls.map((b) => {
          if (b.isPocketed) return null;

          let color = 'bg-white';
          let textColor = 'text-black';
          let label = '';

          if (b.type === 'cue') {
            color = 'bg-white';
          } else if (b.type === 'blue') {
            color = 'bg-blue-600';
            textColor = 'text-white';
            label = 'B';
          } else if (b.type === 'red') {
            color = 'bg-red-600';
            textColor = 'text-white';
            label = 'R';
          } else if (b.type === 'eight') {
            color = 'bg-black border border-white';
            textColor = 'text-white';
            label = '8';
          }

          return (
            <div
              key={b.id}
              className={`absolute w-5 h-5 rounded-full border border-black shadow-md flex items-center justify-center font-black text-[9px] -translate-x-1/2 -translate-y-1/2 z-10 ${color} ${textColor}`}
              style={{ left: `${b.x}px`, top: `${b.y}px` }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU POCKETED THE 8-BALL AND WON!' : `${opponentName} WON THE POOL MATCH!`}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition"
          >
            Play Rematch
          </button>
        </div>
      )}

      {/* Cue Controls for Human Turn */}
      {!winner && (
        <div className="flex flex-col gap-2 p-2 bg-white rounded-2xl border-2 border-black">
          <div className="flex items-center justify-between text-xs font-black text-slate-700">
            <span>Aim: {aimAngle}°</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={aimAngle}
              disabled={isShooting || (!isOnline && turn !== 'p1' && false)}
              onChange={(e) => setAimAngle(Number(e.target.value))}
              className="w-36 accent-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-1 text-xs font-black text-slate-700">
              <span>Force:</span>
              <input
                type="range"
                min={20}
                max={100}
                value={power}
                disabled={isShooting}
                onChange={(e) => setPower(Number(e.target.value))}
                className="flex-1 accent-[#EF4444]"
              />
              <span className="w-8 text-right">{power}%</span>
            </div>

            <button
              onClick={handleStrike}
              disabled={isShooting || (isOnline && turn === 'p2')}
              className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#1E40AF] active:translate-y-0.5 active:shadow-none transition"
            >
              HIT BALL!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
