import React, { useState } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { handleAvatarError } from '../../utils/imageUtils';
import {
  Settings,
  QrCode,
  CreditCard,
  Send,
  Eye,
  EyeOff,
  Gift,
  Smile,
  Car,
  MapPin,
  Calendar,
  FolderArchive,
  BookOpen,
  Gamepad2,
  ChevronRight,
  Volume2,
  Palette,
  ShieldCheck,
  HelpCircle,
  Bell,
} from 'lucide-react';

interface MoreTabProps {
  currentUser: KakaoUser;
  onOpenMyProfile: () => void;
  onOpenSendMoney: () => void;
  onOpenGiftShop: () => void;
  onOpenSettings: () => void;
  onOpenPayQR: () => void;
  onOpenQRCode: () => void;
  onOpenEmoticons: () => void;
  onOpenAmigosT: () => void;
  onOpenAmigosMaps: () => void;
  onOpenAmigosCalendar: () => void;
  onOpenTalkDrive: () => void;
  onOpenAmigosPage: () => void;
  onOpenAmigosGames: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({
  currentUser,
  onOpenMyProfile,
  onOpenSendMoney,
  onOpenGiftShop,
  onOpenSettings,
  onOpenPayQR,
  onOpenQRCode,
  onOpenEmoticons,
  onOpenAmigosT,
  onOpenAmigosMaps,
  onOpenAmigosCalendar,
  onOpenTalkDrive,
  onOpenAmigosPage,
  onOpenAmigosGames,
  onOpenAuth,
  onLogout,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [wallet, setWallet] = useState(kakaoStorage.getWallet());
  const [selectedNotifTone, setSelectedNotifTone] = useState<'katalk' | 'chime' | 'pop' | 'silent'>('katalk');
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('amigos_default_wallpaper') || '#BACEE0';
  });

  const handleTestSound = (tone: 'katalk' | 'chime' | 'pop' | 'silent') => {
    setSelectedNotifTone(tone);
    if (tone === 'katalk') {
      kakaoAudio.playKaTalkChime();
    } else if (tone === 'chime') {
      kakaoAudio.playPayChime();
    } else if (tone === 'pop') {
      kakaoAudio.playSendPop();
    }
  };

  const handleSelectWallpaperTheme = (color: string) => {
    kakaoAudio.playTap();
    setSelectedTheme(color);
    localStorage.setItem('amigos_default_wallpaper', color);

    // Update all chats that don't have custom wallpapers
    const chats = kakaoStorage.getChats();
    chats.forEach((c) => {
      c.wallpaper = color;
    });
    kakaoStorage.saveChats(chats);
  };

  const services = [
    { id: 'gift', name: 'Gift', icon: <Gift className="w-5 h-5 text-amber-500" />, action: onOpenGiftShop },
    { id: 'emoticon', name: 'Emoticons', icon: <Smile className="w-5 h-5 text-blue-500" />, action: onOpenEmoticons },
    { id: 'taxi', name: 'Amigos T', icon: <Car className="w-5 h-5 text-yellow-500" />, action: onOpenAmigosT },
    { id: 'map', name: 'Amigos Maps', icon: <MapPin className="w-5 h-5 text-emerald-500" />, action: onOpenAmigosMaps },
    { id: 'calendar', name: 'Calendar', icon: <Calendar className="w-5 h-5 text-purple-500" />, action: onOpenAmigosCalendar },
    { id: 'drive', name: 'Talk Drive', icon: <FolderArchive className="w-5 h-5 text-sky-500" />, action: onOpenTalkDrive },
    { id: 'page', name: 'Amigos Page', icon: <BookOpen className="w-5 h-5 text-red-500" />, action: onOpenAmigosPage },
    { id: 'game', name: 'Amigos Games', icon: <Gamepad2 className="w-5 h-5 text-indigo-500" />, action: onOpenAmigosGames },
  ];

  const wallpaperThemes = [
    { name: 'Classic Blue', color: '#BACEE0' },
    { name: 'Sweet Peach', color: '#FCE4EC' },
    { name: 'Modern Slate', color: '#2B303A' },
    { name: 'Cozy Mint', color: '#E8F5E9' },
  ];

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
          <h1 className="text-xl font-extrabold text-[#191919] tracking-tight">More</h1>
        </div>

        <div className="flex items-center gap-2 text-slate-800">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onOpenQRCode();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="My Profile QR Code"
          >
            <QrCode className="w-5 h-5 text-slate-800" />
          </button>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </header>

      {/* User Profile Card */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div
          onClick={() => {
            kakaoAudio.playTap();
            onOpenMyProfile();
          }}
          className="flex items-center gap-3 cursor-pointer group flex-1"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            onError={(e) => handleAvatarError(e, currentUser.name)}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 group-hover:scale-105 transition"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-sm text-[#191919]">{currentUser.name}</h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
              {currentUser.email || currentUser.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                onOpenAuth();
              }}
              style={{ height: '40px', width: '71.109px' }}
              className="h-[40px] w-[71.109px] px-2.5 py-1 rounded-full bg-[#FEE500] hover:bg-yellow-400 text-xs font-black text-black border border-black shadow-2xs transition active:scale-95 flex items-center justify-center text-center"
            >
              Switch Account
            </button>
          )}

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onOpenMyProfile();
            }}
            style={{ width: '53.6875px' }}
            className="w-[53.6875px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center text-center"
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Amigos Pay Wallet Card */}
      <div className="p-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FEE500] flex items-center justify-center font-black text-[11px] text-[#191919]">
                pay
              </div>
              <span className="font-extrabold text-xs text-[#191919]">Amigos Pay Money</span>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Balance</span>
              <span className="text-2xl font-black text-[#191919] tracking-tight">
                {showBalance ? `₳${wallet.balance.toLocaleString()}` : '•••••••'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenSendMoney();
                }}
                className="px-3.5 py-2 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-xs rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>

              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenPayQR();
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Amigos Services Grid */}
      <div className="px-4 py-1">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={svc.action}
                className="flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 transition active:scale-95"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                  {svc.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-700 tracking-tight">
                  {svc.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings & Customization Panel */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-500 px-1">Settings & Preferences</span>

        {/* Notification Sound Selector */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-[#191919]">Notification Sound</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
              Sound Preview
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { id: 'katalk', label: 'Amigos!' },
              { id: 'chime', label: 'Pay Chime' },
              { id: 'pop', label: 'Talk Pop' },
              { id: 'silent', label: 'Mute' },
            ].map((tone) => (
              <button
                key={tone.id}
                onClick={() => handleTestSound(tone.id as 'katalk' | 'chime' | 'pop' | 'silent')}
                className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  selectedNotifTone === tone.id
                    ? 'bg-[#FEE500] text-[#191919] shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Wallpaper Theme */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-[#191919]">Default Chat Wallpaper</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {wallpaperThemes.map((wp) => (
              <button
                key={wp.color}
                onClick={() => handleSelectWallpaperTheme(wp.color)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition ${
                  selectedTheme === wp.color
                    ? 'border-[#191919] ring-2 ring-[#FEE500]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-full h-8 rounded-lg shadow-inner"
                  style={{ backgroundColor: wp.color }}
                />
                <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                  {wp.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Version info */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <img
              src="/Amigos Chat Logo Reveal.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="Amigos Logo"
              className="w-6 h-6 object-contain rounded-md"
            />
            <span className="font-bold text-[#191919]">Amigos Chat</span>
          </div>
          <span className="text-slate-400 font-medium">v10.8.2 (Latest)</span>
        </div>
      </div>
    </div>
  );
};
