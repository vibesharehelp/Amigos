import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';

interface PingPongGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const PingPongGame: React.FC<PingPongGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1PaddleX, setP1PaddleX] = useState(120); // 0 to 240
  const [p2PaddleX, setP2PaddleX] = useState(120);
  const [ball, setBall] = useState({ x: 135, y: 150, vx: 3, vy: 3.5 });
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (winner) {
      kakaoAudio.playGameWin();
      const timer = setTimeout(() => {
        onGameOver(winner);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [winner, onGameOver]);

  // Ball physics loop
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      setBall((prev) => {
        let nx = prev.x + prev.vx;
        let ny = prev.y + prev.vy;
        let nvx = prev.vx;
        let nvy = prev.vy;

        // Bounce off left & right walls
        if (nx <= 10 || nx >= 260) {
          nvx = -nvx;
          kakaoAudio.playGameHit();
        }

        // Check collision with P1 paddle (bottom: y around 270)
        if (ny >= 265 && ny <= 280 && Math.abs(nx - p1PaddleX) < 38) {
          nvy = -Math.abs(nvy) * 1.05; // speed up slightly
          nvx += (nx - p1PaddleX) * 0.1; // angle deflection
          kakaoAudio.playGameHit();
        }

        // Check collision with P2 paddle (top: y around 35)
        if (ny <= 40 && ny >= 25 && Math.abs(nx - p2PaddleX) < 38) {
          nvy = Math.abs(nvy) * 1.05;
          nvx += (nx - p2PaddleX) * 0.1;
          kakaoAudio.playGameHit();
        }

        // Point for P2 (Ball passed bottom)
        if (ny > 310) {
          kakaoAudio.playGameWhistle();
          setP2Score((s) => {
            const next = s + 1;
            if (next >= 5) {
              setTimeout(() => setWinner('p2'), 0);
            }
            return next;
          });
          return { x: 135, y: 150, vx: (Math.random() - 0.5) * 4, vy: -3.5 };
        }

        // Point for P1 (Ball passed top)
        if (ny < 10) {
          kakaoAudio.playGameWhistle();
          setP1Score((s) => {
            const next = s + 1;
            if (next >= 5) {
              setTimeout(() => setWinner('p1'), 0);
            }
            return next;
          });
          return { x: 135, y: 150, vx: (Math.random() - 0.5) * 4, vy: 3.5 };
        }

        return { x: nx, y: ny, vx: nvx, vy: nvy };
      });
    }, 28);

    return () => clearInterval(interval);
  }, [p1PaddleX, p2PaddleX, winner]);

  // AI Opponent P2 Paddle movement
  useEffect(() => {
    if (!isOnline || winner) return;

    const interval = setInterval(() => {
      setP2PaddleX((cur) => {
        const diff = ball.x - cur;
        const speed = 4.2;
        if (Math.abs(diff) < 4) return cur;
        return cur + (diff > 0 ? speed : -speed);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [ball.x, isOnline, winner]);

  // Touch / Drag handler for P1 paddle
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current || winner) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relX = clientX - rect.left;
    const clamped = Math.max(30, Math.min(240, relX));
    setP1PaddleX(clamped);
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setP1Score(0);
    setP2Score(0);
    setP1PaddleX(120);
    setP2PaddleX(120);
    setBall({ x: 135, y: 150, vx: 3, vy: 3.5 });
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[480px] bg-[#F59E0B]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2">
          <img src={opponentAvatar} alt={opponentName} className="w-8 h-8 rounded-full object-cover border-2 border-black" />
          <span className="text-xs font-black text-[#DC2626]">{opponentName}</span>
        </div>
        <div className="flex items-center gap-2 font-black text-sm">
          <span className="text-[#2563EB]">{p1Score}</span>
          <span>:</span>
          <span className="text-[#DC2626]">{p2Score}</span>
          <span className="text-[10px] font-bold text-slate-400 ml-1">First to 5</span>
        </div>
      </div>

      {/* Ping Pong Table Arena */}
      <div
        ref={containerRef}
        onMouseMove={handleTouchMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[320px] bg-[#16A34A] rounded-2xl border-3 border-black overflow-hidden shadow-inner cursor-pointer"
      >
        {/* Table boundary lines */}
        <div className="absolute inset-2 border-2 border-white pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white pointer-events-none" />

        {/* Center Net */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2 bg-black border-y border-white flex items-center justify-around">
          <div className="w-2 h-4 bg-white -mt-1" />
          <div className="w-2 h-4 bg-white -mt-1" />
        </div>

        {/* P2 Paddle (Red - Top) */}
        <div
          className="absolute top-4 w-16 h-4 bg-[#DC2626] rounded-full border-2 border-black shadow-md transition-transform flex items-center justify-center -translate-x-1/2"
          style={{ left: `${p2PaddleX}px` }}
        >
          <div className="w-4 h-1.5 bg-white/60 rounded-full" />
        </div>

        {/* Ball */}
        <div
          className="absolute w-5 h-5 bg-[#FEE500] rounded-full border-2 border-black shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-30"
          style={{
            left: `${ball.x}px`,
            top: `${ball.y}px`,
          }}
        />

        {/* P1 Paddle (Blue - Bottom) */}
        <div
          className="absolute bottom-4 w-16 h-4 bg-[#2563EB] rounded-full border-2 border-black shadow-md transition-transform flex items-center justify-center -translate-x-1/2"
          style={{ left: `${p1PaddleX}px` }}
        >
          <div className="w-4 h-1.5 bg-white/60 rounded-full" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU WON TABLE TENNIS!' : `${opponentName} WON!`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold">
            Score: {p1Score} - {p2Score}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition"
          >
            Play Rematch
          </button>
        </div>
      )}

      {/* Control bar */}
      {!winner && (
        <div className="p-2.5 bg-white rounded-xl border-2 border-black text-center text-xs font-black text-slate-700">
          <span>Slide finger / mouse left and right to control your paddle! 🏓</span>
        </div>
      )}
    </div>
  );
};
