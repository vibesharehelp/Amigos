import React, { useState } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  User,
  Bell,
  MessageSquare,
  Shield,
  Palette,
  Volume2,
  HardDrive,
  RotateCcw,
  Check,
  LogIn,
  LogOut,
  Users,
} from 'lucide-react';

interface SettingsModalProps {
  currentUser: KakaoUser;
  onClose: () => void;
  onRefreshData?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  onClose,
  onRefreshData,
  onOpenAuth,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'chat' | 'privacy'>('general');
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    kakaoAudio.setSoundEnabled(next);
    if (next) {
      kakaoAudio.playKaTalkChime();
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all chats and settings to default data?')) {
      localStorage.clear();
      kakaoAudio.playKaTalkChime();
      onRefreshData?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Amigos Logo" className="w-6 h-6 object-contain rounded-md" />
            <h2 className="text-base font-extrabold text-[#191919]">Settings</h2>
          </div>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* User profile row */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-300"
              />
              <div className="flex-1">
                <h3 className="font-extrabold text-sm text-[#191919]">{currentUser.name}</h3>
                <p className="text-slate-500 text-[11px] font-bold mt-0.5">
                  @{currentUser.kakaoId || 'amigo_user'} • {currentUser.email || currentUser.phone || 'Online'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    kakaoAudio.playTap();
                    onOpenAuth();
                  }}
                  className="flex-1 py-1.5 px-2 bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-xs rounded-xl border border-black shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch / Sign Up</span>
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    kakaoAudio.playTap();
                    onLogout();
                  }}
                  className="py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1 transition active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Sound settings */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Notifications & Sounds
            </span>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-slate-800">Amigos Alert Sound</span>
              </div>
              <button
                onClick={handleToggleSound}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isSoundOn ? 'bg-[#FEE500]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                    isSoundOn ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={() => kakaoAudio.playKaTalkChime()}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold flex items-center justify-between border border-amber-200/80 transition"
            >
              <span>Preview Sound (Amigos!)</span>
              <span className="text-[10px] text-amber-700">Play Chime 🔔</span>
            </button>
          </div>

          {/* Chat options */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Display & Text Size
            </span>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800">Text Size</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTextSize('normal')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    textSize === 'normal'
                      ? 'bg-[#191919] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setTextSize('large')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    textSize === 'large'
                      ? 'bg-[#191919] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>
          </div>

          {/* Storage & Backup */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Data Management
            </span>

            <button
              onClick={() => {
                kakaoAudio.playKaTalkChime();
                alert('Your chats and media have been safely backed up to Talk Drive.');
              }}
              className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-500" />
                <span>Talk Drive Chat & Media Backup</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">Backup Ready</span>
            </button>

            <button
              onClick={handleResetData}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-between border border-red-200 transition"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Data</span>
              </div>
              <span className="text-[10px]">Reset</span>
            </button>
          </div>

          {/* App Branding Footer */}
          <div className="pt-3 pb-1 flex flex-col items-center justify-center text-slate-400 gap-1">
            <img src="/logo.png" alt="Amigos Logo" className="w-9 h-9 object-contain rounded-xl shadow-2xs border border-slate-200" />
            <span className="font-extrabold text-[#191919] text-xs">Amigos Chat</span>
            <span className="text-[10px] text-slate-400">Official Release • v10.8.2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
