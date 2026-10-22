import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { kakaoStorage } from '../../services/kakaoStorage';
import {
  Bell,
  X,
  Check,
  UserPlus,
  Coins,
  Gamepad2,
  Gift,
  Cake,
  Trash2,
  CheckCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'friend' | 'pay' | 'game' | 'gift' | 'birthday' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  badge?: string;
}

interface NotificationsModalProps {
  onClose: () => void;
  onOpenQR?: () => void;
  onOpenGames?: () => void;
  onOpenGiftShop?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  onOpenQR,
  onOpenGames,
  onOpenGiftShop,
}) => {
  const [filter, setFilter] = useState<'all' | 'requests' | 'pay' | 'system'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    kakaoStorage.getNotifications()
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    kakaoAudio.playTap();
    kakaoStorage.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    kakaoAudio.playTap();
    kakaoStorage.clearAllNotifications();
    setNotifications([]);
  };

  const handleDeleteOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kakaoAudio.playTap();
    kakaoStorage.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (item: AppNotification) => {
    kakaoAudio.playTap();
    const updated = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    kakaoStorage.saveNotifications(updated);
    setNotifications(updated);

    if (item.type === 'game' && onOpenGames) {
      onClose();
      onOpenGames();
    } else if (item.type === 'friend' && onOpenQR) {
      onClose();
      onOpenQR();
    } else if ((item.type === 'gift' || item.type === 'birthday') && onOpenGiftShop) {
      onClose();
      onOpenGiftShop();
    }
  };

  const filteredList = notifications.filter((item) => {
    if (filter === 'requests') return item.type === 'friend' || item.type === 'game';
    if (filter === 'pay') return item.type === 'pay' || item.type === 'gift';
    if (filter === 'system') return item.type === 'system' || item.type === 'birthday';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FEE500] border-2 border-black flex items-center justify-center text-[#191919] shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-[#191919]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                Messages, friend requests & game alerts
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar & Quick action buttons */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'requests', label: 'Requests' },
                { id: 'pay', label: '₳ Pay' },
                { id: 'system', label: 'System' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  kakaoAudio.playTap();
                  setFilter(t.id);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                  filter === t.id
                    ? 'bg-black text-[#FEE500] shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="p-1.5 text-slate-500 hover:text-black rounded-lg hover:bg-slate-100 transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                title="Clear all notifications"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {filteredList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-2">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-600">No new notifications</p>
              <span className="text-[11px] text-slate-400 mt-0.5">
                You are all caught up on requests and alerts!
              </span>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-2xl border transition active:scale-[0.99] cursor-pointer flex items-start gap-3 ${
                  item.read
                    ? 'bg-white border-slate-100 hover:bg-slate-50'
                    : 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 shadow-2xs'
                }`}
              >
                {/* Icon or Avatar */}
                <div className="relative shrink-0">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : item.type === 'pay' ? (
                    <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-sm border border-black">
                      ₳
                    </div>
                  ) : item.type === 'game' ? (
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center border border-black">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                  ) : item.type === 'birthday' ? (
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center border border-black">
                      <Cake className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center border border-black">
                      <Sparkles className="w-5 h-5 text-[#FEE500]" />
                    </div>
                  )}

                  {!item.read && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-[#191919] truncate">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.time}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOne(item.id, e)}
                        title="Delete notification"
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md hover:bg-slate-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  {item.badge && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                        <span>Tap to view</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] font-medium">Auto-synced with live notifications</span>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="px-3 py-1 bg-black text-[#FEE500] font-black text-xs rounded-xl shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
