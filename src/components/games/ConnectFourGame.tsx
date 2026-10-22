import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface ConnectFourGameProps {
  isOnline: boolean;
  isRealMultiplayer?: boolean;
  myRole?: 'p1' | 'p2';
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

const ROWS = 6;
const COLS = 7;

export const ConnectFourGame: React.FC<ConnectFourGameProps> = ({
  isOnline,
  isRealMultiplayer = false,
  myRole = 'p1',
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw' | null>(null);

  useEffect(() => {
    if (winner && winner !== 'draw') {
      kakaoAudio.playGameWin();
      const timer = setTimeout(() => {
        onGameOver(winner);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [winner, onGameOver]);

  const checkWin = (board: (string | null)[][], row: number, col: number, player: string) => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal \
      [1, -1], // diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;

      // Positive direction
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
      }

      // Negative direction
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r -= dr;
        c -= dc;
      }

      if (count >= 4) return true;
    }

    return false;
  };

  // AI Opponent move (Active ONLY in Computer vs You mode)
  useEffect(() => {
    if (isRealMultiplayer || !isOnline || turn !== 'p2' || winner) return;

    const timer = setTimeout(() => {
      const validCols: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (!grid[0][c]) validCols.push(c);
      }

      if (validCols.length > 0) {
        const preferred =
          validCols.includes(3) && Math.random() < 0.6
            ? 3
            : validCols[Math.floor(Math.random() * validCols.length)];
        handleDropDisc(preferred, 'p2', false);
      }
    }, 750);

    return () => clearTimeout(timer);
  }, [turn, isOnline, isRealMultiplayer, grid, winner]);

  // Real-time opponent move via WebSocket
  useEffect(() => {
    if (!isRealMultiplayer) return;

    const unsubscribe = multiplayerSocket.onGameAction((action, payload) => {
      if (action === 'drop_disc') {
        const { col, player } = payload;
        handleDropDisc(col, player, false);
      }
    });

    return () => unsubscribe();
  }, [isRealMultiplayer, grid, winner]);

  const handleDropDisc = (col: number, player = turn, sendAction = true) => {
    if (winner || grid[0][col]) return;

    if (sendAction && isRealMultiplayer && turn !== myRole) {
      return;
    }

    // Find the lowest empty row in this column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!grid[r][col]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return;

    kakaoAudio.playGameHit();
    const nextGrid = grid.map((row) => [...row]);
    nextGrid[targetRow][col] = player;
    setGrid(nextGrid);

    if (sendAction && isRealMultiplayer) {
      multiplayerSocket.sendGameAction('drop_disc', { col, player });
    }

    if (checkWin(nextGrid, targetRow, col, player)) {
      setWinner(player);
      return;
    }

    // Check if full (draw)
    const isFull = nextGrid[0].every((cell) => cell !== null);
    if (isFull) {
      setWinner('draw');
      return;
    }

    setTurn(player === 'p1' ? 'p2' : 'p1');
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setTurn('p1');
    setWinner(null);
  };

  return (
    <div className="relative w-full h-[510px] bg-[#1E3A8A]/30 rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between px-3 py-1 bg-white rounded-2xl border-2 border-black">
        <span className={`text-xs font-black ${turn === 'p1' ? 'text-[#2563EB]' : 'text-slate-400'}`}>
          {turn === 'p1' ? '▶ Blue Turn' : 'Blue'}
        </span>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🔴 Four in a Row
        </span>

        <span className={`text-xs font-black ${turn === 'p2' ? 'text-[#DC2626]' : 'text-slate-400'}`}>
          {turn === 'p2' ? `▶ Red Turn` : 'Red'}
        </span>
      </div>

      {/* Column Drop Buttons Header */}
      {!winner && (
        <div className="grid grid-cols-7 gap-1.5 px-2 pt-1">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              disabled={
                Boolean(grid[0][c]) ||
                Boolean(winner) ||
                (isRealMultiplayer && turn !== myRole)
              }
              onClick={() => handleDropDisc(c, turn)}
              className="py-1 bg-white hover:bg-amber-100 disabled:opacity-30 rounded-lg border-2 border-black font-black text-xs text-black shadow-xs active:translate-y-0.5 transition"
            >
              ▼
            </button>
          ))}
        </div>
      )}

      {/* Connect Four Blue Board */}
      <div className="relative w-full p-2.5 bg-[#2563EB] rounded-2xl border-4 border-black shadow-2xl flex flex-col gap-1.5">
        {grid.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-1.5">
            {row.map((cell, c) => (
              <div
                key={c}
                onClick={() =>
                  !winner &&
                  (!isRealMultiplayer || turn === myRole) &&
                  handleDropDisc(c, turn)
                }
                className="w-8 h-8 rounded-full bg-slate-900 border-2 border-black shadow-inner flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {cell === 'p1' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 border border-white shadow-md animate-in zoom-in-75 duration-100" />
                )}
                {cell === 'p2' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-400 to-red-600 border border-white shadow-md animate-in zoom-in-75 duration-100" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'draw'
                ? "IT'S A DRAW!"
                : winner === myRole
                ? 'YOU CONNECTED 4 DISCS AND WON!'
                : `${opponentName} WON FOUR IN A ROW!`}
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

      {/* Guide hint */}
      {!winner && (
        <div className="text-center py-1 bg-white/70 rounded-xl border border-black">
          <span className="text-[11px] font-extrabold text-slate-800">
            {isRealMultiplayer
              ? turn === myRole
                ? '👉 It is YOUR turn! Drop a disc into any column.'
                : `⏳ Waiting for ${opponentName} to drop a disc...`
              : turn === 'p1'
              ? 'Drop a blue disc to align 4 in any line!'
              : `${opponentName} (Computer) is calculating drop...`}
          </span>
        </div>
      )}
    </div>
  );
};
