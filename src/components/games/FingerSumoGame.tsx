import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface FingerSumoGameProps {
  isOnline: boolean;
  isRealMultiplayer?: boolean;
  myRole?: 'p1' | 'p2';
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const FingerSumoGame: React.FC<FingerSumoGameProps> = ({
  isOnline,
  isRealMultiplayer = false,
  myRole = 'p1',
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  // Position offset from center: -100 (pushed p1 out) to +100 (pushed p2 out)
  const [sumoOffset, setSumoOffset] = useState(0);
  const sumoOffsetRef = useRef(0);
  const scoresRef = useRef({ p1: 0, p2: 0 });
  const winnerRef = useRef<'p1' | 'p2' | null>(null);
  const roundEndingRef = useRef(false);

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

  // AI Opponent P2 push loop (Active ONLY in Computer vs You mode)
  useEffect(() => {
    if (isRealMultiplayer || !isOnline || winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current || roundEndingRef.current) return;
      handleP2Push(false);
    }, 180 + Math.random() * 90);

    return () => clearInterval(interval);
  }, [isRealMultiplayer, isOnline, winner]);

  // Real-time opponent action via WebSocket
  useEffect(() => {
    if (!isRealMultiplayer) return;

    const unsubscribe = multiplayerSocket.onGameAction((action, payload) => {
      if (action === 'sumo_push') {
        if (payload.role !== myRole) {
          if (myRole === 'p1') {
            handleP2Push(false);
          } else {
            handleP1Push(false);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isRealMultiplayer, myRole]);

  const handleP1Push = (sendAction = true) => {
    if (winnerRef.current || roundEndingRef.current) return;
    kakaoAudio.playSlap();

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('sumo_push', { role: 'p1' });
    }

    const next = sumoOffsetRef.current + 6.5;
    sumoOffsetRef.current = next;
    setSumoOffset(next);

    if (next >= 85) {
      roundEndingRef.current = true;
      kakaoAudio.playGameWhistle();
      scoresRef.current.p1 += 1;
      setP1Wins(scoresRef.current.p1);

      if (scoresRef.current.p1 >= 3 && !winnerRef.current) {
        winnerRef.current = 'p1';
        setWinner('p1');
      } else {
        setTimeout(resetRound, 900);
      }
    }
  };

  const handleP2Push = (sendAction = true) => {
    if (winnerRef.current || roundEndingRef.current) return;
    kakaoAudio.playSlap();

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('sumo_push', { role: 'p2' });
    }

    const next = sumoOffsetRef.current - 6.5;
    sumoOffsetRef.current = next;
    setSumoOffset(next);

    if (next <= -85) {
      roundEndingRef.current = true;
      kakaoAudio.playGameWhistle();
      scoresRef.current.p2 += 1;
      setP2Wins(scoresRef.current.p2);

      if (scoresRef.current.p2 >= 3 && !winnerRef.current) {
        winnerRef.current = 'p2';
        setWinner('p2');
      } else {
        setTimeout(resetRound, 900);
      }
    }
  };

  const handleMyPush = () => {
    if (myRole === 'p1') {
      handleP1Push(true);
    } else {
      handleP2Push(true);
    }
  };

  const resetRound = () => {
    sumoOffsetRef.current = 0;
    setSumoOffset(0);
    roundEndingRef.current = false;
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

  const isLocalMode = !isOnline && !isRealMultiplayer;

  return (
    <div className="relative w-full h-[510px] bg-[#78350F]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-2xl border-2 border-black">
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
          🥋 Finger Sumo
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
      {isLocalMode && !winner && (
        <div className="flex items-center justify-center py-1">
          <button
            onClick={() => handleP2Push(false)}
            className="w-full py-2 bg-[#EF4444] text-white font-black text-sm rounded-xl border-3 border-black shadow-[0_3px_0_#991B1B] active:translate-y-0.5 transition"
          >
            P2 TAP FAST TO SHOVE! 🔴
          </button>
        </div>
      )}

      {/* Sand Dohyo Ring */}
      <div className="relative w-full h-[260px] bg-gradient-to-b from-[#FDE68A] to-[#D97706]/40 rounded-2xl border-4 border-[#B45309] shadow-inner flex items-center justify-center overflow-hidden">
        {/* Straw circle ring boundary */}
        <div className="relative w-[210px] h-[210px] rounded-full border-[8px] border-amber-800/80 bg-amber-100/50 shadow-md flex items-center justify-center">
          {/* Center Lines */}
          <div className="w-16 h-1 bg-amber-900/40 rounded-full mb-6" />
          <div className="w-16 h-1 bg-amber-900/40 rounded-full mt-6" />

          {/* Sumo Wrestler Clash Group */}
          <div
            className="absolute flex items-center gap-1 transition-all duration-75"
            style={{ transform: `translateX(${sumoOffset * 1.1}px)` }}
          >
            {/* P2 Red Sumo Wrestler */}
            <div className="flex flex-col items-center">
              <div className="text-4xl filter drop-shadow-md -scale-x-100 animate-pulse">
                🤼
              </div>
              <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded border border-black">
                {myRole === 'p2' ? 'YOU' : opponentName}
              </span>
            </div>

            {/* P1 Blue Sumo Wrestler */}
            <div className="flex flex-col items-center">
              <div className="text-4xl filter drop-shadow-md animate-pulse">
                🤼
              </div>
              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded border border-black">
                {myRole === 'p1' ? 'YOU' : opponentName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === myRole ? 'YOU PUSHED THE RIVAL OUT OF THE RING!' : `${opponentName} WON THE SUMO MATCH!`}
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

      {/* P1 / Your Push Button */}
      {!winner && (
        <div className="pt-1">
          <button
            onClick={handleMyPush}
            className="w-full h-18 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-lg rounded-2xl border-3 border-black shadow-[0_4px_0_#1E40AF] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
          >
            <span>TAP RAPIDLY TO SHOVE! 💥</span>
          </button>
        </div>
      )}
    </div>
  );
};
