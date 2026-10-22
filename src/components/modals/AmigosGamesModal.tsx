import React, { useState, useEffect } from 'react';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  multiplayerSocket,
  OnlinePlayerInfo,
  ActiveRoomInfo,
} from '../../services/multiplayerSocket';
import {
  X,
  Gamepad2,
  Trophy,
  Users,
  Smartphone,
  Globe,
  Bot,
  ArrowLeft,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Share2,
  Swords,
  Search,
  CheckCircle2,
  AlertCircle,
  Wifi,
} from 'lucide-react';

import { TugOfWarGame } from '../games/TugOfWarGame';
import { RedHandsGame } from '../games/RedHandsGame';
import { PenaltyKicksGame } from '../games/PenaltyKicksGame';
import { HappyHipposGame } from '../games/HappyHipposGame';
import { PingPongGame } from '../games/PingPongGame';
import { PoolGame } from '../games/PoolGame';
import { TankBattleGame } from '../games/TankBattleGame';
import { TicTacToeGame } from '../games/TicTacToeGame';
import { KnifeThrowGame } from '../games/KnifeThrowGame';
import { AirHockeyGame } from '../games/AirHockeyGame';
import { SpinWarGame } from '../games/SpinWarGame';
import { ConnectFourGame } from '../games/ConnectFourGame';
import { FingerSumoGame } from '../games/FingerSumoGame';

interface AmigosGamesModalProps {
  onClose: () => void;
  initialOpponent?: any;
  initialGameId?: string;
  onShareGameToChat?: (gameName: string) => void;
}

export const AmigosGamesModal: React.FC<AmigosGamesModalProps> = ({
  onClose,
  initialOpponent,
  initialGameId,
  onShareGameToChat,
}) => {
  const friends = kakaoStorage.getFriends().filter((f) => !f.isChannel);
  const defaultOpponent = initialOpponent || friends[1] || friends[0] || {
    id: 'choonsik',
    name: 'Choonsik',
    avatar: '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg',
  };

  const [selectedOpponent, setSelectedOpponent] = useState(defaultOpponent);
  const [playMode, setPlayMode] = useState<'online' | 'computer' | 'local'>('online');
  const [activeGameId, setActiveGameId] = useState<string | null>(initialGameId || null);
  const [stats, setStats] = useState({ p1Wins: 0, p2Wins: 0 });
  const [botDifficulty, setBotDifficulty] = useState<'casual' | 'competitive' | 'master'>('competitive');

  // Real-time multiplayer socket states
  const [isSocketConnected, setIsSocketConnected] = useState(multiplayerSocket.isConnected);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePlayerInfo[]>(multiplayerSocket.onlinePlayers);
  const [activeRoom, setActiveRoom] = useState<ActiveRoomInfo | null>(multiplayerSocket.currentRoom);
  const [isSearchingQueue, setIsSearchingQueue] = useState(multiplayerSocket.isSearchingMatch);
  const [queueSearchSeconds, setQueueSearchSeconds] = useState(0);
  const [showNoOnlineUserFallback, setShowNoOnlineUserFallback] = useState(false);
  const [opponentDisconnectedToast, setOpponentDisconnectedToast] = useState(false);

  // Sync with multiplayerSocket
  useEffect(() => {
    const unsubscribe = multiplayerSocket.subscribe(() => {
      setIsSocketConnected(multiplayerSocket.isConnected);
      setOnlineUsers([...multiplayerSocket.onlinePlayers]);
      setActiveRoom(multiplayerSocket.currentRoom);
      setIsSearchingQueue(multiplayerSocket.isSearchingMatch);

      if (multiplayerSocket.currentRoom) {
        setShowNoOnlineUserFallback(false);
        setActiveGameId(multiplayerSocket.currentRoom.gameId);
      }
    });

    const unsubDisconnect = multiplayerSocket.onOpponentDisconnect(() => {
      setOpponentDisconnectedToast(true);
    });

    return () => {
      unsubscribe();
      unsubDisconnect();
    };
  }, []);

  // Queue timer & fallback when no user is online
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearchingQueue) {
      setQueueSearchSeconds(0);
      setShowNoOnlineUserFallback(false);

      interval = setInterval(() => {
        setQueueSearchSeconds((s) => {
          const next = s + 1;
          // If no user found within 3 seconds, offer fallback to computer
          if (next >= 3) {
            setShowNoOnlineUserFallback(true);
          }
          return next;
        });
      }, 1000);
    } else {
      setQueueSearchSeconds(0);
      setShowNoOnlineUserFallback(false);
    }

    return () => clearInterval(interval);
  }, [isSearchingQueue]);

  const gameCatalog = [
    {
      id: 'tug_of_war',
      name: 'Tug of War',
      category: 'Tapping Duel',
      icon: '🪢',
      bg: 'bg-emerald-500',
      badge: 'POPULAR 🔥',
      desc: 'Rapid tap rope pulling contest against your rival!',
    },
    {
      id: 'air_hockey',
      name: 'Air Hockey',
      category: 'Neon Table',
      icon: '🏒',
      bg: 'bg-cyan-600',
      badge: 'NEW ⚡',
      desc: 'Glowing neon air hockey table with smooth puck physics!',
    },
    {
      id: 'spin_war',
      name: 'Spinner War',
      category: 'Beyblade Clash',
      icon: '🌀',
      bg: 'bg-amber-600',
      badge: 'ACTION 💥',
      desc: 'Charge spinning battle tops to knock rival out of the ring!',
    },
    {
      id: 'connect_four',
      name: 'Four in a Row',
      category: 'Align 4 Discs',
      icon: '🔴',
      bg: 'bg-blue-600',
      badge: 'STRATEGY 🧠',
      desc: 'Drop colorful discs to connect 4 in a line!',
    },
    {
      id: 'finger_sumo',
      name: 'Finger Sumo',
      category: 'Wrestling Ring',
      icon: '🥋',
      bg: 'bg-orange-600',
      badge: 'INTENSE 🏆',
      desc: 'Tap furiously to push your rival sumo out of the dohyo!',
    },
    {
      id: 'tanks',
      name: 'Tank Battle',
      category: 'Combat Arena',
      icon: '🚀',
      bg: 'bg-stone-800',
      badge: 'ACTION 💥',
      desc: 'Maneuver and fire shells with ricochet wall bounces.',
    },
    {
      id: 'ping_pong',
      name: 'Ping Pong',
      category: 'Table Tennis',
      icon: '🏓',
      bg: 'bg-green-600',
      badge: 'TOP 1 🥇',
      desc: 'Classic table tennis duel with smooth paddle physics.',
    },
    {
      id: 'pool',
      name: '8-Ball Pool',
      category: 'Billiards',
      icon: '🎱',
      bg: 'bg-amber-700',
      badge: 'TACTICAL 🎯',
      desc: 'Aim, adjust power, and pocket balls into holes!',
    },
    {
      id: 'knife_throw',
      name: 'Knife Throw',
      category: 'Target Hit',
      icon: '🎯',
      bg: 'bg-amber-600',
      badge: 'CHALLENGE 🗡️',
      desc: 'Stick knives into the rotating log without colliding!',
    },
    {
      id: 'red_hands',
      name: 'Red Hands',
      category: 'Reaction Slap',
      icon: '✋',
      bg: 'bg-purple-600',
      badge: 'CLASSIC ⚡',
      desc: 'Slap or dodge in milliseconds! First to 5 hits wins.',
    },
    {
      id: 'penalty_kicks',
      name: 'Penalty Kicks',
      category: 'Soccer Shootout',
      icon: '⚽',
      bg: 'bg-blue-600',
      badge: 'SPORTS 🏆',
      desc: 'Pick your corner and beat the goalkeeper in 5 rounds.',
    },
    {
      id: 'happy_hippos',
      name: 'Happy Hippos',
      category: 'Hungry Hippos',
      icon: '🦛',
      bg: 'bg-sky-500',
      badge: 'ARCADE 🎈',
      desc: 'Chomp colorful bouncing balls in the pond to win!',
    },
    {
      id: 'tic_tac_toe',
      name: 'Tic-Tac-Toe',
      category: 'Board Game',
      icon: '❌',
      bg: 'bg-indigo-600',
      badge: 'STRATEGY 🧠',
      desc: 'Quick 3-in-a-row tactical showdown.',
    },
  ];

  const handleGameOver = (winner: 'p1' | 'p2') => {
    setTimeout(() => {
      setStats((prev) => ({
        ...prev,
        p1Wins: winner === 'p1' ? prev.p1Wins + 1 : prev.p1Wins,
        p2Wins: winner === 'p2' ? prev.p2Wins + 1 : prev.p2Wins,
      }));
    }, 0);
  };

  // Start matchmaking against another online user
  const handleStartOnlineMatchmaking = (gameId?: string) => {
    kakaoAudio.playTap();
    multiplayerSocket.joinQueue(gameId);
  };

  // Cancel matchmaking
  const handleCancelMatchmaking = () => {
    kakaoAudio.playTap();
    multiplayerSocket.leaveQueue();
  };

  // Challenge a specific online user
  const handleChallengeOnlineUser = (user: OnlinePlayerInfo, gameId = activeGameId || 'tug_of_war') => {
    kakaoAudio.playTap();
    const game = gameCatalog.find((g) => g.id === gameId);
    multiplayerSocket.sendInvite(user.id, gameId, game?.name || 'Amigos 2-Player Game');
  };

  // Switch to Computer vs You fallback mode
  const handleSwitchToComputerMode = (gameId?: string) => {
    kakaoAudio.playTap();
    if (isSearchingQueue) {
      multiplayerSocket.leaveQueue();
    }
    setPlayMode('computer');
    if (gameId) {
      setActiveGameId(gameId);
    }
  };

  const isRealMultiplayerMatch = Boolean(activeRoom && playMode === 'online');
  const activeGame = gameCatalog.find((g) => g.id === activeGameId);

  const opponentName = isRealMultiplayerMatch
    ? activeRoom?.opponent.name || 'Online Player'
    : selectedOpponent?.name || 'Player 2';

  const opponentAvatar = isRealMultiplayerMatch
    ? activeRoom?.opponent.avatar || '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg'
    : selectedOpponent?.avatar || '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg';

  const myRole = activeRoom?.role || 'p1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border-3 border-black max-h-[94vh]">
        {/* Top Header */}
        <div className="px-4 py-3 bg-[#FEE500] border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeGameId ? (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  if (activeRoom) {
                    multiplayerSocket.leaveRoom();
                  }
                  setActiveGameId(null);
                }}
                className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center text-black hover:bg-slate-100 transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
              </div>
            )}

            <div>
              <h2 className="text-base font-black text-[#191919] tracking-tight leading-tight">
                {activeGame ? activeGame.name : '2 Player Games Challenge'}
              </h2>
              <span className="text-[10px] text-black/70 font-extrabold uppercase">
                {isRealMultiplayerMatch
                  ? `Live vs ${opponentName} 🟢`
                  : playMode === 'computer'
                  ? 'Computer vs You 🤖'
                  : playMode === 'online'
                  ? 'Online Multiplayer 🌐'
                  : 'Same Screen 📱'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeGame && onShareGameToChat && (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onShareGameToChat(activeGame.name);
                }}
                title="Invite to Chat"
                className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center text-black hover:bg-slate-100 transition active:scale-95"
              >
                <Share2 className="w-4 h-4 stroke-[2]" />
              </button>
            )}

            <button
              onClick={() => {
                kakaoAudio.playTap();
                if (activeRoom) multiplayerSocket.leaveRoom();
                if (isSearchingQueue) multiplayerSocket.leaveQueue();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 border-2 border-black flex items-center justify-center text-[#191919] transition"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Mode Selector & Stats Bar */}
        <div className="p-2.5 bg-slate-100 border-b-2 border-black flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {/* 3 Main Modes: Online 1v1 | Computer vs You | Same Screen */}
            <div className="grid grid-cols-3 gap-1 bg-white rounded-xl border-2 border-black p-1 flex-1 mr-2">
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setPlayMode('online');
                }}
                className={`py-1 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition ${
                  playMode === 'online' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Online</span>
              </button>

              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  if (isSearchingQueue) multiplayerSocket.leaveQueue();
                  setPlayMode('computer');
                }}
                className={`py-1 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition ${
                  playMode === 'computer' ? 'bg-[#D97706] text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Solo</span>
              </button>

              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  if (isSearchingQueue) multiplayerSocket.leaveQueue();
                  setPlayMode('local');
                }}
                className={`py-1 px-1 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition ${
                  playMode === 'local' ? 'bg-[#DC2626] text-white shadow-xs' : 'text-slate-700 hover:text-black'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Local</span>
              </button>
            </div>

            {/* Score Tracker */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border-2 border-black font-black text-xs shrink-0">
              <span className="text-[#2563EB]">You: {stats.p1Wins}</span>
              <span className="text-slate-400">-</span>
              <span className="text-[#DC2626]">{stats.p2Wins}</span>
            </div>
          </div>

          {/* Sub-bar for Online or Computer Bot settings */}
          {playMode === 'online' && !activeGameId && (
            <div className="flex items-center justify-between text-[11px] font-extrabold bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200">
              <div className="flex items-center gap-1.5 text-blue-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Server Live: {onlineUsers.length} user{onlineUsers.length === 1 ? '' : 's'} online</span>
              </div>
              <button
                onClick={() => handleStartOnlineMatchmaking()}
                disabled={isSearchingQueue}
                className="px-2.5 py-0.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg border border-black shadow-xs font-black text-[10px] active:scale-95"
              >
                {isSearchingQueue ? 'Searching...' : '⚡ Quick Match'}
              </button>
            </div>
          )}

          {playMode === 'computer' && (
            <div className="flex items-center justify-between text-[11px] font-extrabold bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
              <span className="text-amber-900">Difficulty:</span>
              <div className="flex gap-1">
                {(['casual', 'competitive', 'master'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setBotDifficulty(diff);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition ${
                      botDifficulty === diff
                        ? 'bg-[#D97706] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    {diff === 'casual' ? 'Easy' : diff === 'competitive' ? 'Medium' : 'Hard 🔥'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disconnect Toast */}
        {opponentDisconnectedToast && (
          <div className="p-2.5 bg-red-50 border-b-2 border-red-300 flex items-center justify-between animate-in slide-in-from-top">
            <span className="text-xs font-bold text-red-700">
              ⚠️ Online opponent left the game.
            </span>
            <button
              onClick={() => {
                setOpponentDisconnectedToast(false);
                handleSwitchToComputerMode();
              }}
              className="px-2 py-1 bg-[#FEE500] text-black font-black text-[10px] rounded-lg border border-black shadow-xs"
            >
              Play vs Bot 🤖
            </button>
          </div>
        )}

        {/* Modal Body: Active Game or Lobby / Catalog */}
        <div className="p-3 overflow-y-auto flex-1 flex flex-col">
          {activeGameId === 'tug_of_war' ? (
            <TugOfWarGame
              isOnline={playMode !== 'local'}
              isRealMultiplayer={isRealMultiplayerMatch}
              myRole={myRole}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'air_hockey' ? (
            <AirHockeyGame
              isOnline={playMode !== 'local'}
              isRealMultiplayer={isRealMultiplayerMatch}
              myRole={myRole}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'spin_war' ? (
            <SpinWarGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'connect_four' ? (
            <ConnectFourGame
              isOnline={playMode !== 'local'}
              isRealMultiplayer={isRealMultiplayerMatch}
              myRole={myRole}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'finger_sumo' ? (
            <FingerSumoGame
              isOnline={playMode !== 'local'}
              isRealMultiplayer={isRealMultiplayerMatch}
              myRole={myRole}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'tanks' ? (
            <TankBattleGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'tic_tac_toe' ? (
            <TicTacToeGame
              isOnline={playMode !== 'local'}
              isRealMultiplayer={isRealMultiplayerMatch}
              myRole={myRole}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'red_hands' ? (
            <RedHandsGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'penalty_kicks' ? (
            <PenaltyKicksGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'happy_hippos' ? (
            <HappyHipposGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'ping_pong' ? (
            <PingPongGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'pool' ? (
            <PoolGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : activeGameId === 'knife_throw' ? (
            <KnifeThrowGame
              isOnline={playMode !== 'local'}
              opponentName={opponentName}
              opponentAvatar={opponentAvatar}
              onGameOver={handleGameOver}
            />
          ) : (
            /* Game Selection Grid & Matchmaking Lobby */
            <div className="space-y-3">
              {/* Matchmaking Queue Banner if searching */}
              {isSearchingQueue && (
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl border-3 border-black text-white shadow-lg flex flex-col gap-2 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="font-black text-xs">
                        Finding Online Player... ({queueSearchSeconds}s)
                      </span>
                    </div>
                    <button
                      onClick={handleCancelMatchmaking}
                      className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold border border-white/40"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Fallback to solo practice */}
                  {showNoOnlineUserFallback && (
                    <div className="p-2 bg-yellow-400 text-black rounded-xl border border-black shadow-xs flex items-center justify-between animate-in fade-in">
                      <div className="text-[11px] font-black leading-tight">
                        No online player in queue?
                        <p className="font-extrabold text-[10px] text-slate-800">
                          Play in Solo Practice mode!
                        </p>
                      </div>
                      <button
                        onClick={() => handleSwitchToComputerMode('tug_of_war')}
                        className="px-2.5 py-1 bg-black text-[#FEE500] font-black text-xs rounded-lg active:scale-95 shadow-xs"
                      >
                        Solo Practice 🎯
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Online Players Bar (when in Online Mode) */}
              {playMode === 'online' && !isSearchingQueue && (
                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-black flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Live Online Players ({onlineUsers.length})</span>
                    </span>
                    <button
                      onClick={() => handleStartOnlineMatchmaking()}
                      className="px-3 py-1 bg-[#2563EB] hover:bg-blue-700 text-white text-[11px] font-black rounded-xl border border-black shadow-xs active:scale-95"
                    >
                      ⚡ Quick Match
                    </button>
                  </div>

                  {onlineUsers.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1">
                      {onlineUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-300 shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={user.avatar || '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg'}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border border-black"
                            />
                            <div>
                              <div className="font-black text-xs text-slate-900 leading-tight">
                                {user.name}
                              </div>
                              <span className="text-[9px] font-bold text-emerald-600">
                                ● Online & Ready
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleChallengeOnlineUser(user)}
                            className="px-2.5 py-1 bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-[10px] rounded-lg border border-black shadow-xs active:scale-95 flex items-center gap-1"
                          >
                            <Swords className="w-3 h-3" />
                            <span>Challenge</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-center flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-amber-900">
                        No other online players currently connected.
                      </span>
                      <button
                        onClick={() => handleSwitchToComputerMode()}
                        className="px-4 py-1.5 bg-[#D97706] hover:bg-amber-700 text-white text-xs font-black rounded-xl border border-black shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Play Solo Practice Mode</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Opponent Selector (when in Solo mode) */}
              {playMode === 'computer' && (
                <div className="px-3 py-2 bg-amber-50 rounded-2xl border-2 border-black flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-black text-amber-900 uppercase shrink-0">Practice vs:</span>
                  {friends.slice(0, 7).map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => {
                        kakaoAudio.playTap();
                        setSelectedOpponent(friend);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-black text-xs font-black shrink-0 transition ${
                        selectedOpponent?.id === friend.id
                          ? 'bg-[#FEE500] text-black shadow-xs scale-105'
                          : 'bg-white text-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      <img src={friend.avatar} alt={friend.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{friend.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Featured Banner */}
              <div
                onClick={() => {
                  kakaoAudio.playTap();
                  setActiveGameId('tug_of_war');
                }}
                className="p-4 bg-gradient-to-r from-[#2563EB] to-[#DC2626] rounded-3xl border-3 border-black text-white shadow-md flex items-center justify-between cursor-pointer hover:scale-[1.01] transition active:scale-95"
              >
                <div>
                  <span className="text-[10px] font-black uppercase bg-[#FEE500] text-black px-2 py-0.5 rounded-full border border-black inline-block mb-1">
                    Featured 1v1
                  </span>
                  <h3 className="font-black text-lg leading-tight">Tug of War Duel!</h3>
                  <p className="text-xs text-white/90 font-bold mt-0.5">
                    Fastest tapping fingers win the rope match!
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl border-2 border-white flex items-center justify-center text-3xl">
                  🪢
                </div>
              </div>

              {/* Games Grid (All 13 Games) */}
              <div className="grid grid-cols-2 gap-2.5">
                {gameCatalog.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setActiveGameId(game.id);
                    }}
                    className="p-3 bg-white hover:bg-amber-50/70 border-3 border-black rounded-2xl shadow-[0_3px_0_#000] active:translate-y-0.5 active:shadow-none transition flex flex-col text-left gap-1.5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-black flex items-center justify-center text-2xl shadow-xs">
                        {game.icon}
                      </div>
                      <span className="text-[9px] font-black bg-[#FEE500] text-black px-1.5 py-0.5 rounded-md border border-black">
                        {game.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-xs text-[#191919] leading-tight">{game.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-snug line-clamp-1 mt-0.5">
                        {game.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
