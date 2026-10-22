import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface HappyHipposGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const HappyHipposGame: React.FC<HappyHipposGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [balls, setBalls] = useState<Ball[]>(() => {
    const colors = ['#EF4444', '#3B82F6', '#EAB308', '#10B981', '#EC4899'];
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 200,
      y: 40 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: colors[i % colors.length],
    }));
  });

  const [p1BallsEaten, setP1BallsEaten] = useState(0);
  const [p2BallsEaten, setP2BallsEaten] = useState(0);
  const [p1Chomp, setP1Chomp] = useState(false);
  const [p2Chomp, setP2Chomp] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  useEffect(() => {
    if (winner) {
      kakaoAudio.playGameWin();
      const timer = setTimeout(() => {
        onGameOver(winner);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [winner, onGameOver]);

  useEffect(() => {
    if (!winner && balls.length === 0) {
      if (p1BallsEaten >= p2BallsEaten) {
        setWinner('p1');
      } else {
        setWinner('p2');
      }
    }
  }, [balls.length, p1BallsEaten, p2BallsEaten, winner]);

  // Ball physics animation loop
  useEffect(() => {
    if (winner || balls.length === 0) return;

    const interval = setInterval(() => {
      setBalls((prev) =>
        prev.map((b) => {
          let nx = b.x + b.vx;
          let ny = b.y + b.vy;
          let nvx = b.vx;
          let nvy = b.vy;

          if (nx < 10 || nx > 250) nvx = -nvx;
          if (ny < 15 || ny > 175) nvy = -nvy;

          return { ...b, x: nx, y: ny, vx: nvx, vy: nvy };
        })
      );
    }, 40);

    return () => clearInterval(interval);
  }, [winner, balls.length]);

  // AI Opponent chomp loop
  useEffect(() => {
    if (!isOnline || winner || balls.length === 0) return;

    const interval = setInterval(() => {
      // Randomly chomp when balls are nearby top
      const ballsNearTop = balls.some((b) => b.y < 80);
      if (ballsNearTop || Math.random() < 0.4) {
        handleP2Chomp();
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isOnline, winner, balls]);

  const handleP1Chomp = () => {
    if (p1Chomp || winner) return;
    kakaoAudio.playChomp();
    setP1Chomp(true);

    // Chomp reach at bottom: y between 120 and 185, x around center
    setTimeout(() => {
      setBalls((prev) => {
        const eaten = prev.filter((b) => b.y > 115 && b.x > 70 && b.x < 190);
        if (eaten.length > 0) {
          setP1BallsEaten((score) => score + eaten.length);
        }
        return prev.filter((b) => !(b.y > 115 && b.x > 70 && b.x < 190));
      });
      setP1Chomp(false);
    }, 220);
  };

  const handleP2Chomp = () => {
    if (p2Chomp || winner) return;
    kakaoAudio.playChomp();
    setP2Chomp(true);

    // Chomp reach at top: y between 15 and 80, x around center
    setTimeout(() => {
      setBalls((prev) => {
        const eaten = prev.filter((b) => b.y < 75 && b.x > 70 && b.x < 190);
        if (eaten.length > 0) {
          setP2BallsEaten((score) => score + eaten.length);
        }
        return prev.filter((b) => !(b.y < 75 && b.x > 70 && b.x < 190));
      });
      setP2Chomp(false);
    }, 220);
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    const colors = ['#EF4444', '#3B82F6', '#EAB308', '#10B981', '#EC4899'];
    setBalls(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 200,
        y: 40 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: colors[i % colors.length],
      }))
    );
    setP1BallsEaten(0);
    setP2BallsEaten(0);
    setP1Chomp(false);
    setP2Chomp(false);
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[480px] bg-[#0284C7]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2">
          <img src={opponentAvatar} alt={opponentName} className="w-8 h-8 rounded-full object-cover border-2 border-black" />
          <span className="text-xs font-black text-[#0284C7]">{opponentName} (Top Hippo)</span>
        </div>
        <span className="text-xs font-black text-slate-800 bg-[#E0F2FE] px-2 py-0.5 rounded-full border border-sky-300">
          {p2BallsEaten} Balls
        </span>
      </div>

      {/* Top Local Button */}
      {!isOnline && !winner && (
        <div className="w-full flex justify-center rotate-180">
          <button
            onClick={handleP2Chomp}
            className="w-full py-3 bg-[#0284C7] hover:bg-sky-700 text-white font-black text-sm rounded-2xl border-3 border-black shadow-[0_3px_0_#0369A1] active:translate-y-0.5 transition"
          >
            CHOMP! 🦛
          </button>
        </div>
      )}

      {/* Pond Area with Hippos */}
      <div className="relative w-full h-64 bg-gradient-to-b from-[#0284C7] to-[#0369A1] rounded-2xl border-3 border-black overflow-hidden flex flex-col items-center justify-between p-2 shadow-inner">
        {/* Pond Water Ripple */}
        <div className="absolute inset-4 rounded-full border-2 border-white/20 pointer-events-none" />

        {/* Top Hippo (Blue) */}
        <div
          className={`relative z-10 flex flex-col items-center transition-transform duration-150 ${
            p2Chomp ? 'translate-y-10 scale-105' : ''
          }`}
        >
          <div className="w-6 h-12 bg-[#38BDF8] border-2 border-black rounded-b-md" />
          <div className="w-16 h-14 bg-[#38BDF8] border-3 border-black rounded-3xl flex flex-col items-center justify-center shadow-md">
            <div className="flex gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
            </div>
            <div className="w-10 h-3 bg-white border-2 border-black rounded-full mt-1.5" />
          </div>
        </div>

        {/* Floating Bouncing Balls */}
        <div className="absolute inset-0 pointer-events-none">
          {balls.map((b) => (
            <div
              key={b.id}
              className="absolute w-5 h-5 rounded-full border-2 border-black shadow-md transition-transform"
              style={{
                backgroundColor: b.color,
                left: `${b.x}px`,
                top: `${b.y}px`,
              }}
            />
          ))}
        </div>

        {/* Bottom Hippo (Red/Orange) */}
        <div
          className={`relative z-10 flex flex-col items-center transition-transform duration-150 ${
            p1Chomp ? '-translate-y-10 scale-105' : ''
          }`}
        >
          <div className="w-16 h-14 bg-[#F87171] border-3 border-black rounded-3xl flex flex-col items-center justify-center shadow-md">
            <div className="w-10 h-3 bg-white border-2 border-black rounded-full mb-1.5" />
            <div className="flex gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-white border border-black flex items-center justify-center">
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
            </div>
          </div>
          <div className="w-6 h-12 bg-[#F87171] border-2 border-black rounded-t-md" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU ATE THE MOST BALLS!' : `${opponentName} WON!`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold">
            Score: {p1BallsEaten} vs {p2BallsEaten}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Bottom Player Chomp Button */}
      {!winner && (
        <div className="space-y-1.5">
          <button
            onClick={handleP1Chomp}
            className="w-full py-4.5 bg-[#EF4444] hover:bg-red-600 text-white font-black text-lg rounded-2xl border-3 border-black shadow-[0_4px_0_#B91C1C] active:translate-y-1 active:shadow-none transition"
          >
            CHOMP BALLS! 🦛
          </button>

          <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-xl border-2 border-black text-xs font-black">
            <span className="text-[#EF4444]">Your Hungry Hippo</span>
            <span>{p1BallsEaten} Balls Eaten ({balls.length} remaining)</span>
          </div>
        </div>
      )}
    </div>
  );
};
