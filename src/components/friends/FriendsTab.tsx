import React, { useState, useEffect } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import { handleAvatarError } from '../../utils/imageUtils';
import {
  Search,
  UserPlus,
  Music,
  Star,
  Cake,
  Gift,
  ChevronRight,
  Plus,
  Sparkles,
  QrCode,
  Bell,
  Trash2,
  Users,
  UserCheck,
} from 'lucide-react';
import { NotificationsModal } from '../modals/NotificationsModal';
import { FeedView } from '../feed/FeedView';

interface FriendsTabProps {
  currentUser: KakaoUser;
  onSelectUser: (user: KakaoUser) => void;
  onOpenMyProfile: () => void;
  onOpenAddFriend: () => void;
  onOpenSettings?: () => void;
  onSendGift: (user: KakaoUser) => void;
  onOpenQR?: () => void;
  onOpenAuth?: () => void;
  onFriendUpdated?: () => void;
  onOpenCalendar?: () => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  currentUser,
  onSelectUser,
  onOpenMyProfile,
  onOpenAddFriend,
  onOpenSettings,
  onSendGift,
  onOpenQR,
  onOpenAuth,
  onFriendUpdated,
  onOpenCalendar,
}) => {
  const [homeViewMode, setHomeViewMode] = useState<'feed' | 'friends' | 'online'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [friends, setFriends] = useState<KakaoUser[]>(() => kakaoStorage.getFriends());
  const [activeFriendFilter, setActiveFriendFilter] = useState<'friends' | 'following' | 'online'>('friends');
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);

  const [onlineFriends, setOnlineFriends] = useState<KakaoUser[]>(() =>
    multiplayerSocket.getOnlineFriends(friends)
  );

  useEffect(() => {
    const sync = () => setFriends(kakaoStorage.getFriends());
    sync();
    window.addEventListener('kakao_storage_update', sync);
    const interval = setInterval(sync, 1500);

    const syncOnline = () => {
      setOnlineFriends(multiplayerSocket.getOnlineFriends(kakaoStorage.getFriends()));
    };
    syncOnline();
    const unsubSocket = multiplayerSocket.subscribe(syncOnline);

    return () => {
      window.removeEventListener('kakao_storage_update', sync);
      clearInterval(interval);
      unsubSocket();
    };
  }, []);

  const handleRemoveFriend = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kakaoAudio.playTap();
    setFriendToRemove({ id, name });
  };

  const handleToggleFollow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kakaoAudio.playTap();
    kakaoStorage.toggleFollowFriend(id);
    setFriends(kakaoStorage.getFriends());
    if (onFriendUpdated) onFriendUpdated();
  };

  const favoriteFriends = friends.filter((f) => f.isFavorite && !f.isChannel);
  const birthdayFriends = friends.filter((f) => f.isBirthdayToday);
  const channels = friends.filter((f) => f.isChannel);
  const regularFriends = friends.filter((f) => !f.isChannel);
  const followingFriends = friends.filter((f) => f.isFollowing && !f.isChannel);

  const filteredFriends = regularFriends.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.koreanName && f.koreanName.toLowerCase().includes(q)) ||
      (f.statusMessage && f.statusMessage.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-y-auto pb-20">
      {/* Unified Sticky Header & Sub-header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-2xs">
        {/* Top Header Bar matching exact screenshot */}
        <header className="px-4 py-3 flex items-center justify-between">
          {/* Left: App Logo + Name */}
          <div
            onClick={() => {
              kakaoAudio.playTap();
              onOpenMyProfile();
            }}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition"
          >
            <img
              src="/Amigos Chat Logo Reveal.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="Amigos Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-100"
            />
            <div>
              <h1 className="text-lg font-black text-[#191919] tracking-tight leading-none">
                Amigos
              </h1>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                {currentUser.name}
              </span>
            </div>
          </div>

          {/* Right 4 icon buttons in exact order: Search, Add Friend, QR, Bell */}
          <div className="flex items-center gap-3 text-slate-800">
            <button
              onClick={() => {
                kakaoAudio.playTap();
                setIsSearchOpen((prev) => !prev);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
              title="Search"
            >
              <Search className="w-5 h-5 text-slate-800" />
            </button>

            <button
              onClick={() => {
                kakaoAudio.playTap();
                onOpenAddFriend();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
              title="Add Friend"
            >
              <UserPlus className="w-5 h-5 text-slate-800" />
            </button>

            {onOpenQR && (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenQR();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
                title="Scan QR Code / My QR"
              >
                <QrCode className="w-5 h-5 text-slate-800" />
              </button>
            )}

            <button
              onClick={() => {
                kakaoAudio.playTap();
                setIsNotificationsOpen(true);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-800" />
              {kakaoStorage.getUnreadNotificationCount() > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </header>

        {/* Expandable Search Input */}
        {isSearchOpen && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or status message..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-[#FEE500]"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Feed & Friends Sub-header Pills (matching screenshot & user request) */}
        <div className="px-4 pt-1.5 pb-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              kakaoAudio.playTap();
              setHomeViewMode('feed');
            }}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
              homeViewMode === 'feed'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            Feed
          </button>

          <button
            type="button"
            onClick={() => {
              kakaoAudio.playTap();
              setHomeViewMode('friends');
            }}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all active:scale-95 ${
              homeViewMode === 'friends'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            Friends
          </button>

          {/* Online Tab on home screen - only visible when real friends are online */}
          {onlineFriends.length > 0 && (
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setHomeViewMode('online');
              }}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                homeViewMode === 'online'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  homeViewMode === 'online' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {onlineFriends.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* When Online Mode is active on Home Screen */}
      {homeViewMode === 'online' && !searchQuery ? (
        <div className="px-4 py-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-extrabold text-[#191919] tracking-tight">
                Live Online Friends ({onlineFriends.length})
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Now
            </span>
          </div>

          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <div
                key={`home_online_${friend.id}`}
                onClick={() => {
                  kakaoAudio.playTap();
                  onSelectUser(friend);
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-emerald-100 shadow-xs transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-300 bg-slate-100 shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      onError={(e) => handleAvatarError(e, friend.name)}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#191919] truncate">{friend.name}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        LIVE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[210px] mt-0.5">
                      {friend.statusMessage || 'Online right now'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    kakaoAudio.playTap();
                    onSelectUser(friend);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] text-xs font-black transition active:scale-95 shadow-2xs shrink-0"
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : homeViewMode === 'feed' && !searchQuery ? (
        <FeedView
          currentUser={currentUser}
          friends={friends}
          onSelectUser={onSelectUser}
          onStartChatWithUser={onSelectUser}
          onOpenCalendar={onOpenCalendar}
        />
      ) : (
        <>
          {/* My Profile Row (Click opens Profile Modal) */}
          <div className="px-4 py-3 border-b border-slate-100">
        <div
          onClick={() => {
            kakaoAudio.playTap();
            onOpenMyProfile();
          }}
          className="flex items-center justify-between p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 shadow-sm bg-slate-100 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                onError={(e) => handleAvatarError(e, currentUser.name)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#191919] truncate">{currentUser.name}</h2>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[210px] mt-0.5">
                {currentUser.statusMessage}
              </p>
            </div>
          </div>

          {/* BGM tag if present */}
          {currentUser.musicTrack && (
            <div className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-700 flex items-center gap-1 shrink-0 border border-slate-200/80">
              <Music className="w-3 h-3 text-[#191919]" />
              <span className="truncate max-w-[80px]">{currentUser.musicTrack.title}</span>
            </div>
          )}
        </div>

        {/* Multi-profile switcher chips */}
        {currentUser.multiProfiles && currentUser.multiProfiles.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Multi-Profile:</span>
            {currentUser.multiProfiles.map((mp, idx) => (
              <div
                key={`mp_${mp.id}_${idx}`}
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenMyProfile();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer shrink-0 transition"
              >
                <img src={mp.avatar} alt={mp.name} className="w-4 h-4 rounded-full object-cover" />
                <span className="font-semibold text-slate-700">{mp.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Birthday Friends Section */}
      {birthdayFriends.length > 0 && !searchQuery && (
        <div className="px-4 py-3 border-b border-slate-100 bg-amber-50/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#191919]">
              <Cake className="w-4 h-4 text-rose-500" />
              <span>Today's Birthdays ({birthdayFriends.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">Send gifts to wish them well</span>
          </div>

          <div className="space-y-2">
            {birthdayFriends.map((bf) => (
              <div
                key={bf.id}
                className="flex items-center justify-between p-2 rounded-2xl bg-white border border-amber-200 shadow-sm"
              >
                <div
                  onClick={() => {
                    kakaoAudio.playTap();
                    onSelectUser(bf);
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-amber-300">
                    <img
                      src={bf.avatar}
                      alt={bf.name}
                      onError={(e) => handleAvatarError(e, bf.name)}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px]">
                      🎂
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-[#191919] truncate block">
                      {bf.name}
                    </span>
                    <span className="text-[11px] text-rose-600 font-semibold truncate block">
                      Celebrating birthday today! 🎉
                    </span>
                  </div>
                </div>

                {/* Send Gift Button */}
                <button
                  onClick={() => {
                    kakaoAudio.playTap();
                    onSendGift(bf);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Send Gift</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend, Following & Online Options (Right above Favorites) */}
      {!searchQuery && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setActiveFriendFilter('friends');
              }}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition whitespace-nowrap ${
                activeFriendFilter === 'friends'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#191919] shrink-0" />
              <span className="truncate">Friend</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeFriendFilter === 'friends' ? 'bg-[#FEE500] text-black' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {regularFriends.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setActiveFriendFilter('following');
              }}
              className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition whitespace-nowrap ${
                activeFriendFilter === 'following'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Following</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeFriendFilter === 'following' ? 'bg-[#FEE500] text-black' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {followingFriends.length}
              </span>
            </button>

            {onlineFriends.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setActiveFriendFilter('online');
                }}
                className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition whitespace-nowrap ${
                  activeFriendFilter === 'online'
                    ? 'bg-white text-[#191919] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Online</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeFriendFilter === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {onlineFriends.length}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Online Friends View (When Online tab is active) */}
      {activeFriendFilter === 'online' && !searchQuery && (
        <div className="px-4 py-3 border-b border-slate-100 bg-emerald-50/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Online Friends ({onlineFriends.length})</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold">Currently Active</span>
          </div>

          {onlineFriends.length === 0 ? (
            <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 px-4">
              <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-lg">
                👥
              </span>
              <p className="text-xs font-bold text-slate-700">No friends online right now</p>
              <p className="text-[11px] text-slate-400 mt-1">
                When your friends log in or connect in another tab, they will appear here live!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {onlineFriends.map((friend) => (
                <div
                  key={`online_tab_${friend.id}`}
                  onClick={() => {
                    kakaoAudio.playTap();
                    onSelectUser(friend);
                  }}
                  className="flex items-center justify-between p-2 rounded-2xl bg-white hover:bg-slate-50 border border-emerald-100 transition cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border border-emerald-300 bg-slate-100 shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        onError={(e) => handleAvatarError(e, friend.name)}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#191919] truncate">{friend.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Online
                        </span>
                      </div>
                      {friend.statusMessage && (
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {friend.statusMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      kakaoAudio.playTap();
                      onSelectUser(friend);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] transition shadow-2xs"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following Friends View (When Following tab is active) */}
      {activeFriendFilter === 'following' && !searchQuery && (
        <div className="px-4 py-3 border-b border-slate-100 bg-amber-50/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Following List ({followingFriends.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">Profiles you are following</span>
          </div>

          {followingFriends.length === 0 ? (
            <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 px-4">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No one followed yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tap on any friend's profile to follow them and get their latest stories!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {followingFriends.map((friend) => {
                const isOnline = onlineFriends.some(
                  (onF) => onF.id === friend.id || onF.name.toLowerCase() === friend.name.toLowerCase()
                );
                return (
                  <div
                    key={`following_${friend.id}`}
                    onClick={() => {
                      kakaoAudio.playTap();
                      onSelectUser(friend);
                    }}
                    className="flex items-center justify-between p-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 transition cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-amber-300 bg-slate-100 shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          onError={(e) => handleAvatarError(e, friend.name)}
                          className="w-full h-full object-cover"
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#191919] truncate">{friend.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Following
                          </span>
                        </div>
                        {friend.statusMessage && (
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {friend.statusMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(friend.id, e)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition"
                        title="Unfollow"
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Favorites */}
      {favoriteFriends.length > 0 && !searchQuery && activeFriendFilter === 'friends' && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Favorites ({favoriteFriends.length})
            </h3>
          </div>

          <div className="space-y-1">
            {favoriteFriends.map((friend) => (
              <div
                key={`fav_${friend.id}`}
                onClick={() => {
                  kakaoAudio.playTap();
                  onSelectUser(friend);
                }}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-full border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      onError={(e) => handleAvatarError(e, friend.name)}
                      className="w-full h-full object-cover rounded-full"
                    />
                    {onlineFriends.some(
                      (onF) => onF.id === friend.id || onF.name.toLowerCase() === friend.name.toLowerCase()
                    ) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#191919] truncate">{friend.name}</span>
                    </div>
                    {friend.statusMessage && (
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {friend.statusMessage}
                      </p>
                    )}
                  </div>
                </div>

                {friend.musicTrack && (
                  <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 flex items-center gap-1 shrink-0 border border-slate-200/60">
                    <Music className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{friend.musicTrack.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel Section */}
      {channels.length > 0 && !searchQuery && activeFriendFilter === 'friends' && (
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Channels ({channels.length})
          </h3>
          <div className="space-y-1">
            {channels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => {
                  kakaoAudio.playTap();
                  onSelectUser(ch);
                }}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={ch.avatar}
                      alt={ch.name}
                      onError={(e) => handleAvatarError(e, ch.name)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-[#191919] truncate block">{ch.name}</span>
                    <span className="text-[11px] text-slate-400 truncate block">{ch.statusMessage}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#FEE500] bg-slate-900 px-2 py-0.5 rounded-md shrink-0">
                  Channel
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Alphabetical List */}
      {(activeFriendFilter === 'friends' || searchQuery) && (
        <div className="px-4 py-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Friends ({filteredFriends.length})
          </h3>

        <div className="space-y-1">
          {filteredFriends.map((friend) => (
            <div
              key={`friend_${friend.id}`}
              onClick={() => {
                kakaoAudio.playTap();
                onSelectUser(friend);
              }}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-full border border-slate-200 bg-slate-100 shrink-0">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    onError={(e) => handleAvatarError(e, friend.name)}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {onlineFriends.some(
                    (onF) => onF.id === friend.id || onF.name.toLowerCase() === friend.name.toLowerCase()
                  ) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#191919] truncate">{friend.name}</span>
                  </div>
                  {friend.statusMessage && (
                    <p className="text-[11px] text-slate-500 truncate max-w-[210px]">
                      {friend.statusMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {friend.musicTrack && (
                  <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 flex items-center gap-1 border border-slate-200/60">
                    <Music className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{friend.musicTrack.title}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => handleRemoveFriend(friend.id, friend.name, e)}
                  title="Remove friend"
                  className="p-1 text-slate-300 hover:text-rose-500 rounded-md hover:bg-slate-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
        </>
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
          onOpenQR={onOpenQR}
        />
      )}

      {/* Remove Friend In-App Confirmation Modal */}
      {friendToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Friend?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{friendToRemove.name}</span> from your friends list?
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setFriendToRemove(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  kakaoStorage.deleteFriend(friendToRemove.id);
                  setFriends(kakaoStorage.getFriends());
                  setFriendToRemove(null);
                  if (onFriendUpdated) onFriendUpdated();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
