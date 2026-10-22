import React, { useState } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  MessageCircle,
  Phone,
  Video,
  Star,
  Gift,
  Edit2,
  Check,
  Music,
  Share2,
  Calendar,
  QrCode,
  Trash2,
  UserCheck,
  UserPlus,
  Copy,
} from 'lucide-react';

interface ProfileModalProps {
  user: KakaoUser;
  isMe?: boolean;
  onOpenChat: (user: KakaoUser) => void;
  onStartCall: (user: KakaoUser, type: 'voice' | 'video') => void;
  onSendGift?: (user: KakaoUser) => void;
  onOpenQR?: (user: KakaoUser) => void;
  onUserUpdated?: (updated: KakaoUser) => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isMe = false,
  onOpenChat,
  onStartCall,
  onSendGift,
  onOpenQR,
  onUserUpdated,
  onOpenAuth,
  onLogout,
  onClose,
}) => {
  const [isFavorite, setIsFavorite] = useState(user.isFavorite || false);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [editStatus, setEditStatus] = useState(user.statusMessage || '');
  const [editName, setEditName] = useState(user.name);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleToggleFavorite = () => {
    kakaoAudio.playTap();
    const next = !isFavorite;
    setIsFavorite(next);
    kakaoStorage.toggleFavoriteFriend(user.id);
    if (onUserUpdated) onUserUpdated({ ...user, isFavorite: next, isFollowing });
  };

  const handleToggleFollowing = () => {
    kakaoAudio.playTap();
    const next = !isFollowing;
    setIsFollowing(next);
    kakaoStorage.toggleFollowFriend(user.id);
    if (onUserUpdated) onUserUpdated({ ...user, isFavorite, isFollowing: next });
  };

  const handlePlayBgm = () => {
    kakaoAudio.playTap();
    setIsPlayingBgm((prev) => !prev);
    if (!isPlayingBgm) {
      kakaoAudio.playKaTalkChime();
    }
  };

  const handleSaveEdit = () => {
    kakaoAudio.playTap();
    const updated: KakaoUser = {
      ...user,
      name: editName.trim() || user.name,
      statusMessage: editStatus.trim(),
    };
    if (isMe) {
      kakaoStorage.saveMe(updated);
    }
    onUserUpdated?.(updated);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm h-full max-h-[820px] bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Cover Background Photo with Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={user.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80'}
            alt="Cover"
            className="w-full h-full object-cover opacity-35 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>

        {/* Top Action Bar */}
        <div className="relative z-10 flex items-center justify-between p-5 pt-8">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Unique Profile QR Code button */}
            {onOpenQR && (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenQR(user);
                }}
                className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
                title="View Profile QR Code"
              >
                <QrCode className="w-4.5 h-4.5 text-[#FEE500]" />
              </button>
            )}

            {!isMe && (
              <>
                <button
                  onClick={handleToggleFollowing}
                  className={`px-2.5 py-1.5 rounded-full backdrop-blur-md text-xs font-bold flex items-center gap-1 transition ${
                    isFollowing
                      ? 'bg-emerald-500/80 text-white border border-emerald-400'
                      : 'bg-black/30 hover:bg-black/50 text-white border border-white/20'
                  }`}
                  title={isFollowing ? 'Following (Tap to Unfollow)' : 'Follow'}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-white" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-[#FEE500]" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
                  title="Favorite"
                >
                  <Star className={`w-5 h-5 ${isFavorite ? 'fill-[#FEE500] text-[#FEE500]' : 'text-white'}`} />
                </button>
                {onSendGift && (
                  <button
                    onClick={() => {
                      kakaoAudio.playTap();
                      onSendGift(user);
                    }}
                    className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
                    title="Send Gift"
                  >
                    <Gift className="w-5 h-5 text-[#FEE500]" />
                  </button>
                )}
              </>
            )}
            {isMe && (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setIsEditing((prev) => !prev);
                }}
                className="px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/50 text-xs font-bold text-white flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Center Profile Body */}
        <div className="relative z-10 flex flex-col items-center px-6 my-auto text-center">
          {/* Avatar with Ring */}
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-3 border-white/90 shadow-2xl bg-slate-800">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* D-Day badge if set */}
          {user.dDay && (
            <div className="mt-3 px-3 py-0.5 rounded-full bg-[#FEE500] text-[#191919] font-extrabold text-[11px] shadow-md flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{user.dDay.label}</span>
            </div>
          )}

          {/* Name & Korean Name */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-3 px-3 py-1 text-center bg-black/50 border border-[#FEE500] rounded-xl text-lg font-bold text-white"
            />
          ) : (
            <div className="mt-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {user.name}
              </h2>
            </div>
          )}

          {/* Status Message */}
          {isEditing ? (
            <div className="mt-2 w-full flex items-center gap-1.5">
              <input
                type="text"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                placeholder="Enter your status message"
                className="flex-1 px-3 py-1.5 text-center bg-black/50 border border-slate-600 rounded-xl text-xs text-white"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                className="p-1.5 bg-[#FEE500] text-slate-900 rounded-xl font-bold"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-slate-200 font-medium max-w-[260px] leading-snug">
              {user.statusMessage || 'No status message set.'}
            </p>
          )}

          {/* Unique Amigos ID Badge with 1-click Copy */}
          <div className="mt-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-md">
            <span className="text-[10px] font-bold text-slate-300">Amigos ID:</span>
            <span className="text-xs font-black text-[#FEE500]">
              @{user.amigosId || user.kakaoId || 'amigo'}
            </span>
            <button
              type="button"
              onClick={() => {
                const idToCopy = user.amigosId || user.kakaoId || '';
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(idToCopy);
                }
                kakaoAudio.playTap();
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
              }}
              className="ml-1 p-1 hover:bg-white/20 rounded-md transition text-slate-300 hover:text-white"
              title="Copy Amigos ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {copiedId && (
              <span className="text-[9px] font-bold text-emerald-400 animate-in fade-in">
                Copied!
              </span>
            )}
          </div>

          {/* BGM Music Pill */}
          {user.musicTrack && (
            <button
              onClick={handlePlayBgm}
              className={`mt-4 px-3.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium flex items-center gap-2 transition active:scale-95 ${
                isPlayingBgm
                  ? 'bg-emerald-500/80 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${isPlayingBgm ? 'animate-bounce text-[#FEE500]' : 'text-slate-300'}`} />
              <span className="truncate max-w-[190px]">
                {user.musicTrack.title} - {user.musicTrack.artist}
              </span>
              <span className="text-[10px] opacity-75">{isPlayingBgm ? 'Playing' : 'Play'}</span>
            </button>
          )}
        </div>

        {/* Bottom 3 Action Buttons */}
        <div className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md p-6">
          <div className="grid grid-cols-3 gap-2">
            {/* Message */}
            <button
              onClick={() => {
                kakaoAudio.playTap();
                onOpenChat(user);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white/10 transition active:scale-95"
            >
              <div className="w-11 h-11 rounded-full bg-[#FEE500] text-[#191919] flex items-center justify-center shadow-lg">
                <MessageCircle className="w-5 h-5 fill-[#191919]" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Message</span>
            </button>

            {/* VoiceTalk */}
            <button
              onClick={() => {
                kakaoAudio.playTap();
                onStartCall(user, 'voice');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white/10 transition active:scale-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center shadow-md">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-white mt-1.5">VoiceTalk</span>
            </button>

            {/* FaceTalk or Edit */}
            {isMe ? (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setIsEditing(true);
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white/10 transition active:scale-95"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center shadow-md">
                  <Edit2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-white mt-1.5">Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  onStartCall(user, 'video');
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white/10 transition active:scale-95"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center shadow-md">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-white mt-1.5">FaceTalk</span>
              </button>
            )}
          </div>

          {!isMe && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setShowConfirmRemove(true);
                }}
                className="py-1 px-3 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Remove Friend</span>
              </button>
            </div>
          )}

          {/* Remove Friend Confirmation Dialog */}
          {showConfirmRemove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-xs bg-slate-900 border border-white/20 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center text-white">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold">Remove Friend?</h3>
                <p className="text-xs text-white/70 mt-1 mb-5">
                  Are you sure you want to remove <span className="font-semibold text-white">{user.name}</span> from your friends list?
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setShowConfirmRemove(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      kakaoAudio.playTap();
                      kakaoStorage.deleteFriend(user.id);
                      if (onUserUpdated) onUserUpdated(user);
                      setShowConfirmRemove(false);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {isMe && onOpenAuth && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  onOpenAuth();
                  onClose();
                }}
                className="py-1.5 px-3 bg-[#FEE500] hover:bg-yellow-400 text-black text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Switch / Sign In Account</span>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    kakaoAudio.playTap();
                    onLogout();
                    onClose();
                  }}
                  className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition active:scale-95"
                >
                  <span>Log Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
