import React, { useState } from 'react';
import { OpenChatRoom, KakaoChat } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Flame,
  ArrowRight,
  X,
  Check,
} from 'lucide-react';

interface OpenChatTabProps {
  onSelectChat: (chat: KakaoChat) => void;
}

export const OpenChatTab: React.FC<OpenChatTabProps> = ({ onSelectChat }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New room form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('K-Pop & Culture');
  const [newTags, setNewTags] = useState('#music #chat #community');
  const [newDesc, setNewDesc] = useState('');

  const [rooms, setRooms] = useState<OpenChatRoom[]>(kakaoStorage.getOpenChatRooms());

  React.useEffect(() => {
    const unsubscribe = multiplayerSocket.onOpenChatCreated((newRoom) => {
      setRooms((prev) => {
        if (prev.some((r) => r.id === newRoom.id)) return prev;
        const next = [newRoom, ...prev];
        kakaoStorage.saveOpenChatRooms(next);
        return next;
      });
      kakaoAudio.playKaTalkChime();
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'kpop', label: '🎵 K-Pop & Idols' },
    { id: 'tech', label: '💻 Dev & IT' },
    { id: 'food', label: '☕ Food & Cafes' },
  ];

  const filteredRooms = rooms.filter((room) => {
    // Category match
    if (activeCategory === 'trending' && room.membersCount < 500) return false;
    if (activeCategory === 'kpop' && !room.tags.some((t) => t.toLowerCase().includes('k-pop') || t.toLowerCase().includes('idol') || t.toLowerCase().includes('newjeans'))) {
      if (!room.title.toLowerCase().includes('k-pop')) return false;
    }
    if (activeCategory === 'tech' && room.category !== 'Tech & Dev') return false;
    if (activeCategory === 'food' && room.category !== 'Food & Cafe') return false;

    // Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      room.title.toLowerCase().includes(q) ||
      room.description.toLowerCase().includes(q) ||
      room.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleJoinRoom = (room: OpenChatRoom) => {
    kakaoAudio.playTap();
    const chat = kakaoStorage.joinOpenChat(room.id);
    onSelectChat(chat);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    kakaoAudio.playKaTalkChime();

    const tagsArray = newTags
      .split(' ')
      .filter((t) => t.startsWith('#') || t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const createdRoom: OpenChatRoom = {
      id: `oc_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'A friendly open chat room for everyone to join and chat.',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      tags: tagsArray.length > 0 ? tagsArray : ['#OpenChat', '#Community'],
      membersCount: 1,
      maxMembers: 1000,
      category: newCategory,
      hostName: kakaoStorage.getMe().name || 'Me',
      hostAvatar: kakaoStorage.getMe().avatar || '/src/assets/images/happy_white_kitten_1791348895355.jpg',
      isJoined: true,
      lastMessagePreview: 'Chat room created. Say hi and introduce yourself!',
      lastMessageTime: 'Just now',
    };

    const updated = [createdRoom, ...rooms];
    kakaoStorage.saveOpenChatRooms(updated);
    setRooms(updated);
    multiplayerSocket.broadcastOpenChatCreated(createdRoom);
    setShowCreateModal(false);

    // Join and enter immediately
    const chat = kakaoStorage.joinOpenChat(createdRoom.id);
    onSelectChat(chat);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8] select-none overflow-y-auto pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img
            src="/Amigos Chat Logo Reveal.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
            alt="Amigos Logo"
            className="w-7 h-7 object-contain rounded-lg shadow-2xs border border-slate-100"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#191919] tracking-tight leading-none">OpenChat</h1>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Connect through shared passions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-800">
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
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs px-2.5 py-1.5 rounded-full transition shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Room</span>
          </button>
        </div>
      </header>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-slate-100 bg-white animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat room titles, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spotlight Hero Banner */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#FFE812] to-[#FFD000] p-4 text-[#191919] shadow-xs overflow-hidden flex items-center justify-between">
          <div className="z-10 max-w-[70%]">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#3C1E1E]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C1E1E]/80">
                Amigos OpenChat Lite
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-[#191919] leading-tight">
              Join live trending chat rooms!
            </h3>
            <p className="text-[11px] text-[#3C1E1E]/80 mt-1">
              Chat freely and anonymously using custom nicknames and Amigos Friends avatars.
            </p>
          </div>
          <div className="text-4xl select-none animate-bounce">
            🦁
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              kakaoAudio.playTap();
              setActiveCategory(c.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              activeCategory === c.id
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Room Feed List */}
      <div className="px-4 py-2 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            Live OpenChats ({filteredRooms.length})
          </span>
          <span className="text-[11px] text-slate-400">By Popularity</span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No open chat rooms found.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to create one!</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleJoinRoom(room)}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-[#FEE500] hover:shadow-md transition active:scale-[0.99] cursor-pointer flex flex-col gap-2.5"
            >
              {/* Room Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {room.category}
                    </span>
                    {room.membersCount > 500 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                        <Flame className="w-3 h-3 fill-current" />
                        HOT
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-[#191919] text-sm leading-snug">
                    {room.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {room.description}
                  </p>
                </div>

                <img
                  src={room.coverImage}
                  alt={room.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {room.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bottom Info Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <img
                    src={room.hostAvatar}
                    alt={room.hostName}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>Host: {room.hostName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {room.membersCount.toLocaleString()} / {room.maxMembers}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRoom(room);
                    }}
                    className="px-2.5 py-1 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold rounded-lg text-xs flex items-center gap-0.5 transition shadow-xs"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#FEE500] flex items-center justify-between">
              <span className="font-extrabold text-[#191919] text-base">Create OpenChat Room</span>
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setShowCreateModal(false);
                }}
                className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[#191919] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chat Room Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seoul Cafe Explorers & Coffee Meetups ☕️"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
                >
                  <option value="K-Pop & Culture">K-Pop & Culture</option>
                  <option value="Tech & Dev">Tech & Dev</option>
                  <option value="Food & Cafe">Food & Cafe</option>
                  <option value="Study & Routine">Study & Routine</option>
                  <option value="Free Chat">Community & Social</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hashtags
                </label>
                <input
                  type="text"
                  placeholder="#Seoul #Cafe #Meetup"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Room Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Share a short welcome message or room rules for members."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-sm rounded-xl transition shadow-sm active:scale-95 mt-2 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Create OpenChat Room</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
