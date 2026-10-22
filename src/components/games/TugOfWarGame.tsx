import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { RotateCcw, Trophy, Zap } from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface TugOfWarGameProps {
  isOnline: boolean;
  isRealMultiplayer?: boolean;
  myRole?: 'p1' | 'p2';
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({
  isOnline,
  isRealMultiplayer = false,
  myRole = 'p1',
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  // Rope position: -100 (P1 wins, pulled all way to bottom/left) to +100 (P2 wins, pulled all way to top/right)
  const [ropePosition, setRopePosition] = useState(0);
  const [p1Taps, setP1Taps] = useState(0);
  const [p2Taps, setP2Taps] = useState(0);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [gameStarted, setGameStarted] = useState(true);

  const ropePosRef = useRef(0);
  const winnerRef = useRef<'p1' | 'p2' | null>(null);

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

  // Online opponent AI tap loop (Active ONLY in Computer vs You mode)
  useEffect(() => {
    if (isRealMultiplayer || !isOnline || winner || !gameStarted) return;

    // AI taps every 160-260ms with small randomness
    const interval = setInterval(() => {
      handleP2Tap(false);
    }, 180 + Math.random() * 80);

    return () => clearInterval(interval);
  }, [isRealMultiplayer, isOnline, winner, gameStarted]);

  // Listen for real online opponent actions via WebSocket
  useEffect(() => {
    if (!isRealMultiplayer) return;

    const unsubscribe = multiplayerSocket.onGameAction((action, payload) => {
      if (action === 'tap') {
        if (payload.role !== myRole) {
          if (myRole === 'p1') {
            handleP2Tap(false);
          } else {
            handleP1Tap(false);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isRealMultiplayer, myRole]);

  const handleP1Tap = (sendAction = true) => {
    if (winnerRef.current) return;
    kakaoAudio.playGameHit();
    setP1Taps((prev) => prev + 1);

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('tap', { role: 'p1' });
    }

    const next = ropePosRef.current - 4.5;
    if (next <= -80) {
      ropePosRef.current = -80;
      setRopePosition(-80);
      winnerRef.current = 'p1';
      setWinner('p1');
    } else {
      ropePosRef.current = next;
      setRopePosition(next);
    }
  };

  const handleP2Tap = (sendAction = true) => {
    if (winnerRef.current) return;
    kakaoAudio.playGameHit();
    setP2Taps((prev) => prev + 1);

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('tap', { role: 'p2' });
    }

    const next = ropePosRef.current + 4.5;
    if (next >= 80) {
      ropePosRef.current = 80;
      setRopePosition(80);
      winnerRef.current = 'p2';
      setWinner('p2');
    } else {
      ropePosRef.current = next;
      setRopePosition(next);
    }
  };

  const handleMyTap = () => {
    if (myRole === 'p1') {
      handleP1Tap(true);
    } else {
      handleP2Tap(true);
    }
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    ropePosRef.current = 0;
    winnerRef.current = null;
    setRopePosition(0);
    setP1Taps(0);
    setP2Taps(0);
    setWinner(null);
  };

  const isLocalMode = !isOnline && !isRealMultiplayer;

  return (
    <div className="relative w-full h-[510px] bg-[#22C55E]/15 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white/95 rounded-2xl border-2 border-black">
        <div className="flex items-center gap-1.5">
          <img
            src={opponentAvatar}
            alt={opponentName}
            className="w-7 h-7 rounded-full object-cover border-2 border-black"
          />
          <span className="text-xs font-black text-[#DC2626]">{opponentName}</span>
          {isRealMultiplayer && (
            <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full border border-emerald-300">
              LIVE 🟢
            </span>
          )}
          {!isRealMultiplayer && isOnline && (
            <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full border border-blue-300">
              BOT 🤖
            </span>
          )}
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🪢 Tug of War
        </span>

        <div className="flex items-center gap-1">
          <span className="text-xs font-black text-[#2563EB]">You</span>
          <span className="text-xs font-extrabold text-slate-500">
            ({myRole === 'p1' ? 'Blue' : 'Red'})
          </span>
        </div>
      </div>

      {/* Local 2-Player Top Tap Button for Player 2 */}
      {isLocalMode && !winner && (
        <div className="pt-1">
          <button
            onClick={() => handleP2Tap(false)}
            className="w-full h-16 bg-[#EF4444] hover:bg-red-600 text-white font-black text-base rounded-2xl border-3 border-black shadow-[0_3px_0_#991B1B] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2"
          >
            <span>TAP HERE (PLAYER 2) 🔴</span>
          </button>
        </div>
      )}

      {/* Tug of War Visual Arena */}
      <div className="relative w-full h-[230px] bg-gradient-to-b from-[#16A34A]/20 to-[#CA8A04]/20 rounded-2xl border-3 border-black overflow-hidden flex flex-col items-center justify-center shadow-inner">
        {/* Center Line Marker */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white/70 border-x border-black/40 z-0" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/70 text-white rounded text-[9px] font-bold z-10">
          CENTER
        </div>

        {/* Rope with flag ribbon */}
        <div
          className="relative w-full flex items-center justify-center transition-all duration-75"
          style={{ transform: `translateX(${-ropePosition * 1.4}px)` }}
        >
          {/* P1 Left Tugger Character */}
          <div className="flex flex-col items-center mr-2">
            <span className="text-3xl filter drop-shadow animate-bounce">
              {myRole === 'p1' ? '🤠' : '🦁'}
            </span>
            <span className="text-[10px] font-black bg-[#2563EB] text-white px-2 py-0.5 rounded-full border border-black shadow-xs">
              P1 {myRole === 'p1' ? '(You)' : `(${opponentName})`}
            </span>
          </div>

          {/* Heavy Twisted Rope Graphic */}
          <div className="relative w-36 h-4 bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#D97706] rounded-full border-2 border-black flex items-center justify-center shadow-md">
            {/* Center Red Ribbon Indicator */}
            <div className="w-5 h-8 bg-red-600 border border-black rounded-sm shadow-md flex items-center justify-center font-black text-white text-[9px]">
              ▼
            </div>
          </div>

          {/* P2 Right Tugger Character */}
          <div className="flex flex-col items-center ml-2">
            <span className="text-3xl filter drop-shadow -scale-x-100 animate-bounce">
              {myRole === 'p2' ? '🤠' : '🍠'}
            </span>
            <span className="text-[10px] font-black bg-[#DC2626] text-white px-2 py-0.5 rounded-full border border-black shadow-xs">
              P2 {myRole === 'p2' ? '(You)' : `(${opponentName})`}
            </span>
          </div>
        </div>

        {/* Win threshold boundary flags */}
        <div className="absolute bottom-2 left-6 text-xs font-black text-blue-700 bg-white/80 px-2 py-0.5 rounded border border-black">
          ◀ P1 Win Zone
        </div>
        <div className="absolute bottom-2 right-6 text-xs font-black text-red-700 bg-white/80 px-2 py-0.5 rounded border border-black">
          P2 Win Zone ▶
        </div>
      </div>

      {/* Winner Display */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {(winner === myRole) ? 'YOU PULLED THE ROPE AND WON!' : `${opponentName} WON THE TUG OF WAR!`}
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

      {/* Player 1 (or Your) Tap Area */}
      {!winner && (
        <div className="pt-1">
          <button
            onClick={handleMyTap}
            className="w-full h-24 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xl rounded-2xl border-3 border-black shadow-[0_4px_0_#1E40AF] active:translate-y-1 active:shadow-none transition flex flex-col items-center justify-center gap-1"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 fill-amber-300 text-amber-300" />
              <span>TAP AS FAST AS YOU CAN!</span>
            </div>
            <span className="text-xs font-bold text-blue-200">
              {isRealMultiplayer
                ? '⚡ Tapping against Live Online Opponent!'
                : '⚡ Tapping against Amigos Computer!'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
