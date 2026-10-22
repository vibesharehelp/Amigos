import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw, Zap } from 'lucide-react';

interface SpinWarGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const SpinWarGame: React.FC<SpinWarGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  const [p1Pos, setP1Pos] = useState({ x: 135, y: 220, vx: 0, vy: 0, rot: 0 });
  const [p2Pos, setP2Pos] = useState({ x: 135, y: 80, vx: 0, vy: 0, rot: 0 });

  const p1Ref = useRef({ x: 135, y: 220, vx: 0, vy: 0, rot: 0 });
  const p2Ref = useRef({ x: 135, y: 80, vx: 0, vy: 0, rot: 0 });
  const scoresRef = useRef({ p1: 0, p2: 0 });
  const winnerRef = useRef<'p1' | 'p2' | null>(null);
  const roundOverRef = useRef(false);

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

  // Spinner physics loop (28ms)
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current || roundOverRef.current) return;

      const p1 = p1Ref.current;
      const p2 = p2Ref.current;

      // Update velocities with friction
      p1.x += p1.vx;
      p1.y += p1.vy;
      p1.vx *= 0.95;
      p1.vy *= 0.95;
      p1.rot = (p1.rot + 25) % 360;

      p2.x += p2.vx;
      p2.y += p2.vy;
      p2.vx *= 0.95;
      p2.vy *= 0.95;
      p2.rot = (p2.rot + 25) % 360;

      // Arena center is at (135, 150), radius is 120
      const arenaCenter = { x: 135, y: 150 };
      const arenaRadius = 120;

      // Collision between P1 and P2 spinners
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist < 38) {
        kakaoAudio.playGameHit();
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const impulse = 7.5;

        p1.vx = -Math.cos(angle) * impulse;
        p1.vy = -Math.sin(angle) * impulse;

        p2.vx = Math.cos(angle) * impulse;
        p2.vy = Math.sin(angle) * impulse;
      }

      // Check if spinner fell out of arena ring
      const distP1FromCenter = Math.hypot(p1.x - arenaCenter.x, p1.y - arenaCenter.y);
      const distP2FromCenter = Math.hypot(p2.x - arenaCenter.x, p2.y - arenaCenter.y);

      if (distP1FromCenter > arenaRadius + 15) {
        // P1 fell out! P2 wins the round
        roundOverRef.current = true;
        kakaoAudio.playSlap();
        scoresRef.current.p2 += 1;
        setP2Wins(scoresRef.current.p2);

        if (scoresRef.current.p2 >= 3 && !winnerRef.current) {
          winnerRef.current = 'p2';
          setWinner('p2');
        } else {
          setTimeout(resetRound, 800);
        }
      } else if (distP2FromCenter > arenaRadius + 15) {
        // P2 fell out! P1 wins the round
        roundOverRef.current = true;
        kakaoAudio.playSlap();
        scoresRef.current.p1 += 1;
        setP1Wins(scoresRef.current.p1);

        if (scoresRef.current.p1 >= 3 && !winnerRef.current) {
          winnerRef.current = 'p1';
          setWinner('p1');
        } else {
          setTimeout(resetRound, 800);
        }
      }

      setP1Pos({ ...p1 });
      setP2Pos({ ...p2 });
    }, 28);

    return () => clearInterval(interval);
  }, [winner]);

  // AI Opponent P2 (charges towards P1 periodically)
  useEffect(() => {
    if (!isOnline || winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current || roundOverRef.current) return;
      const p1 = p1Ref.current;
      const p2 = p2Ref.current;

      const angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
      const speed = 4.5 + Math.random() * 2;
      p2.vx += Math.cos(angle) * speed;
      p2.vy += Math.sin(angle) * speed;
    }, 500);

    return () => clearInterval(interval);
  }, [isOnline, winner]);

  const resetRound = () => {
    p1Ref.current = { x: 135, y: 220, vx: 0, vy: 0, rot: 0 };
    p2Ref.current = { x: 135, y: 80, vx: 0, vy: 0, rot: 0 };
    setP1Pos({ ...p1Ref.current });
    setP2Pos({ ...p2Ref.current });
    roundOverRef.current = false;
  };

  const handleP1Boost = (dir: 'up' | 'down' | 'left' | 'right' | 'charge') => {
    if (winnerRef.current || roundOverRef.current) return;
    kakaoAudio.playTap();
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;

    if (dir === 'charge') {
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      p1.vx += Math.cos(angle) * 6;
      p1.vy += Math.sin(angle) * 6;
    } else if (dir === 'up') {
      p1.vy -= 5;
    } else if (dir === 'down') {
      p1.vy += 5;
    } else if (dir === 'left') {
      p1.vx -= 5;
    } else if (dir === 'right') {
      p1.vx += 5;
    }
  };

  const handleP2Boost = () => {
    if (winnerRef.current || roundOverRef.current) return;
    kakaoAudio.playTap();
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;
    const angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    p2.vx += Math.cos(angle) * 6;
    p2.vy += Math.sin(angle) * 6;
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    scoresRef.current = { p1: 0, p2: 0 };
    winnerRef.current = null;
    setP1Wins(0);
    setP2Wins(0);
    resetRound();
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[510px] bg-slate-950 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white/95 rounded-2xl border-2 border-black">
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
                {i < p2Wins ? '🔴' : '⚪'}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🌀 Spinner War
        </span>

        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 mr-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="text-xs">
                {i < p1Wins ? '🔵' : '⚪'}
              </span>
            ))}
          </div>
          <span className="text-xs font-black text-[#2563EB]">You</span>
        </div>
      </div>

      {/* Local mode top button for P2 */}
      {!isOnline && !winner && (
        <div className="flex items-center justify-center py-1">
          <button
            onClick={handleP2Boost}
            className="px-6 py-2 bg-[#EF4444] text-white font-black text-xs rounded-xl border-2 border-black shadow-xs active:scale-95"
          >
            P2 SPURT & ATTACK!
          </button>
        </div>
      )}

      {/* Circular Dohyo Arena */}
      <div className="relative w-full h-[300px] flex items-center justify-center">
        {/* Outer Void Area */}
        <div className="absolute inset-0 bg-[#0F172A] rounded-2xl border-3 border-black" />

        {/* Circular Fighting Ring */}
        <div className="relative w-[240px] h-[240px] rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 border-[6px] border-amber-600 shadow-[inset_0_0_20px_rgba(180,83,9,0.4)] flex items-center justify-center overflow-hidden">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-700/40 flex items-center justify-center text-amber-700/50 font-black text-xl">
            🌀
          </div>

          {/* P2 Red Spinner */}
          <div
            className="absolute w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 border-2 border-black shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: `${p2Pos.x - 15}px`,
              top: `${p2Pos.y - 30}px`,
              transform: `translate(-50%, -50%) rotate(${p2Pos.rot}deg)`,
            }}
          >
            <div className="w-2.5 h-11 bg-black/80 rounded-full absolute" />
            <div className="w-11 h-2.5 bg-black/80 rounded-full absolute" />
            <div className="w-4 h-4 rounded-full bg-white border border-black z-10" />
          </div>

          {/* P1 Blue Spinner */}
          <div
            className="absolute w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 border-2 border-black shadow-lg flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{
              left: `${p1Pos.x - 15}px`,
              top: `${p1Pos.y - 30}px`,
              transform: `translate(-50%, -50%) rotate(${p1Pos.rot}deg)`,
            }}
          >
            <div className="w-2.5 h-11 bg-black/80 rounded-full absolute" />
            <div className="w-11 h-2.5 bg-black/80 rounded-full absolute" />
            <div className="w-4 h-4 rounded-full bg-white border border-black z-10" />
          </div>
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU KNOCKED OUT THE ENEMY SPINNER!' : `${opponentName} WON THE SPINNER DUEL!`}
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

      {/* Player 1 Boost Controls */}
      {!winner && (
        <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-2xl border-2 border-black">
          <div className="grid grid-cols-3 gap-1 w-32">
            <div />
            <button
              onClick={() => handleP1Boost('up')}
              className="w-9 h-9 bg-slate-800 text-white rounded-lg border border-black font-black flex items-center justify-center active:scale-95"
            >
              ▲
            </button>
            <div />
            <button
              onClick={() => handleP1Boost('left')}
              className="w-9 h-9 bg-slate-800 text-white rounded-lg border border-black font-black flex items-center justify-center active:scale-95"
            >
              ◀
            </button>
            <button
              onClick={() => handleP1Boost('down')}
              className="w-9 h-9 bg-slate-800 text-white rounded-lg border border-black font-black flex items-center justify-center active:scale-95"
            >
              ▼
            </button>
            <button
              onClick={() => handleP1Boost('right')}
              className="w-9 h-9 bg-slate-800 text-white rounded-lg border border-black font-black flex items-center justify-center active:scale-95"
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => handleP1Boost('charge')}
            className="flex-1 h-20 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-sm rounded-xl border-3 border-black shadow-[0_4px_0_#1E40AF] active:translate-y-1 active:shadow-none transition flex flex-col items-center justify-center gap-1"
          >
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span>CHARGE RIVAL!</span>
          </button>
        </div>
      )}
    </div>
  );
};
