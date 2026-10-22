import React, { useState, useEffect, useRef } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface AirHockeyGameProps {
  isOnline: boolean;
  isRealMultiplayer?: boolean;
  myRole?: 'p1' | 'p2';
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({
  isOnline,
  isRealMultiplayer = false,
  myRole = 'p1',
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Pos, setP1Pos] = useState({ x: 135, y: 250 });
  const [p2Pos, setP2Pos] = useState({ x: 135, y: 55 });
  const [puck, setPuck] = useState({ x: 135, y: 155, vx: 2, vy: 3 });
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  const p1PosRef = useRef({ x: 135, y: 250 });
  const p2PosRef = useRef({ x: 135, y: 55 });
  const puckRef = useRef({ x: 135, y: 155, vx: 2, vy: 3 });
  const scoresRef = useRef({ p1: 0, p2: 0 });
  const winnerRef = useRef<'p1' | 'p2' | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

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

  // Puck physics loop (25ms) - run by P1 or Computer host
  useEffect(() => {
    if (winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current) return;

      const p = puckRef.current;
      const m1 = p1PosRef.current;
      const m2 = p2PosRef.current;

      let nx = p.x + p.vx;
      let ny = p.y + p.vy;
      let nvx = p.vx * 0.995;
      let nvy = p.vy * 0.995;

      // Left and right walls bounce
      if (nx <= 16) {
        nx = 16;
        nvx = Math.abs(nvx);
        kakaoAudio.playGameHit();
      } else if (nx >= 254) {
        nx = 254;
        nvx = -Math.abs(nvx);
        kakaoAudio.playGameHit();
      }

      // Check goals
      const inGoalX = nx >= 85 && nx <= 185;
      if (ny <= 12) {
        if (inGoalX) {
          // P1 Scores!
          kakaoAudio.playGameWhistle();
          scoresRef.current.p1 += 1;
          const currentP1 = scoresRef.current.p1;
          setP1Score(currentP1);

          if (currentP1 >= 5 && !winnerRef.current) {
            winnerRef.current = 'p1';
            setWinner('p1');
          }

          puckRef.current = { x: 135, y: 155, vx: (Math.random() - 0.5) * 4, vy: 3 };
          setPuck({ ...puckRef.current });
          return;
        } else {
          ny = 12;
          nvy = Math.abs(nvy);
          kakaoAudio.playGameHit();
        }
      } else if (ny >= 298) {
        if (inGoalX) {
          // P2 Scores!
          kakaoAudio.playGameWhistle();
          scoresRef.current.p2 += 1;
          const currentP2 = scoresRef.current.p2;
          setP2Score(currentP2);

          if (currentP2 >= 5 && !winnerRef.current) {
            winnerRef.current = 'p2';
            setWinner('p2');
          }

          puckRef.current = { x: 135, y: 155, vx: (Math.random() - 0.5) * 4, vy: -3 };
          setPuck({ ...puckRef.current });
          return;
        } else {
          ny = 298;
          nvy = -Math.abs(nvy);
          kakaoAudio.playGameHit();
        }
      }

      // Mallet 1 (P1) collision
      const d1 = Math.hypot(nx - m1.x, ny - m1.y);
      if (d1 < 28) {
        kakaoAudio.playGameHit();
        const angle = Math.atan2(ny - m1.y, nx - m1.x);
        const speed = Math.max(5, Math.hypot(nvx, nvy) + 0.5);
        nvx = Math.cos(angle) * Math.min(speed, 9);
        nvy = Math.sin(angle) * Math.min(speed, 9);
        nx = m1.x + Math.cos(angle) * 29;
        ny = m1.y + Math.sin(angle) * 29;
      }

      // Mallet 2 (P2) collision
      const d2 = Math.hypot(nx - m2.x, ny - m2.y);
      if (d2 < 28) {
        kakaoAudio.playGameHit();
        const angle = Math.atan2(ny - m2.y, nx - m2.x);
        const speed = Math.max(5, Math.hypot(nvx, nvy) + 0.5);
        nvx = Math.cos(angle) * Math.min(speed, 9);
        nvy = Math.sin(angle) * Math.min(speed, 9);
        nx = m2.x + Math.cos(angle) * 29;
        ny = m2.y + Math.sin(angle) * 29;
      }

      puckRef.current = { x: nx, y: ny, vx: nvx, vy: nvy };
      setPuck({ x: nx, y: ny, vx: nvx, vy: nvy });
    }, 25);

    return () => clearInterval(interval);
  }, [winner]);

  // AI P2 movement (Active ONLY in Computer vs You mode)
  useEffect(() => {
    if (isRealMultiplayer || !isOnline || winner) return;

    const interval = setInterval(() => {
      if (winnerRef.current) return;
      const p = puckRef.current;
      const m2 = p2PosRef.current;

      const dx = p.x - m2.x;
      const targetY = p.y < 150 ? Math.min(100, Math.max(45, p.y - 15)) : 55;
      const dy = targetY - m2.y;

      const nextP2 = {
        x: Math.max(40, Math.min(230, m2.x + dx * 0.28)),
        y: Math.max(35, Math.min(125, m2.y + dy * 0.25)),
      };

      p2PosRef.current = nextP2;
      setP2Pos(nextP2);
    }, 40);

    return () => clearInterval(interval);
  }, [isRealMultiplayer, isOnline, winner]);

  // Real-time opponent movement via WebSocket
  useEffect(() => {
    if (!isRealMultiplayer) return;

    const unsubscribe = multiplayerSocket.onGameAction((action, payload) => {
      if (action === 'mallet_move') {
        const { x, y, role } = payload;
        if (role !== myRole) {
          if (role === 'p2') {
            p2PosRef.current = { x, y };
            setP2Pos({ x, y });
          } else {
            p1PosRef.current = { x, y };
            setP1Pos({ x, y });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isRealMultiplayer, myRole]);

  // Pointer / Touch drag handling for local player
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (winner || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (myRole === 'p1') {
      const nextX = Math.max(30, Math.min(240, clientX));
      const nextY = Math.max(165, Math.min(285, clientY));

      p1PosRef.current = { x: nextX, y: nextY };
      setP1Pos({ x: nextX, y: nextY });

      if (isRealMultiplayer) {
        multiplayerSocket.sendGameAction('mallet_move', { x: nextX, y: nextY, role: 'p1' });
      }
    } else {
      const nextX = Math.max(30, Math.min(240, clientX));
      const nextY = Math.max(35, Math.min(145, clientY));

      p2PosRef.current = { x: nextX, y: nextY };
      setP2Pos({ x: nextX, y: nextY });

      if (isRealMultiplayer) {
        multiplayerSocket.sendGameAction('mallet_move', { x: nextX, y: nextY, role: 'p2' });
      }
    }
  };

  const handleP2Control = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (winnerRef.current) return;
    const prev = p2PosRef.current;
    let nx = prev.x;
    let ny = prev.y;

    if (dir === 'left') nx = Math.max(35, nx - 16);
    if (dir === 'right') nx = Math.min(235, nx + 16);
    if (dir === 'up') ny = Math.max(35, ny - 16);
    if (dir === 'down') ny = Math.min(135, ny + 16);

    p2PosRef.current = { x: nx, y: ny };
    setP2Pos({ x: nx, y: ny });
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    scoresRef.current = { p1: 0, p2: 0 };
    p1PosRef.current = { x: 135, y: 250 };
    p2PosRef.current = { x: 135, y: 55 };
    puckRef.current = { x: 135, y: 155, vx: 2, vy: 3 };
    winnerRef.current = null;

    setP1Score(0);
    setP2Score(0);
    setP1Pos({ x: 135, y: 250 });
    setP2Pos({ x: 135, y: 55 });
    setPuck({ x: 135, y: 155, vx: 2, vy: 3 });
    setWinner(null);
  };

  const isLocalMode = !isOnline && !isRealMultiplayer;

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
          <span className="text-sm font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-lg border border-red-300 ml-1">
            {p2Score}
          </span>
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black text-black">
          🏒 Air Hockey
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-300 mr-1">
            {p1Score}
          </span>
          <span className="text-xs font-black text-[#2563EB]">You</span>
        </div>
      </div>

      {/* Local 2-Player P2 D-Pad Bar */}
      {isLocalMode && !winner && (
        <div className="flex items-center justify-between px-2 py-1 bg-red-950/40 rounded-xl border border-red-500/30">
          <span className="text-[10px] font-black text-red-300 uppercase">P2 Mallet</span>
          <div className="flex gap-1">
            <button
              onClick={() => handleP2Control('left')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ◀
            </button>
            <button
              onClick={() => handleP2Control('up')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▲
            </button>
            <button
              onClick={() => handleP2Control('down')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▼
            </button>
            <button
              onClick={() => handleP2Control('right')}
              className="w-7 h-7 bg-red-700 text-white rounded font-black text-xs flex items-center justify-center border border-black"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* Air Hockey Table Arena */}
      <div
        ref={tableRef}
        onPointerMove={handlePointerMove}
        className="relative w-full h-[330px] bg-[#0284C7]/15 rounded-3xl border-4 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden cursor-crosshair touch-none"
      >
        {/* Glow Center Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/60 shadow-[0_0_8px_#22d3ee]" />
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-cyan-400/60 shadow-[0_0_8px_#22d3ee] pointer-events-none" />

        {/* Top Goal Net (P2) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-2 bg-red-500 rounded-b-md shadow-[0_0_10px_#ef4444]" />
        {/* Bottom Goal Net (P1) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-2 bg-blue-500 rounded-t-md shadow-[0_0_10px_#3b82f6]" />

        {/* Air Hole Grid effect */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

        {/* P2 Mallet (Red) */}
        <div
          className="absolute w-10 h-10 rounded-full bg-[#EF4444] border-3 border-white shadow-[0_0_12px_#ef4444] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10 transition-transform duration-75"
          style={{ left: `${p2Pos.x}px`, top: `${p2Pos.y}px` }}
        >
          <div className="w-4 h-4 rounded-full bg-white/80 shadow-inner" />
        </div>

        {/* P1 Mallet (Blue) */}
        <div
          className="absolute w-10 h-10 rounded-full bg-[#3B82F6] border-3 border-white shadow-[0_0_12px_#3b82f6] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
          style={{ left: `${p1Pos.x}px`, top: `${p1Pos.y}px` }}
        >
          <div className="w-4 h-4 rounded-full bg-white/80 shadow-inner" />
        </div>

        {/* Neon Puck */}
        <div
          className="absolute w-6 h-6 rounded-full bg-yellow-300 border-2 border-black shadow-[0_0_10px_#fde047] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
          style={{ left: `${puck.x}px`, top: `${puck.y}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-black/40" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === myRole ? 'YOU WON THE AIR HOCKEY MATCH!' : `${opponentName} WON!`}
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

      {/* Drag instruction footer */}
      {!winner && (
        <div className="text-center py-1 bg-white/10 rounded-xl border border-white/20">
          <span className="text-[11px] font-bold text-slate-300">
            {isRealMultiplayer
              ? '⚡ Playing live with online opponent! Drag mallet to strike puck.'
              : '👆 Drag your mallet to strike the puck into the goal!'}
          </span>
        </div>
      )}
    </div>
  );
};
