import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';

interface KnifeThrowGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const KnifeThrowGame: React.FC<KnifeThrowGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [rotation, setRotation] = useState(0);
  const [knivesInLog, setKnivesInLog] = useState<number[]>([0, 120]); // initial knife angles
  const [p1KnivesLeft, setP1KnivesLeft] = useState(6);
  const [p2KnivesLeft, setP2KnivesLeft] = useState(6);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  // Rotating target animation
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      setRotation((prev) => (prev + 3) % 360);
    }, 30);

    return () => clearInterval(interval);
  }, [winner]);

  // AI Opponent throw
  useEffect(() => {
    if (!isOnline || turn !== 'p2' || winner) return;

    const timer = setTimeout(() => {
      handleThrow('p2');
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, isOnline, winner, rotation]);

  const handleThrow = (player: 'p1' | 'p2') => {
    if (winner) return;

    // Angle of current throw relative to log: (360 - rotation) % 360
    const hitAngle = (360 - rotation + 90) % 360;

    // Check collision with existing knives (within 22 degrees)
    const collision = knivesInLog.some((kAngle) => {
      const diff = Math.abs(kAngle - hitAngle);
      return Math.min(diff, 360 - diff) < 24;
    });

    if (collision) {
      kakaoAudio.playSlap();
      const other = player === 'p1' ? 'p2' : 'p1';
      setWinner(other);
      kakaoAudio.playGameWin();
      setTimeout(() => onGameOver(other), 0);
      return;
    }

    kakaoAudio.playGameHit();
    setKnivesInLog((prev) => [...prev, hitAngle]);

    if (player === 'p1') {
      const left = p1KnivesLeft - 1;
      setP1KnivesLeft(left);
      if (left <= 0) {
        setWinner('p1');
        kakaoAudio.playGameWin();
        setTimeout(() => onGameOver('p1'), 0);
      } else {
        setTurn('p2');
      }
    } else {
      const left = p2KnivesLeft - 1;
      setP2KnivesLeft(left);
      if (left <= 0) {
        setWinner('p2');
        kakaoAudio.playGameWin();
        setTimeout(() => onGameOver('p2'), 0);
      } else {
        setTurn('p1');
      }
    }
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setKnivesInLog([0, 120]);
    setP1KnivesLeft(6);
    setP2KnivesLeft(6);
    setTurn('p1');
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[480px] bg-[#92400E]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-white rounded-2xl border-2 border-black">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[#2563EB]">You:</span>
          <div className="flex gap-0.5">
            {Array.from({ length: p1KnivesLeft }).map((_, i) => (
              <span key={i} className="text-xs">🗡️</span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black">
          🎯 Knife Throw
        </span>

        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: p2KnivesLeft }).map((_, i) => (
              <span key={i} className="text-xs">🗡️</span>
            ))}
          </div>
          <span className="text-xs font-black text-[#DC2626]">:{opponentName}</span>
        </div>
      </div>

      {/* Rotating Target Log Arena */}
      <div className="relative w-full h-72 bg-[#FEF3C7]/40 rounded-2xl border-3 border-black flex flex-col items-center justify-between p-4 overflow-hidden">
        {/* Rotating Wooden Log */}
        <div
          className="relative w-36 h-36 rounded-full bg-[#B45309] border-4 border-black shadow-xl flex items-center justify-center transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Tree rings */}
          <div className="w-24 h-24 rounded-full border-2 border-amber-900/60 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-amber-900/60 bg-[#92400E]" />
          </div>

          {/* Knives embedded in log */}
          {knivesInLog.map((angle, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-none"
              style={{
                transform: `rotate(${angle}deg)`,
                height: '110px',
              }}
            >
              <div className="w-2.5 h-10 bg-slate-200 border-2 border-black rounded-b-md shadow-md absolute -bottom-5 left-1/2 -translate-x-1/2" />
            </div>
          ))}
        </div>

        {/* Throwing knife ready at bottom */}
        <div className="w-3.5 h-16 bg-slate-200 border-2 border-black rounded-t-md shadow-lg flex items-center justify-center">
          <div className="w-1 h-8 bg-slate-400 rounded-full" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU WON KNIFE THROW!' : `${opponentName} WON!`}
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

      {/* Throw Button */}
      {!winner && (
        <div className="space-y-1.5">
          <button
            onClick={() => handleThrow('p1')}
            disabled={turn !== 'p1'}
            className="w-full py-4 bg-[#D97706] hover:bg-amber-700 text-white font-black text-lg rounded-2xl border-3 border-black shadow-[0_4px_0_#78350F] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
          >
            <span>THROW KNIFE! 🗡️</span>
          </button>

          <div className="p-1 bg-white rounded-xl border-2 border-black text-center text-xs font-black text-slate-700">
            <span>{turn === 'p1' ? 'TAP TO THROW! Do not hit existing knives!' : `${opponentName} is aiming...`}</span>
          </div>
        </div>
      )}
    </div>
  );
};
