import React, { useState, useEffect, useRef } from 'react';
import {
  KakaoChat,
  KakaoMessage,
  KakaoUser,
  KakaoEmoticon,
} from '../../types/kakaotalk';
import { kakaoStorage, KAKAO_EMOTICONS } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  ChevronLeft,
  Search,
  Phone,
  Video,
  Menu,
  Plus,
  Smile,
  Send,
  Mic,
  Image,
  Camera,
  Coins,
  Calendar,
  Vote,
  MapPin,
  Check,
  CheckCheck,
  X,
  Play,
  Pause,
  BellOff,
  Bell,
  Trash2,
  Gift,
  Barcode,
  Gamepad2,
} from 'lucide-react';
import { multiplayerSocket } from '../../services/multiplayerSocket';

interface ChatRoomViewProps {
  chat: KakaoChat;
  currentUser: KakaoUser;
  onBack: () => void;
  onChatRead?: () => void;
  onStartCall: (user: KakaoUser, type: 'voice' | 'video') => void;
  onOpenSendMoney: (user: KakaoUser) => void;
  onOpenGift: (user: KakaoUser) => void;
  onOpenGames?: (user: KakaoUser) => void;
}

export const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  chat,
  currentUser,
  onBack,
  onChatRead,
  onStartCall,
  onOpenSendMoney,
  onOpenGift,
  onOpenGames,
}) => {
  const [messages, setMessages] = useState<KakaoMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmoticonDrawer, setShowEmoticonDrawer] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [selectedCharacterTab, setSelectedCharacterTab] = useState<'all' | 'ryan' | 'choonsik' | 'apeach'>('all');
  const [wallpaperColor, setWallpaperColor] = useState(chat.wallpaper || '#BACEE0'); // Classic Amigos Blue
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const primaryRecipient = chat.participants[0] || {
    id: 'unknown',
    name: chat.title,
    avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
  };

  useEffect(() => {
    kakaoStorage.markChatAsRead(chat.id);
    onChatRead?.();
    const msgs = kakaoStorage.getMessages(chat.id);
    setMessages(msgs);

    // Sync any messages from server for this chat to guarantee persistence
    fetch(`/api/messages?chatId=${chat.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          data.messages.forEach((m: KakaoMessage) => {
            kakaoStorage.saveMessage(m);
          });
          setMessages(kakaoStorage.getMessages(chat.id));
        }
      })
      .catch(() => {});
  }, [chat.id]);

  // Real-time online messaging via WebSocket & BroadcastChannel
  useEffect(() => {
    const unsubscribe = multiplayerSocket.onChatMessage((msg, openChatId, recipientId) => {
      const isRelevant =
        msg.chatId === chat.id ||
        (chat.isOpenChat && (chat.openChatRoomId === openChatId || chat.id === openChatId)) ||
        (!chat.isOpenChat && (msg.senderId === primaryRecipient.id || (recipientId === currentUser.id && msg.senderId === primaryRecipient.id)));

      if (isRelevant) {
        const normalizedMsg = { ...msg, chatId: chat.id };
        kakaoStorage.saveMessage(normalizedMsg);
        setMessages((prev) => {
          if (prev.some((m) => m.id === normalizedMsg.id)) return prev;
          return [...prev, normalizedMsg];
        });
        kakaoAudio.playKaTalkChime();
        kakaoStorage.markChatAsRead(chat.id);
        onChatRead?.();
      }
    });

    return () => unsubscribe();
  }, [chat.id, primaryRecipient.id, chat.openChatRoomId, chat.isOpenChat, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    kakaoAudio.playSendPop();

    const newMsg: KakaoMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId: chat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: primaryRecipient.id,
      text: inputText.trim(),
      createdAt: Date.now(),
      unreadCount: 1, // yellow 1
    };

    kakaoStorage.saveMessage(newMsg);
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
    setInputText('');

    // Persist on server
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});

    // Broadcast online over WebSocket to live users
    multiplayerSocket.sendChatMessage(
      newMsg,
      chat.isOpenChat ? undefined : primaryRecipient.id,
      chat.isOpenChat ? chat.openChatRoomId || chat.id : undefined
    );
  };

  const handleSendEmoticon = (emoticon: KakaoEmoticon) => {
    kakaoAudio.playSendPop();

    const newMsg: KakaoMessage = {
      id: `msg_emo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId: chat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: primaryRecipient.id,
      emoticon,
      createdAt: Date.now(),
      unreadCount: 1,
    };

    kakaoStorage.saveMessage(newMsg);
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
    setShowEmoticonDrawer(false);

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg),
    }).catch(() => {});

    multiplayerSocket.sendChatMessage(
      newMsg,
      chat.isOpenChat ? undefined : primaryRecipient.id,
      chat.isOpenChat ? chat.openChatRoomId || chat.id : undefined
    );
  };

  const handleSendPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    kakaoAudio.playSendPop();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newMsg: KakaoMessage = {
        id: `msg_photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId: chat.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        recipientId: primaryRecipient.id,
        photoUrl: ev.target?.result as string,
        createdAt: Date.now(),
        unreadCount: 1,
      };
      kakaoStorage.saveMessage(newMsg);
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setShowPlusMenu(false);

      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      }).catch(() => {});

      multiplayerSocket.sendChatMessage(
        newMsg,
        chat.isOpenChat ? undefined : primaryRecipient.id,
        chat.isOpenChat ? chat.openChatRoomId || chat.id : undefined
      );
    };
    reader.readAsDataURL(file);
  };

  const handleReceiveMoney = (msg: KakaoMessage) => {
    if (!msg.payTransfer || msg.payTransfer.isReceived) return;
    kakaoAudio.playPayChime();

    kakaoStorage.receiveMoney(msg.senderName, msg.payTransfer.amount);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id && m.payTransfer
          ? {
              ...m,
              payTransfer: {
                ...m.payTransfer,
                isReceived: true,
                receivedAt: Date.now(),
              },
            }
          : m
      )
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    kakaoAudio.playTap();
    kakaoStorage.deleteMessage(chat.id, messageId);
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    } catch {}
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleClearChatHistory = async () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      kakaoAudio.playTap();
      kakaoStorage.clearChatMessages(chat.id);
      try {
        await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' });
      } catch {}
      setMessages([]);
      setShowSideDrawer(false);
    }
  };

  const handleDeleteAndLeaveChat = async () => {
    if (window.confirm('Delete this conversation completely?')) {
      kakaoAudio.playTap();
      kakaoStorage.deleteChat(chat.id);
      try {
        await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' });
      } catch {}
      setShowSideDrawer(false);
      onBack();
    }
  };

  const formatMsgTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const mins = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
  };

  const filteredEmoticons = KAKAO_EMOTICONS.filter(
    (e) => selectedCharacterTab === 'all' || e.character === selectedCharacterTab
  );

  return (
    <div
      className="flex flex-col h-full select-none relative overflow-hidden transition-colors"
      style={{ backgroundColor: wallpaperColor }}
    >
      {/* Top Chat Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onBack();
            }}
            className="p-1 -ml-1 text-[#191919] hover:bg-slate-100 rounded-full transition active:scale-95"
            title="Back to Chats"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-[#191919] truncate">{chat.title}</h2>
              {chat.type === 'group' && (
                <span className="text-xs font-semibold text-slate-500">
                  {chat.participants.length + 1}
                </span>
              )}
            </div>
            {primaryRecipient.statusMessage && (
              <span className="text-[11px] text-slate-500 truncate block max-w-[200px]">
                {primaryRecipient.statusMessage}
              </span>
            )}
          </div>
        </div>

        {/* Top Right Action Icons */}
        <div className="flex items-center gap-2.5 text-[#191919]">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onStartCall(primaryRecipient, 'voice');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="VoiceTalk Free Call"
          >
            <Phone className="w-4 h-4 text-slate-800" />
          </button>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onStartCall(primaryRecipient, 'video');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="FaceTalk Video Call"
          >
            <Video className="w-4.5 h-4.5 text-slate-800" />
          </button>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onOpenGift(primaryRecipient);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 text-amber-500 transition active:scale-95"
            title="Send Gift"
          >
            <Gift className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              setShowSideDrawer(true);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="Chat Drawer Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Date Marker Header */}
        <div className="flex items-center justify-center my-2">
          <span className="px-3.5 py-1 rounded-full bg-black/15 backdrop-blur-sm text-white font-medium text-[11px] shadow-2xs">
            Sunday, October 4, 2026
          </span>
        </div>

        {messages
          .filter((msg, idx, arr) => arr.findIndex((m) => m.id === msg.id) === idx)
          .map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;

            return (
              <div
                key={`${msg.id || 'msg'}_${idx}`}
                className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
              {/* Receiver avatar */}
              {!isMe && (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 mt-0.5">
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[76%]`}>
                {/* Sender name for group/received */}
                {!isMe && (
                  <span className="text-[11px] font-semibold text-slate-700 mb-1 ml-0.5">
                    {msg.senderName}
                  </span>
                )}

                <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-3 shadow-xs break-words text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#FEE500] text-[#191919] rounded-tr-xs'
                        : 'bg-white text-[#191919] rounded-tl-xs'
                    }`}
                  >
                    {/* Text Message */}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Amigos Emoticon Message */}
                    {msg.emoticon && (
                      <div className="flex flex-col items-center justify-center p-2">
                        <span className="text-5xl animate-bounce mb-1">
                          {msg.emoticon.emoji}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-black/5 px-2 py-0.5 rounded-full">
                          {msg.emoticon.title}
                        </span>
                      </div>
                    )}

                    {/* Photo Message */}
                    {msg.photoUrl && (
                      <div className="rounded-xl overflow-hidden mt-1 border border-black/10 max-w-[220px]">
                        <img
                          src={msg.photoUrl}
                          alt="Photo"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {/* Amigos Pay Transfer Card Message */}
                    {msg.payTransfer && (
                      <div className="w-56 p-3 rounded-xl bg-white border border-amber-300 text-[#191919] shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>Amigos Pay Transfer</span>
                        </div>
                        <div className="text-xl font-black text-[#191919] tracking-tight my-1">
                          ₳{msg.payTransfer.amount.toLocaleString()}
                        </div>
                        {msg.payTransfer.note && (
                          <p className="text-xs text-slate-600 mb-3 bg-amber-50/60 p-1.5 rounded-lg">
                            {msg.payTransfer.note}
                          </p>
                        )}

                        {/* Interactive Receive button */}
                        {msg.payTransfer.isReceived ? (
                          <div className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            <span>Transfer Accepted</span>
                          </div>
                        ) : isMe ? (
                          <div className="text-[11px] text-slate-400 text-center">
                            You will be notified when your friend accepts.
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReceiveMoney(msg)}
                            className="w-full py-2 rounded-xl bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Accept Money</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Gift Coupon Card Message */}
                    {msg.giftItem && (
                      <div className="w-56 p-3 rounded-xl bg-white border border-slate-200 text-[#191919] shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mb-1">
                          <Gift className="w-4 h-4" />
                          <span>A Gift Has Arrived! 🎁</span>
                        </div>
                        <img
                          src={msg.giftItem.imageUrl}
                          alt={msg.giftItem.title}
                          className="w-full h-28 object-cover rounded-lg my-1.5 border border-slate-100"
                        />
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          {msg.giftItem.brand}
                        </span>
                        <h4 className="text-xs font-bold text-[#191919] line-clamp-2 mt-0.5">
                          {msg.giftItem.title}
                        </h4>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            ₳{msg.giftItem.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>View Voucher</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Voice Note player */}
                    {msg.voiceNote && (
                      <div className="flex items-center gap-2.5 py-1">
                        <button
                          onClick={() => {
                            kakaoAudio.playTap();
                            setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id);
                          }}
                          className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center"
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4 fill-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">Voice Message</span>
                          <span className="text-[10px] text-slate-500">
                            00:{msg.voiceNote.duration < 10 ? `0${msg.voiceNote.duration}` : msg.voiceNote.duration}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata: Unread '1' & Timestamp beside bubble & Delete action */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} shrink-0 mb-0.5`}>
                    {/* Amigos yellow '1' for unread status on sent messages */}
                    {isMe && msg.unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-[#FEE500] drop-shadow-2xs">
                        1
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-600 font-medium">
                        {formatMsgTime(msg.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete message"
                        className="text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 p-0.5 rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Partner Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-600 italic bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-2xs w-fit animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">{primaryRecipient.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200 p-2">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Plus (+) Drawer Button */}
          <button
            type="button"
            onClick={() => {
              kakaoAudio.playTap();
              setShowPlusMenu((prev) => !prev);
              setShowEmoticonDrawer(false);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
              showPlusMenu ? 'bg-[#191919] text-white rotate-45' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="More Options"
          >
            <Plus className="w-5 h-5 transition-transform" />
          </button>

          {/* Text Input Container */}
          <div className="flex-1 flex items-center bg-slate-100 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#FEE500] focus-within:bg-white transition border border-transparent focus-within:border-amber-300">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-xs text-[#191919] focus:outline-none placeholder-slate-400 py-1"
            />

            {/* Smiley Emoticon Drawer Button */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowEmoticonDrawer((prev) => !prev);
                setShowPlusMenu(false);
              }}
              className={`p-1 transition ${
                showEmoticonDrawer ? 'text-[#FEE500]' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Amigos Emoticons"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Send or Voice Note Button */}
          {inputText.trim() ? (
            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] flex items-center justify-center shadow-sm transition active:scale-95"
              title="Send Message"
            >
              <Send className="w-4 h-4 ml-0.5 fill-[#191919]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                // Send dummy 3s voice note
                const voiceMsg: KakaoMessage = {
                  id: `msg_voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  chatId: chat.id,
                  senderId: currentUser.id,
                  senderName: currentUser.name,
                  senderAvatar: currentUser.avatar,
                  recipientId: primaryRecipient.id,
                  voiceNote: { duration: 4 },
                  createdAt: Date.now(),
                  unreadCount: 1,
                };
                kakaoStorage.saveMessage(voiceMsg);
                setMessages((prev) => (prev.some((m) => m.id === voiceMsg.id) ? prev : [...prev, voiceMsg]));

                fetch('/api/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(voiceMsg),
                }).catch(() => {});

                multiplayerSocket.sendChatMessage(
                  voiceMsg,
                  chat.isOpenChat ? undefined : primaryRecipient.id,
                  chat.isOpenChat ? chat.openChatRoomId || chat.id : undefined
                );
              }}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95"
              title="Record Voice Note"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
          )}
        </form>

        {/* Plus (+) Options Bottom Drawer */}
        {showPlusMenu && (
          <div className="pt-3 pb-2 border-t border-slate-100 mt-2 grid grid-cols-4 gap-3 animate-in slide-in-from-bottom-2 duration-150">
            {/* Album */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                <Image className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">Photos</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSendPhoto}
            />

            {/* Amigos Pay Send Money */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowPlusMenu(false);
                onOpenSendMoney(primaryRecipient);
              }}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FEE500] text-[#191919] flex items-center justify-center shadow-xs">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">Send Money</span>
            </button>

            {/* Amigos Gift */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowPlusMenu(false);
                onOpenGift(primaryRecipient);
              }}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">Send Gift</span>
            </button>

            {/* VoiceTalk Call */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowPlusMenu(false);
                onStartCall(primaryRecipient, 'voice');
              }}
              className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">VoiceTalk</span>
            </button>

            {/* 2 Player Games Challenge */}
            {onOpenGames && (
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setShowPlusMenu(false);
                  onOpenGames(primaryRecipient);
                }}
                className="flex flex-col items-center gap-1 hover:opacity-80 active:scale-95 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs border-2 border-black">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black text-slate-800">2P Games</span>
              </button>
            )}
          </div>
        )}

        {/* Emoticon Drawer */}
        {showEmoticonDrawer && (
          <div className="pt-2 pb-1 border-t border-slate-100 mt-2 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-150">
            {/* Character Tabs */}
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar border-b border-slate-100 pb-1.5">
              {(['all', 'ryan', 'choonsik', 'apeach'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    kakaoAudio.playTap();
                    setSelectedCharacterTab(tab);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition capitalize ${
                    selectedCharacterTab === tab
                      ? 'bg-[#191919] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>

            {/* Emoticons Grid */}
            <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
              {filteredEmoticons.map((emo) => (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => handleSendEmoticon(emo)}
                  className="p-2.5 rounded-2xl hover:bg-amber-50 border border-slate-100 hover:border-amber-300 flex flex-col items-center justify-center transition active:scale-90"
                >
                  <span className="text-3xl mb-1">{emo.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-700 truncate max-w-full">
                    {emo.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Side Chat Drawer */}
      {showSideDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-72 h-full bg-white flex flex-col justify-between shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-[#191919] text-base">Chat Room Drawer</h3>
                <button
                  onClick={() => setShowSideDrawer(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Members */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">
                  Participants ({chat.participants.length + 1})
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50">
                    <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-bold text-[#191919]">{currentUser.name} (Me)</span>
                  </div>
                  {chat.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50">
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-bold text-[#191919]">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallpaper settings */}
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">Wallpaper Color</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#BACEE0', label: 'Classic Blue' },
                    { color: '#FEE500', label: 'Amigos Yellow' },
                    { color: '#F5EBE6', label: 'Peach Cream' },
                    { color: '#2A303C', label: 'Dark Slate' },
                  ].map((theme) => (
                    <button
                      key={theme.color}
                      onClick={() => {
                        kakaoAudio.playTap();
                        setWallpaperColor(theme.color);
                      }}
                      style={{ backgroundColor: theme.color }}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        wallpaperColor === theme.color ? 'border-[#191919] scale-110 shadow' : 'border-white/50'
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>

              {/* Notification toggle */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    kakaoAudio.playTap();
                    kakaoStorage.toggleMuteChat(chat.id);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span>Notifications</span>
                  </div>
                  <span className="text-slate-400">{chat.isMuted ? 'Muted' : 'On'}</span>
                </button>
              </div>
            </div>

            {/* Danger actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleClearChatHistory}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Clear Chat History</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteAndLeaveChat}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete & Leave Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
