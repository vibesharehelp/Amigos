import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw, Crosshair } from 'lucide-react';

interface TankBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  shooter: 'p1' | 'p2';
  bounces: number;
}

interface TankBattleGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const TankBattleGame: React.FC<TankBattleGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Hp, setP1Hp] = useState(3);
  const [p2Hp, setP2Hp] = useState(3);
  const [p1Pos, setP1Pos] = useState({ x: 60, y: 245, angle: 0 });
  const [p2Pos, setP2Pos] = useState({ x: 210, y: 55, angle: 180 });
  const [bullets, setBullets] = useState<TankBullet[]>([]);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  // Keep references for physics calculations without state updater side-effects
  const p1PosRef = useRef({ x: 60, y: 245, angle: 0 });
  const p2PosRef = useRef({ x: 210, y: 55, angle: 180 });
  const p1HpRef = useRef(3);
  const p2HpRef = useRef(3);
  const bulletsRef = useRef<TankBullet[]>([]);
  const winnerRef = useRef<'p1' | 'p2' | null>(null);

  // Sync refs when states change
  useEffect(() => {
    p1PosRef.current = p1Pos;
  }, [p1Pos]);

  useEffect(() => {
    p2PosRef.current = p2Pos;
  }, [p2Pos]);

  useEffect(() => {
    p1HpRef.current = p1Hp;
  }, [p1Hp]);

  useEffect(() => {
    p2HpRef.current = p2Hp;
  }, [p2Hp]);

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

  // Handle firing a bullet from either tank
  const handleFire = (shooter: 'p1' | 'p2') => {
    if (winnerRef.current) return;
    kakaoAudio.playGameHit();
    const pos = shooter === 'p1' ? p1PosRef.current : p2PosRef.current;
    const rad = ((pos.angle - 90) * Math.PI) / 180;
    const speed = 5.5;

    const newBullet: TankBullet = {
      id: Date.now() + Math.random(),
      x: pos.x + Math.cos(rad) * 20,
      y: pos.y + Math.sin(rad) * 20,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      shooter,
      bounces: 0,
    };

    bulletsRef.current = [...bulletsRef.current, newBullet];
    setBullets([...bulletsRef.current]);
  };

  // Bullets physics & collision loop (30ms)
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current) return;

      const p1 = p1PosRef.current;
      const p2 = p2PosRef.current;
      const survivingBullets: TankBullet[] = [];
      let p1Hit = false;
      let p2Hit = false;

      for (const b of bulletsRef.current) {
        let nx = b.x + b.vx;
        let ny = b.y + b.vy;
        let bounces = b.bounces;

        // Bounce off arena walls (width: 270, height: 300)
        if (nx <= 12 || nx >= 258) {
          b.vx = -b.vx;
          bounces++;
        }
        if (ny <= 12 || ny >= 288) {
          b.vy = -b.vy;
          bounces++;
        }

        // Check collision with Player 1 tank
        if (b.shooter !== 'p1' && Math.hypot(nx - p1.x, ny - p1.y) < 18) {
          p1Hit = true;
          continue; // Bullet consumed
        }

        // Check collision with Player 2 tank
        if (b.shooter !== 'p2' && Math.hypot(nx - p2.x, ny - p2.y) < 18) {
          p2Hit = true;
          continue; // Bullet consumed
        }

        // Keep bullet if max bounces not exceeded
        if (bounces <= 3) {
          survivingBullets.push({ ...b, x: nx, y: ny, bounces });
        }
      }

      bulletsRef.current = survivingBullets;
      setBullets(survivingBullets);

      // Process damage cleanly outside the bullets array iteration
      if (p1Hit) {
        kakaoAudio.playSlap();
        const nextHp = Math.max(0, p1HpRef.current - 1);
        p1HpRef.current = nextHp;
        setP1Hp(nextHp);
        if (nextHp === 0 && !winnerRef.current) {
          winnerRef.current = 'p2';
          setWinner('p2');
        }
      }

      if (p2Hit) {
        kakaoAudio.playSlap();
        const nextHp = Math.max(0, p2HpRef.current - 1);
        p2HpRef.current = nextHp;
        setP2Hp(nextHp);
        if (nextHp === 0 && !winnerRef.current) {
          winnerRef.current = 'p1';
          setWinner('p1');
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [winner]);

  // AI Opponent P2 loop (when online mode)
  useEffect(() => {
    if (!isOnline || winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current) return;
      const p1 = p1PosRef.current;
      const p2 = p2PosRef.current;

      // Aim towards P1 with a slight random spread
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const jitter = (Math.random() - 0.5) * 20;

      const nextP2 = {
        angle: Math.round(targetAngle + jitter),
        x: Math.max(35, Math.min(235, p2.x + (Math.random() - 0.5) * 16)),
        y: Math.max(30, Math.min(130, p2.y + (Math.random() - 0.5) * 12)),
      };

      p2PosRef.current = nextP2;
      setP2Pos(nextP2);

      // AI shoot opportunity
      if (Math.random() < 0.5) {
        handleFire('p2');
      }
    }, 550);

    return () => clearInterval(interval);
  }, [isOnline, winner]);

  const handleMoveP1 = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (winnerRef.current) return;
    const prev = p1PosRef.current;
    let nx = prev.x;
    let ny = prev.y;
    let angle = prev.angle;

    if (dir === 'left') {
      nx = Math.max(25, nx - 14);
      angle = -90;
    } else if (dir === 'right') {
      nx = Math.min(245, nx + 14);
      angle = 90;
    } else if (dir === 'up') {
      ny = Math.max(140, ny - 14);
      angle = 0;
    } else if (dir === 'down') {
      ny = Math.min(280, ny + 14);
      angle = 180;
    }

    const next = { x: nx, y: ny, angle };
    p1PosRef.current = next;
    setP1Pos(next);
  };

  const handleMoveP2 = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (winnerRef.current) return;
    const prev = p2PosRef.current;
    let nx = prev.x;
    let ny = prev.y;
    let angle = prev.angle;

    if (dir === 'left') {
      nx = Math.max(25, nx - 14);
      angle = -90;
    } else if (dir === 'right') {
      nx = Math.min(245, nx + 14);
      angle = 90;
    } else if (dir === 'up') {
      ny = Math.max(25, ny - 14);
      angle = 0;
    } else if (dir === 'down') {
      ny = Math.min(150, ny + 14);
      angle = 180;
    }

    const next = { x: nx, y: ny, angle };
    p2PosRef.current = next;
    setP2Pos(next);
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    p1HpRef.current = 3;
    p2HpRef.current = 3;
    p1PosRef.current = { x: 60, y: 245, angle: 0 };
    p2PosRef.current = { x: 210, y: 55, angle: 180 };
    bulletsRef.current = [];
    winnerRef.current = null;

    setP1Hp(3);
    setP2Hp(3);
    setP1Pos({ x: 60, y: 245, angle: 0 });
    setP2Pos({ x: 210, y: 55, angle: 180 });
    setBullets([]);
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[510px] bg-slate-900 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white/95 rounded-2xl border-2 border-black shadow-xs">
        <div className="flex items-center gap-1.5">
          <img
            src={opponentAvatar}
            alt={opponentName}
            className="w-7 h-7 rounded-full object-cover border-2 border-black"
          />
          <span className="text-xs font-black text-[#DC2626]">{opponentName}</span>
          <div className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="text-xs">
                {i < p2Hp ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🚀 Tank Battle
        </span>

        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 mr-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="text-xs">
                {i < p1Hp ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
          <span className="text-xs font-black text-[#2563EB]">You</span>
        </div>
      </div>

      {/* Local mode top controls for Player 2 */}
      {!isOnline && !winner && (
        <div className="flex items-center justify-between px-2 py-1 bg-red-950/40 rounded-xl border border-red-500/30">
          <button
            onClick={() => handleFire('p2')}
            className="px-3 py-1.5 bg-[#EF4444] text-white font-black text-xs rounded-lg border-2 border-black active:scale-95"
          >
            P2 FIRE!
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => handleMoveP2('left')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ◀
            </button>
            <button
              onClick={() => handleMoveP2('up')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▲
            </button>
            <button
              onClick={() => handleMoveP2('down')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▼
            </button>
            <button
              onClick={() => handleMoveP2('right')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* Tank Battlefield Arena */}
      <div className="relative w-full h-[290px] bg-[#78350F]/20 rounded-2xl border-3 border-black overflow-hidden shadow-inner flex items-center justify-center">
        {/* Sand Grid */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Obstacle Blocks in Arena */}
        <div className="absolute top-1/2 left-12 -translate-y-1/2 w-9 h-9 bg-[#B45309] border-2 border-black rounded-lg shadow-md" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-9 h-9 bg-[#B45309] border-2 border-black rounded-lg shadow-md" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#92400E] border-2 border-black rounded-lg shadow-md" />

        {/* P2 Red Tank */}
        <div
          className="absolute w-9 h-9 bg-[#DC2626] border-2 border-black rounded-lg shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${p2Pos.x}px`,
            top: `${p2Pos.y}px`,
            transform: `translate(-50%, -50%) rotate(${p2Pos.angle}deg)`,
          }}
        >
          <div className="w-1.5 h-5 bg-black rounded-full absolute -top-3" />
          <div className="w-3.5 h-3.5 bg-black/40 rounded-full" />
        </div>

        {/* P1 Blue Tank */}
        <div
          className="absolute w-9 h-9 bg-[#2563EB] border-2 border-black rounded-lg shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${p1Pos.x}px`,
            top: `${p1Pos.y}px`,
            transform: `translate(-50%, -50%) rotate(${p1Pos.angle}deg)`,
          }}
        >
          <div className="w-1.5 h-5 bg-black rounded-full absolute -top-3" />
          <div className="w-3.5 h-3.5 bg-black/40 rounded-full" />
        </div>

        {/* Bullets */}
        {bullets.map((b) => (
          <div
            key={b.id}
            className={`absolute w-3 h-3 rounded-full border border-black shadow-md -translate-x-1/2 -translate-y-1/2 ${
              b.shooter === 'p1' ? 'bg-[#60A5FA]' : 'bg-[#F87171]'
            }`}
            style={{ left: `${b.x}px`, top: `${b.y}px` }}
          />
        ))}
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU DESTROYED THE RIVAL TANK!' : `${opponentName} WON!`}
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

      {/* Controls for Player 1 */}
      {!winner && (
        <div className="flex items-center justify-between px-2 pt-1">
          {/* Movement buttons */}
          <div className="grid grid-cols-3 gap-1 w-32">
            <div />
            <button
              onClick={() => handleMoveP1('up')}
              className="w-10 h-10 bg-slate-800 active:bg-black text-white rounded-xl border-2 border-black font-black text-sm shadow-xs flex items-center justify-center"
            >
              ▲
            </button>
            <div />
            <button
              onClick={() => handleMoveP1('left')}
              className="w-10 h-10 bg-slate-800 active:bg-black text-white rounded-xl border-2 border-black font-black text-sm shadow-xs flex items-center justify-center"
            >
              ◀
            </button>
            <button
              onClick={() => handleMoveP1('down')}
              className="w-10 h-10 bg-slate-800 active:bg-black text-white rounded-xl border-2 border-black font-black text-sm shadow-xs flex items-center justify-center"
            >
              ▼
            </button>
            <button
              onClick={() => handleMoveP1('right')}
              className="w-10 h-10 bg-slate-800 active:bg-black text-white rounded-xl border-2 border-black font-black text-sm shadow-xs flex items-center justify-center"
            >
              ▶
            </button>
          </div>

          {/* Fire Cannon Button */}
          <button
            onClick={() => handleFire('p1')}
            className="w-24 h-20 bg-[#EF4444] hover:bg-red-600 text-white font-black text-base rounded-2xl border-3 border-black shadow-[0_4px_0_#991B1B] active:translate-y-1 active:shadow-none transition flex flex-col items-center justify-center gap-1"
          >
            <Crosshair className="w-5 h-5" />
            <span>FIRE!</span>
          </button>
        </div>
      )}
    </div>
  );
};
