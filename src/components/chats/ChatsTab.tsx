import React, { useState, useEffect } from 'react';
import { KakaoChat, KakaoUser, OpenChatRoom } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import { handleAvatarError } from '../../utils/imageUtils';
import {
  Search,
  MessageSquarePlus,
  Settings,
  Pin,
  BellOff,
  Users,
  User,
  Check,
  X,
  Lock,
  CheckCheck,
  MoreVertical,
  Trash2,
  Volume2,
  Globe,
  Compass,
  Plus,
  MessageCircle,
  Gift,
} from 'lucide-react';

interface ChatsTabProps {
  onSelectChat: (chat: KakaoChat) => void;
  onOpenSettings?: () => void;
  onOpenGiftShop?: () => void;
  onChatsUpdated?: () => void;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({
  onSelectChat,
  onOpenSettings,
  onOpenGiftShop,
  onChatsUpdated,
}) => {
  const [activeChatTab, setActiveChatTab] = useState<'friends' | 'groups'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatType, setNewChatType] = useState<'direct' | 'group' | 'secret'>('direct');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [chats, setChats] = useState<KakaoChat[]>(() => kakaoStorage.getChats());
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<KakaoChat | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  const friends = kakaoStorage.getFriends().filter((f) => !f.isChannel);

  const [onlineFriends, setOnlineFriends] = useState<KakaoUser[]>(() =>
    multiplayerSocket.getOnlineFriends(friends)
  );

  useEffect(() => {
    // Refresh chats whenever storage changes or interval
    const sync = () => setChats(kakaoStorage.getChats());
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

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 2500);
  };

  const handleMarkAllRead = () => {
    kakaoAudio.playTap();
    kakaoStorage.markAllChatsAsRead();
    setChats(kakaoStorage.getChats());
    onChatsUpdated?.();
    showToast('All chats marked as read ✓');
  };

  const handleTogglePin = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    kakaoAudio.playTap();
    kakaoStorage.togglePinChat(chatId);
    const updated = kakaoStorage.getChats();
    setChats(updated);
    setActiveMenuChatId(null);
    onChatsUpdated?.();
    const isNowPinned = updated.find((c) => c.id === chatId)?.isPinned;
    showToast(isNowPinned ? 'Chat pinned to top 📌' : 'Chat unpinned');
  };

  const handleToggleMute = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    kakaoAudio.playTap();
    kakaoStorage.toggleMuteChat(chatId);
    const updated = kakaoStorage.getChats();
    setChats(updated);
    setActiveMenuChatId(null);
    onChatsUpdated?.();
    const isNowMuted = updated.find((c) => c.id === chatId)?.isMuted;
    showToast(isNowMuted ? 'Notifications muted 🔕' : 'Notifications unmuted 🔔');
  };

  const handleMarkChatReadUnread = (chat: KakaoChat, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    kakaoAudio.playTap();
    if (chat.unreadCount > 0) {
      kakaoStorage.markChatAsRead(chat.id);
      showToast('Chat marked as read ✓');
    } else {
      const all = kakaoStorage.getChats();
      const target = all.find((c) => c.id === chat.id);
      if (target) {
        target.unreadCount = 1;
        kakaoStorage.saveChats(all);
      }
      showToast('Chat marked as unread (1)');
    }
    const updated = kakaoStorage.getChats();
    setChats(updated);
    onChatsUpdated?.();
    setActiveMenuChatId(null);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    kakaoAudio.playTap();
    kakaoStorage.deleteChat(chatToDelete.id);
    try {
      await fetch(`/api/chats/${chatToDelete.id}`, { method: 'DELETE' });
    } catch {}
    setChats(kakaoStorage.getChats());
    onChatsUpdated?.();
    setChatToDelete(null);
    setActiveMenuChatId(null);
    showToast('Chat deleted successfully');
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      const hours = date.getHours();
      const mins = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return `${h12}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getMessageSnippet = (chat: KakaoChat) => {
    const last = chat.lastMessage;
    if (!last) return 'New conversation started.';
    if (last.emoticon) return '[Sticker] ' + last.emoticon.title;
    if (last.payTransfer) return `[Amigos Pay Transfer] ₳${last.payTransfer.amount.toLocaleString()}`;
    if (last.giftItem) return `[Gift] ${last.giftItem.title}`;
    if (last.photoUrl) return '[Photo]';
    if (last.voiceNote) return `[Voice Note ${last.voiceNote.duration}s]`;
    return last.text || '';
  };

  const openChatRooms = kakaoStorage.getOpenChatRooms();
  const joinedOpenChatRooms = openChatRooms.filter((r) => r.isJoined);
  const discoverOpenChatRooms = openChatRooms.filter((r) => !r.isJoined);

  const friendChats = chats.filter((c) => c.type === 'direct');
  const groupChats = chats.filter((c) => c.type === 'group' || c.type === 'openchat');

  const currentTabChats = activeChatTab === 'friends' ? friendChats : groupChats;

  const filteredChats = currentTabChats
    .filter((c) => {
      if (filterOnlineOnly && c.type === 'direct') {
        const participant = c.participants[0];
        const isOnline = onlineFriends.some(
          (f) => f.id === participant?.id || f.name.toLowerCase() === participant?.name.toLowerCase()
        );
        if (!isOnline) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.participants.some((p) => p.name.toLowerCase().includes(q)) ||
        (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  const handleStartDirectChat = (friend: KakaoUser) => {
    kakaoAudio.playTap();
    const directChat = kakaoStorage.getOrCreateDirectChat(friend);
    setChats(kakaoStorage.getChats());
    onSelectChat(directChat);
  };

  const handleOpenOpenChatRoom = (room: OpenChatRoom) => {
    kakaoAudio.playTap();
    const chat = kakaoStorage.joinOpenChat(room.id);
    setChats(kakaoStorage.getChats());
    onSelectChat(chat);
  };

  const handleCreateChat = () => {
    if (selectedFriendIds.length === 0) return;
    kakaoAudio.playTap();

    const selectedFriends = friends.filter((f) => selectedFriendIds.includes(f.id));
    let newChat: KakaoChat;

    if (selectedFriends.length === 1 && newChatType !== 'secret') {
      newChat = kakaoStorage.getOrCreateDirectChat(selectedFriends[0]);
    } else {
      const groupTitle =
        newChatType === 'secret'
          ? `Secret Chat (${selectedFriends.map((f) => f.name).join(', ')})`
          : `${selectedFriends.map((f) => f.name).join(', ')} (${selectedFriends.length + 1})`;

      newChat = {
        id: `chat_custom_${Date.now()}`,
        type: newChatType === 'secret' ? 'direct' : 'group',
        title: groupTitle,
        participants: selectedFriends,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
        updatedAt: Date.now(),
      };
      const current = kakaoStorage.getChats();
      current.unshift(newChat);
      kakaoStorage.saveChats(current);
    }

    setChats(kakaoStorage.getChats());
    setShowNewChatModal(false);
    setSelectedFriendIds([]);
    onSelectChat(newChat);
  };

  const toggleSelectFriend = (id: string) => {
    kakaoAudio.playTap();
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-y-auto pb-20">
      {/* Sticky Top Controls Wrapper - Prevents any overlap or cut off */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-2xs">
        {/* Top Header Bar */}
        <header className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/Amigos Chat Logo Reveal.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="Amigos Logo"
              className="w-7 h-7 object-contain rounded-lg shadow-2xs border border-slate-100"
            />
            <h1 className="text-xl font-extrabold text-[#191919] tracking-tight">Chats</h1>
          </div>

          <div className="flex items-center gap-2 text-slate-800">
            <button
              onClick={handleMarkAllRead}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95 relative"
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5 text-slate-800" />
              {chats.some((c) => c.unreadCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={() => {
                kakaoAudio.playTap();
                setIsSearchOpen((prev) => !prev);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
              title="Search Chats"
            >
              <Search className="w-5 h-5 text-slate-800" />
            </button>

            <button
              onClick={() => {
                kakaoAudio.playTap();
                setShowNewChatModal(true);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
              title="New Chat"
            >
              <MessageSquarePlus className="w-5 h-5 text-slate-800" />
            </button>

            {/* Gift Shop Button (Replaces Settings as requested by user) */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                onOpenGiftShop?.();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 transition active:scale-95 text-amber-500"
              title="Gifts & Coupons Shop"
            >
              <Gift className="w-5 h-5 fill-amber-100" />
            </button>
          </div>
        </header>

        {/* Floating Action Toast */}
        {actionToast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#191919] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            {actionToast}
          </div>
        )}

        {/* Expandable Search Input */}
        {isSearchOpen && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-top-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat names, messages..."
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

        {/* Friends & Groups Segmented Filter Switcher */}
        <div className="px-4 pt-1 pb-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setActiveChatTab('friends');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                activeChatTab === 'friends'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4 text-[#191919]" />
              <span>Friends</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeChatTab === 'friends' ? 'bg-[#FEE500] text-black' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {friendChats.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setActiveChatTab('groups');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                activeChatTab === 'groups'
                  ? 'bg-white text-[#191919] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-[#191919]" />
              <span>Groups</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeChatTab === 'groups' ? 'bg-[#FEE500] text-black' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {groupChats.length}
              </span>
            </button>
          </div>
        </div>

        {/* Online Friends option directly under Friends & Groups - only visible when friends are online */}
        {!searchQuery && onlineFriends.length > 0 && (
          <div className="px-4 pt-1.5 pb-2.5 bg-slate-50/90 border-t border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setActiveChatTab('friends');
                  setFilterOnlineOnly((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                  filterOnlineOnly
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online Friends</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    filterOnlineOnly ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {onlineFriends.length}
                </span>
              </button>

              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{onlineFriends.length} {onlineFriends.length === 1 ? 'friend' : 'friends'} live</span>
              </span>
            </div>

            {/* Quick 1-tap Direct Chat Chips for real live online friends */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {onlineFriends.map((f) => (
                <button
                  key={`online_${f.id}`}
                  type="button"
                  onClick={() => handleStartDirectChat(f)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-xs transition active:scale-95 shadow-2xs shrink-0 group"
                  title={`Chat live with ${f.name}`}
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-emerald-300">
                    <img
                      src={f.avatar}
                      alt={f.name}
                      onError={(e) => handleAvatarError(e, f.name)}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-2xs" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs group-hover:text-emerald-800 truncate max-w-[80px]">
                    {f.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Chat
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* When filtering by online only and none are online */}
      {!searchQuery && filterOnlineOnly && onlineFriends.length === 0 && (
        <div className="p-6 text-center bg-slate-50/80 border-b border-slate-100">
          <span className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-lg shadow-2xs">
            👥
          </span>
          <p className="text-xs font-bold text-slate-700">No friends online right now</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] mx-auto">
            Friends will appear here automatically when they log in or connect in another tab!
          </p>
          <button
            type="button"
            onClick={() => setFilterOnlineOnly(false)}
            className="mt-3 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
          >
            Show All Chats
          </button>
        </div>
      )}

      {/* Chat Threads List */}
      <div className="divide-y divide-slate-100">
        {filteredChats.map((chat, idx) => {
          const participant = chat.participants[0];
          const isGroup = chat.type === 'group';
          const isOpenChat = chat.type === 'openchat';
          const isParticipantOnline =
            !isGroup &&
            !isOpenChat &&
            onlineFriends.some(
              (f) => f.id === participant?.id || f.name.toLowerCase() === participant?.name.toLowerCase()
            );

          return (
            <div
              key={`${chat.id}_${idx}`}
              onClick={() => {
                kakaoAudio.playTap();
                if (chat.unreadCount > 0) {
                  kakaoStorage.markChatAsRead(chat.id);
                  setChats((prev) =>
                    prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
                  );
                }
                onSelectChat({ ...chat, unreadCount: 0 });
                onChatsUpdated?.();
              }}
              className="px-4 py-3.5 flex items-center gap-3.5 hover:bg-slate-50 transition cursor-pointer active:scale-[0.99] relative"
            >
              {/* Avatar: single, multi-avatar for group, or openchat cover */}
              <div className="relative shrink-0">
                {isGroup ? (
                  <div className="w-13 h-13 rounded-2xl bg-amber-100/60 p-1 grid grid-cols-2 gap-0.5 border border-amber-200 overflow-hidden">
                    {chat.participants.slice(0, 4).map((p, idx) => (
                      <img
                        key={idx}
                        src={p.avatar}
                        alt={p.name}
                        onError={(e) => handleAvatarError(e, p.name)}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ))}
                  </div>
                ) : isOpenChat ? (
                  <div className="relative w-13 h-13 rounded-2xl overflow-hidden border border-amber-300 shadow-xs bg-slate-100">
                    <img
                      src={chat.openChatCover || chat.participants[0]?.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                      alt={chat.title}
                      onError={(e) => handleAvatarError(e, chat.title)}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-[#FEE500] text-[#191919] text-[8px] font-black px-1 rounded-tl-md">
                      OPEN
                    </span>
                  </div>
                ) : (
                  <div className="relative w-13 h-13 rounded-full border border-slate-200 bg-slate-100 shadow-sm">
                    <img
                      src={participant?.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
                      alt={chat.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleAvatarError(e, participant?.name || chat.title)}
                      className="w-full h-full object-cover rounded-full"
                    />
                    {isParticipantOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-2xs animate-pulse" />
                    )}
                  </div>
                )}

                {/* Pin indicator */}
                {chat.isPinned && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#191919] text-white flex items-center justify-center shadow">
                    <Pin className="w-2.5 h-2.5 fill-white" />
                  </div>
                )}
              </div>

              {/* Chat details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-bold text-[#191919] truncate">{chat.title}</h3>
                    {isGroup && (
                      <span className="text-xs text-slate-400 font-normal shrink-0">
                        {chat.participants.length + 1}
                      </span>
                    )}
                    {chat.isMuted && <BellOff className="w-3 h-3 text-slate-400 shrink-0" />}
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0 font-medium ml-2">
                    {formatTime(chat.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 truncate leading-snug">
                    {getMessageSnippet(chat)}
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Red unread counter badge */}
                    {chat.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white font-extrabold text-[11px] shrink-0 min-w-[20px] text-center shadow-sm">
                        {chat.unreadCount}
                      </span>
                    )}

                    {/* Chat Options 3-dots */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          kakaoAudio.playTap();
                          setActiveMenuChatId((prev) => (prev === chat.id ? null : chat.id));
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition"
                        title="Chat options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu & Backdrop */}
                      {activeMenuChatId === chat.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setActiveMenuChatId(null);
                            }}
                          />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            className="absolute right-0 top-8 z-40 w-44 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleMarkChatReadUnread(chat, e)}
                              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition active:scale-98"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>{chat.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(chat.id, e)}
                              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition active:scale-98"
                            >
                              <Pin className="w-3.5 h-3.5 text-amber-500" />
                              <span>{chat.isPinned ? 'Unpin chat' : 'Pin to top'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleToggleMute(chat.id, e)}
                              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition active:scale-98"
                            >
                              {chat.isMuted ? (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Unmute notifications</span>
                                </>
                              ) : (
                                <>
                                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Mute notifications</span>
                                </>
                              )}
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                kakaoAudio.playTap();
                                setActiveMenuChatId(null);
                                setChatToDelete(chat);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition active:scale-98"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete Chat</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State for Friends */}
      {filteredChats.length === 0 && activeChatTab === 'friends' && (
        <div className="py-12 px-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <User className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Friend Chats Yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5 max-w-xs">
            Start a message conversation with your friends. Tap any friend below to open their chat!
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {friends.slice(0, 4).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleStartDirectChat(f)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-[#FEE500] text-slate-800 text-xs font-bold transition active:scale-95"
              >
                <img src={f.avatar} alt={f.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Groups & OpenChat Section (Active when in Groups tab) */}
      {activeChatTab === 'groups' && (
        <div className="px-4 py-4 space-y-4 bg-slate-50/60 border-t border-slate-100 mt-2">
          {/* Joined OpenChat Groups */}
          {joinedOpenChatRooms.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Joined OpenChat Groups ({joinedOpenChatRooms.length})</span>
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">Active Member</span>
              </div>
              <div className="space-y-2">
                {joinedOpenChatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleOpenOpenChatRoom(room)}
                    className="p-3 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-300 transition cursor-pointer flex items-center justify-between active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img src={room.coverImage} alt={room.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-[#FEE500] text-[#191919] text-[8px] font-black px-1 rounded-tl-md">
                          OPEN
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#191919] truncate">{room.title}</h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{room.lastMessagePreview || room.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                            {room.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {room.membersCount.toLocaleString()} members
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenOpenChatRoom(room);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FEE500] hover:bg-yellow-400 text-black text-xs font-black shrink-0 transition active:scale-95 shadow-2xs"
                    >
                      Open Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discover & Join OpenChat Community Groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>Explore OpenChat Groups to Join</span>
              </span>
              <span className="text-[11px] text-slate-400">Join to chat</span>
            </div>
            <div className="space-y-2">
              {discoverOpenChatRooms.slice(0, 3).map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleOpenOpenChatRoom(room)}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition cursor-pointer flex items-center justify-between active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={room.coverImage} alt={room.title} className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#191919] truncate">{room.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{room.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md">
                          {room.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {room.membersCount.toLocaleString()} members
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenOpenChatRoom(room);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition active:scale-95 shadow-2xs"
                  >
                    Join & Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#191919] mb-1">Delete Chat?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to delete the chat with{' '}
              <span className="font-bold text-slate-800">"{chatToDelete.title}"</span>? All message history will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setChatToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-extrabold text-[#191919]">New Chat</h2>
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setShowNewChatModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Type Segmented Switcher */}
            <div className="flex border-b border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setNewChatType('direct')}
                className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
                  newChatType === 'direct'
                    ? 'border-[#191919] text-[#191919]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Message
              </button>
              <button
                type="button"
                onClick={() => setNewChatType('group')}
                className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
                  newChatType === 'group'
                    ? 'border-[#191919] text-[#191919]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Group Chat
              </button>
              <button
                type="button"
                onClick={() => setNewChatType('secret')}
                className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 flex items-center justify-center gap-1 ${
                  newChatType === 'secret'
                    ? 'border-[#191919] text-[#191919]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Secret</span>
              </button>
            </div>

            {/* Friends Selection Checkbox List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 block mb-2">
                Select Friends ({selectedFriendIds.length} selected)
              </span>

              {friends.map((f) => {
                const isSelected = selectedFriendIds.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleSelectFriend(f.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <span className="text-xs font-bold text-[#191919] block">{f.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[190px]">
                          {f.statusMessage || 'Amigos Friend'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-[#FEE500] border-[#191919] text-[#191919]'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Bottom Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleCreateChat}
                disabled={selectedFriendIds.length === 0}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition shadow-md flex items-center justify-center gap-1.5 ${
                  selectedFriendIds.length > 0
                    ? 'bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Start Chat ({selectedFriendIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
