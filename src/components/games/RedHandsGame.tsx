import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, Hand, Shield, Sparkles } from 'lucide-react';

interface RedHandsGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const RedHandsGame: React.FC<RedHandsGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [attacker, setAttacker] = useState<'p1' | 'p2'>('p1');
  const [handState, setHandState] = useState<'idle' | 'slapping' | 'dodged' | 'hit'>('idle');
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

  // Online opponent AI
  useEffect(() => {
    if (!isOnline || winner) return;

    let timer: NodeJS.Timeout;
    if (attacker === 'p2' && handState === 'idle') {
      // P2 is attacker: waits random 700ms - 1800ms to slap
      const delay = 800 + Math.random() * 1200;
      timer = setTimeout(() => {
        handleSlapAction('p2');
      }, delay);
    }

    return () => clearTimeout(timer);
  }, [attacker, isOnline, handState, winner]);

  const handleSlapAction = (who: 'p1' | 'p2') => {
    if (winner || handState !== 'idle' || attacker !== who) return;

    setHandState('slapping');

    // If opponent is online and defending, compute dodge chance based on reaction
    if (isOnline && who === 'p1') {
      const willDodge = Math.random() < 0.35; // 35% dodge chance for AI
      setTimeout(() => {
        if (willDodge) {
          kakaoAudio.playGameHit();
          setHandState('dodged');
          setTimeout(() => {
            setAttacker('p2'); // swap roles on successful dodge!
            setHandState('idle');
          }, 800);
        } else {
          kakaoAudio.playSlap();
          setHandState('hit');
          const newScore = p1Score + 1;
          setP1Score(newScore);
          if (newScore >= 5) {
            setWinner('p1');
          } else {
            setTimeout(() => setHandState('idle'), 600);
          }
        }
      }, 160);
      return;
    }

    // Local 2-player or P2 attack
    setTimeout(() => {
      // Check if defender dodged in time
      kakaoAudio.playSlap();
      setHandState('hit');
      if (who === 'p1') {
        const next = p1Score + 1;
        setP1Score(next);
        if (next >= 5) {
          setWinner('p1');
        } else {
          setTimeout(() => setHandState('idle'), 600);
        }
      } else {
        const next = p2Score + 1;
        setP2Score(next);
        if (next >= 5) {
          setWinner('p2');
        } else {
          setTimeout(() => setHandState('idle'), 600);
        }
      }
    }, 180);
  };

  const handleDodgeAction = (who: 'p1' | 'p2') => {
    if (winner || attacker === who) return;

    if (handState === 'slapping') {
      // Successfully dodged the incoming slap!
      kakaoAudio.playGameHit();
      setHandState('dodged');
      setTimeout(() => {
        setAttacker(who); // Role swapped! Defender becomes attacker!
        setHandState('idle');
      }, 700);
    } else if (handState === 'idle') {
      // False dodge! Quick penalty warning
      kakaoAudio.playGameWhistle();
      setHandState('dodged');
      setTimeout(() => setHandState('idle'), 400);
    }
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setP1Score(0);
    setP2Score(0);
    setAttacker('p1');
    setHandState('idle');
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[480px] bg-[#6B21A8]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Header with Scores */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-white rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2">
          <img src={opponentAvatar} alt={opponentName} className="w-8 h-8 rounded-full object-cover border-2 border-black" />
          <div>
            <span className="text-xs font-black text-[#DC2626] block leading-tight">{opponentName}</span>
            <span className="text-[10px] font-bold text-slate-500">{attacker === 'p2' ? 'Attacker ⚔️' : 'Defender 🛡️'}</span>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-black text-sm">
            <span className="text-[#2563EB]">{p1Score}</span>
            <span className="text-slate-400">:</span>
            <span className="text-[#DC2626]">{p2Score}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">First to 5</span>
        </div>
      </div>

      {/* Top Controls for Local 2P */}
      {!isOnline && !winner && (
        <div className="flex justify-center gap-2 rotate-180">
          {attacker === 'p2' ? (
            <button
              onClick={() => handleSlapAction('p2')}
              className="px-8 py-3 bg-[#DC2626] hover:bg-red-700 text-white font-black text-sm rounded-2xl border-3 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition"
            >
              SLAP! 💥
            </button>
          ) : (
            <button
              onClick={() => handleDodgeAction('p2')}
              className="px-8 py-3 bg-slate-800 hover:bg-black text-white font-black text-sm rounded-2xl border-3 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition"
            >
              DODGE! 🛡️
            </button>
          )}
        </div>
      )}

      {/* Duel Arena: Hands Clashing */}
      <div className="relative w-full h-56 bg-gradient-to-b from-[#7E22CE] to-[#4C1D95] rounded-2xl border-3 border-black flex flex-col items-center justify-between p-4 overflow-hidden">
        {/* Hit flash explosion effect */}
        {handState === 'hit' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-in zoom-in-50 duration-75 flex items-center justify-center">
            <div className="w-24 h-24 bg-[#FEE500] rounded-full border-3 border-black animate-ping opacity-80" />
            <span className="absolute font-black text-3xl text-[#DC2626] drop-shadow-md">💥 SLAP!</span>
          </div>
        )}

        {handState === 'dodged' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center animate-in zoom-in duration-100">
            <span className="px-3 py-1 bg-white border-2 border-black rounded-full font-black text-xs text-[#2563EB] shadow-md">
              MISS! DODGED! 💨
            </span>
          </div>
        )}

        {/* Top Hand (Red) */}
        <div
          className={`flex flex-col items-center transition-all duration-150 ${
            attacker === 'p2' && handState === 'slapping'
              ? 'translate-y-16 scale-110'
              : attacker === 'p1' && handState === 'dodged'
              ? '-translate-y-6 opacity-60'
              : ''
          }`}
        >
          <div className="w-4 h-16 bg-[#DC2626] border-2 border-black rounded-full" />
          <div className="w-16 h-16 bg-white border-3 border-black rounded-2xl shadow-md flex items-center justify-center text-3xl rotate-180">
            ✋
          </div>
        </div>

        {/* Bottom Hand (Blue) */}
        <div
          className={`flex flex-col items-center transition-all duration-150 ${
            attacker === 'p1' && handState === 'slapping'
              ? '-translate-y-16 scale-110'
              : attacker === 'p2' && handState === 'dodged'
              ? 'translate-y-6 opacity-60'
              : ''
          }`}
        >
          <div className="w-16 h-16 bg-white border-3 border-black rounded-2xl shadow-md flex items-center justify-center text-3xl">
            ✋
          </div>
          <div className="w-4 h-16 bg-[#2563EB] border-2 border-black rounded-full" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU WON THE SLAP DUEL!' : `${opponentName} WON!`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold">Lightning reflexes!</p>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition"
          >
            Play Rematch
          </button>
        </div>
      )}

      {/* Bottom Controls for Player 1 */}
      {!winner && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            {attacker === 'p1' ? (
              <button
                onClick={() => handleSlapAction('p1')}
                className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-lg rounded-2xl border-3 border-black shadow-[0_4px_0_#1E40AF] active:translate-y-1 active:shadow-none transition"
              >
                SLAP! 💥
              </button>
            ) : (
              <button
                onClick={() => handleDodgeAction('p1')}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl border-3 border-black shadow-[0_4px_0_#000] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5 text-[#FEE500]" />
                <span>DODGE NOW!</span>
              </button>
            )}
          </div>

          <div className="w-full flex items-center justify-between px-3 py-1 bg-white/90 rounded-xl border-2 border-black text-xs font-black text-slate-700">
            <span>You: {attacker === 'p1' ? 'Attacker (Tap Slap!)' : 'Defender (Wait & Dodge!)'}</span>
            <span className="text-[#2563EB]">{p1Score}/5 Points</span>
          </div>
        </div>
      )}
    </div>
  );
};
