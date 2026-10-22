import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Trophy, RotateCcw } from 'lucide-react';

interface PenaltyKicksGameProps {
  isOnline: boolean;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winner: 'p1' | 'p2') => void;
}

export const PenaltyKicksGame: React.FC<PenaltyKicksGameProps> = ({
  isOnline,
  opponentName,
  opponentAvatar,
  onGameOver,
}) => {
  const [round, setRound] = useState(1);
  const [p1History, setP1History] = useState<boolean[]>([]);
  const [p2History, setP2History] = useState<boolean[]>([]);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1'); // p1 shoots, then p2 shoots
  const [ballState, setBallState] = useState<'idle' | 'kicking' | 'goal' | 'saved'>('idle');
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const [goaliePos, setGoaliePos] = useState<'left' | 'center' | 'right'>('center');
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

  const targets = [
    { id: 'top_left', label: '↖ Top Left', x: 20, y: 25 },
    { id: 'top_right', label: '↗ Top Right', x: 80, y: 25 },
    { id: 'bottom_left', label: '↙ Bottom Left', x: 20, y: 65 },
    { id: 'bottom_right', label: '↘ Bottom Right', x: 80, y: 65 },
    { id: 'center', label: '🎯 Center High', x: 50, y: 35 },
  ];

  // AI Goalkeeper or AI Striker
  useEffect(() => {
    if (!isOnline || winner || ballState !== 'idle') return;

    if (turn === 'p2') {
      // Opponent's turn to shoot
      const timer = setTimeout(() => {
        const randomTarget = targets[Math.floor(Math.random() * targets.length)].id;
        handleShoot(randomTarget);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turn, isOnline, winner, ballState]);

  const handleShoot = (targetId: string) => {
    if (ballState !== 'idle' || winner) return;

    kakaoAudio.playGameHit();
    setKickTarget(targetId);
    setBallState('kicking');

    // Goalkeeper dives
    const diveDirections: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const chosenDive = diveDirections[Math.floor(Math.random() * diveDirections.length)];
    setGoaliePos(chosenDive);

    // Check if goalkeeper saved the shot
    const isSave =
      (chosenDive === 'left' && (targetId === 'top_left' || targetId === 'bottom_left')) ||
      (chosenDive === 'right' && (targetId === 'top_right' || targetId === 'bottom_right')) ||
      (chosenDive === 'center' && targetId === 'center');

    setTimeout(() => {
      if (isSave) {
        kakaoAudio.playGameHit();
        setBallState('saved');
        recordScore(false);
      } else {
        kakaoAudio.playGameWhistle();
        setBallState('goal');
        recordScore(true);
      }
    }, 700);
  };

  const recordScore = (isGoal: boolean) => {
    setTimeout(() => {
      if (turn === 'p1') {
        const updated = [...p1History, isGoal];
        setP1History(updated);
        setTurn('p2');
        setBallState('idle');
        setKickTarget(null);
        setGoaliePos('center');
      } else {
        const updated = [...p2History, isGoal];
        setP2History(updated);

        // Check if round 5 completed
        if (round >= 5) {
          const p1Goals = p1History.filter(Boolean).length;
          const p2Goals = updated.filter(Boolean).length;
          if (p1Goals > p2Goals) {
            setWinner('p1');
          } else if (p2Goals > p1Goals) {
            setWinner('p2');
          } else {
            // sudden death round 6
            setRound((prev) => prev + 1);
            setTurn('p1');
            setBallState('idle');
            setKickTarget(null);
            setGoaliePos('center');
          }
        } else {
          setRound((prev) => prev + 1);
          setTurn('p1');
          setBallState('idle');
          setKickTarget(null);
          setGoaliePos('center');
        }
      }
    }, 1100);
  };

  const handleReset = () => {
    kakaoAudio.playTap();
    setRound(1);
    setP1History([]);
    setP2History([]);
    setTurn('p1');
    setBallState('idle');
    setKickTarget(null);
    setGoaliePos('center');
    setWinner(null);
  };

  const p1Goals = p1History.filter(Boolean).length;
  const p2Goals = p2History.filter(Boolean).length;

  return (
    <div className="relative w-full h-[480px] bg-gradient-to-b from-[#0284C7] to-[#15803D] rounded-3xl border-3 border-black overflow-hidden flex flex-col justify-between p-3 select-none">
      {/* Scoreboard */}
      <div className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border-2 border-black p-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[#2563EB]">YOU: {p1Goals}</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="text-xs">
                {p1History[i] === true ? '⚽' : p1History[i] === false ? '❌' : '⚪'}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-black uppercase bg-[#FEE500] px-2 py-0.5 rounded-full border border-black">
          Round {round}/5
        </span>

        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="text-xs">
                {p2History[i] === true ? '⚽' : p2History[i] === false ? '❌' : '⚪'}
              </span>
            ))}
          </div>
          <span className="text-xs font-black text-[#DC2626]">{p2Goals} :{opponentName}</span>
        </div>
      </div>

      {/* Football Pitch & Goal Area */}
      <div className="relative w-full h-64 bg-[#22C55E] rounded-2xl border-3 border-black overflow-hidden flex flex-col items-center justify-between p-2 shadow-inner">
        {/* Grass stripes */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-25">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/10' : ''}`} />
          ))}
        </div>

        {/* Goal Post Frame */}
        <div className="relative w-64 h-28 bg-[#38BDF8]/40 border-4 border-white rounded-t-xl shadow-lg flex items-center justify-center overflow-hidden">
          {/* Net Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff44_2px,transparent_2px),linear-gradient(to_bottom,#ffffff44_2px,transparent_2px)] [background-size:12px_12px]" />

          {/* Goalkeeper */}
          <div
            className={`relative z-10 flex flex-col items-center transition-all duration-300 ${
              goaliePos === 'left'
                ? '-translate-x-16 rotate-[-18deg]'
                : goaliePos === 'right'
                ? 'translate-x-16 rotate-[18deg]'
                : 'translate-x-0'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#DC2626] border-2 border-black flex items-center justify-center text-lg shadow-md">
              🧤
            </div>
            <div className="w-8 h-5 bg-[#DC2626] rounded-t-lg border-x-2 border-t-2 border-black" />
          </div>

          {/* Target Zones in Goal */}
          {ballState === 'idle' && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-1 gap-1 z-20">
              {targets.map((tgt) => (
                <button
                  key={tgt.id}
                  onClick={() => handleShoot(tgt.id)}
                  disabled={turn !== 'p1'}
                  className="rounded-lg border border-dashed border-white/60 hover:bg-white/30 active:bg-[#FEE500]/60 flex items-center justify-center text-[10px] font-black text-white drop-shadow-xs transition"
                >
                  🎯
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Goal / Saved Popup */}
        {ballState === 'goal' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-in zoom-in-75 duration-100 bg-[#FEE500] px-5 py-2 rounded-2xl border-3 border-black shadow-xl">
            <span className="font-black text-2xl text-[#191919] tracking-tight">⚽ GOOOAL!</span>
          </div>
        )}

        {ballState === 'saved' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 animate-in zoom-in-75 duration-100 bg-white px-5 py-2 rounded-2xl border-3 border-black shadow-xl">
            <span className="font-black text-2xl text-[#DC2626] tracking-tight">🧤 SAVED!</span>
          </div>
        )}

        {/* Penalty Spot & Ball */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-11 h-11 rounded-full bg-white border-3 border-black shadow-lg flex items-center justify-center text-2xl transition-all duration-500 ${
              ballState !== 'idle' ? '-translate-y-32 scale-75' : ''
            }`}
          >
            ⚽
          </div>
          <div className="w-4 h-1.5 bg-black/40 rounded-full mt-1" />
        </div>
      </div>

      {/* Winner Overlay */}
      {winner && (
        <div className="p-3 bg-white rounded-2xl border-3 border-black shadow-lg text-center animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy className="w-5 h-5 fill-amber-400" />
            <span className="text-xs font-black uppercase text-slate-800">
              {winner === 'p1' ? 'YOU WON THE SHOOTOUT!' : `${opponentName} WON!`}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold">
            Final Score: {p1Goals} - {p2Goals}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-6 py-2 bg-[#FEE500] text-[#191919] font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition"
          >
            Play Another Shootout
          </button>
        </div>
      )}

      {/* Instructions / Kick controls */}
      {!winner && (
        <div className="p-3 bg-white/95 rounded-2xl border-2 border-black text-center">
          <span className="text-xs font-black text-[#191919] block">
            {turn === 'p1' ? 'YOUR TURN TO SHOOT! TAP ANY CORNER IN THE GOAL' : `${opponentName} is taking the penalty...`}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
            Pick top corners or low corners to beat the keeper!
          </span>
        </div>
      )}
    </div>
  );
};
