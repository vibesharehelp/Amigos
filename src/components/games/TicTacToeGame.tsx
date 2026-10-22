import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface TicTacToeGameProps {
  isOnline: boolean;
  isRealMultiplayer?: boolean;
  myRole?: 'p1' | 'p2';
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  isOnline,
  isRealMultiplayer = false,
  myRole = 'p1',
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1'); // p1 is O (Blue), p2 is X (Red)
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw' | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] === 'O' ? 'p1' : 'p2';
      }
    }

    if (squares.every((sq) => sq !== null)) {
      return 'draw';
    }

    return null;
  };

  // AI Opponent move (Active ONLY in Computer vs You mode)
  useEffect(() => {
    if (isRealMultiplayer || !isOnline || turn !== 'p2' || winner) return;

    const timer = setTimeout(() => {
      // Find empty squares
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length > 0) {
        const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        handleClickSquare(randomIndex, 'p2', false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, isOnline, isRealMultiplayer, board, winner]);

  // Real-time opponent move via WebSocket
  useEffect(() => {
    if (!isRealMultiplayer) return;

    const unsubscribe = multiplayerSocket.onGameAction((action, payload) => {
      if (action === 'square_click') {
        const { index, player } = payload;
        handleClickSquare(index, player, false);
      }
    });

    return () => unsubscribe();
  }, [isRealMultiplayer, board, winner]);

  const handleClickSquare = (index: number, player = turn, sendAction = true) => {
    if (board[index] || winner) return;

    // In real multiplayer, only allow clicking when it's your turn
    if (sendAction && isRealMultiplayer && turn !== myRole) {
      return;
    }

    kakaoAudio.playGameHit();
    const nextBoard = [...board];
    nextBoard[index] = player === 'p1' ? 'O' : 'X';
    setBoard(nextBoard);

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('square_click', { index, player });
    }

    const winResult = checkWinner(nextBoard);
    if (winResult) {
      if (winResult === 'draw') {
        setWinner('draw');
      } else {
        setWinner(winResult);
        kakaoAudio.playGameWin();
        setTimeout(() => {
          onGameOver(winResult);
        }, 0);
      }
    } else {
      setTurn(player === 'p1' ? 'p2' : 'p1');
    }
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setBoard(Array(9).fill(null));
    setTurn('p1');
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[510px] bg-[#38BDF8]/20 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-white rounded-2xl border-2 border-black">
        <span className={`text-xs font-black ${turn === 'p1' ? 'text-[#2563EB]' : 'text-slate-400'}`}>
          {turn === 'p1' ? '▶ Blue Turn (O)' : 'Blue (O)'}
        </span>
        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          Tic-Tac-Toe
        </span>
        <span className={`text-xs font-black ${turn === 'p2' ? 'text-[#DC2626]' : 'text-slate-400'}`}>
          {turn === 'p2' ? '▶ Red Turn (X)' : 'Red (X)'}
        </span>
      </div>

      {/* Grid Board */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="grid grid-cols-3 gap-2.5 w-64 h-64 bg-slate-800 p-2.5 rounded-3xl border-4 border-black shadow-xl">
          {board.map((val, idx) => (
            <button
              key={idx}
              onClick={() => handleClickSquare(idx)}
              disabled={Boolean(val) || Boolean(winner) || (isRealMultiplayer && turn !== myRole)}
              className="w-full h-full bg-white hover:bg-slate-100 disabled:opacity-95 rounded-2xl border-2 border-black shadow-[0_2px_0_#000] flex items-center justify-center text-3xl font-black transition active:translate-y-0.5"
            >
              {val === 'O' && <span className="text-[#2563EB]">O</span>}
              {val === 'X' && <span className="text-[#DC2626]">X</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95 mb-2">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'draw'
                ? "IT'S A DRAW!"
                : winner === myRole
                ? 'YOU WON TIC-TAC-TOE!'
                : `${opponentName} WON!`}
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

      {/* Turn Hint Footer */}
      {!winner && (
        <div className="text-center py-2 bg-white/70 rounded-xl border border-black">
          <span className="text-xs font-extrabold text-slate-800">
            {isRealMultiplayer
              ? turn === myRole
                ? '👉 It is YOUR turn! Place your mark on the grid.'
                : `⏳ Waiting for ${opponentName} to place mark...`
              : turn === 'p1'
              ? '👉 Your turn (O) vs Computer Bot!'
              : `🤖 Computer (${opponentName}) thinking...`}
          </span>
        </div>
      )}
    </div>
  );
};
