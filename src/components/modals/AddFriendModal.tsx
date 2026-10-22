import React, { useState, useEffect } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage, INITIAL_FRIENDS } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { generateUserQRData, generateQRCodeDataUrl } from '../../utils/qrUtils';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  X,
  Search,
  QrCode,
  Phone,
  UserPlus,
  Check,
  Sparkles,
  Camera,
  Download,
  Copy,
  RefreshCw,
  Send,
} from 'lucide-react';

interface AddFriendModalProps {
  currentUser?: KakaoUser;
  onFriendAdded: (friend: KakaoUser) => void;
  onOpenScanner?: () => void;
  onClose: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  currentUser: initialCurrentUser,
  onFriendAdded,
  onOpenScanner,
  onClose,
}) => {
  const [tab, setTab] = useState<'id' | 'phone' | 'qr'>('id');
  const [searchVal, setSearchVal] = useState('');
  const [foundUser, setFoundUser] = useState<KakaoUser | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [myQrUrl, setMyQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [serverUsers, setServerUsers] = useState<KakaoUser[]>([]);

  const currentUser = initialCurrentUser || kakaoStorage.getMe() || {
    id: 'user_me',
    name: 'Me',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    amigosId: 'alex_amigo',
    kakaoId: 'alex_amigo',
    phone: '010-1234-5678',
    statusMessage: '',
  };

  const safeName = currentUser.name || 'Me';
  const safeAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  const safeId = currentUser.amigosId || currentUser.kakaoId || currentUser.id || 'alex_amigo';

  useEffect(() => {
    let isMounted = true;
    async function loadQR() {
      try {
        const qrData = generateUserQRData(currentUser);
        const url = await generateQRCodeDataUrl(qrData, { width: 240 });
        if (isMounted) {
          setMyQrUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate QR data URL:', err);
      }
    }
    loadQR();

    // Fetch registered users from backend for live ID lookup
    fetch('/api/auth/users')
      .then((r) => r.json())
      .then((d) => {
        if (isMounted && d.users) {
          setServerUsers(d.users);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Combined pool of available persona friends & registered users
  const recommendations: KakaoUser[] = [
    ...INITIAL_FRIENDS.filter((f) => f.id !== currentUser.id),
    ...serverUsers
      .filter((u) => u.id !== currentUser.id && !INITIAL_FRIENDS.some((f) => f.id === u.id))
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        amigosId: u.amigosId || u.kakaoId,
        kakaoId: u.amigosId || u.kakaoId,
        statusMessage: u.statusMessage || 'Amigos community member ✨',
        phone: u.phone,
      })),
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    kakaoAudio.playTap();

    const clean = searchVal.trim().toLowerCase().replace(/^@/, '');

    // Search across recommendations, server accounts, and online users
    const matched = recommendations.find(
      (r) =>
        r.amigosId?.toLowerCase() === clean ||
        r.kakaoId?.toLowerCase() === clean ||
        r.name.toLowerCase() === clean ||
        (clean.length > 2 && r.name.toLowerCase().includes(clean)) ||
        (r.phone && r.phone.replace(/[^0-9]/g, '').includes(clean.replace(/[^0-9]/g, '')))
    );

    if (matched) {
      setFoundUser(matched);
      setIsAdded(false);
    } else {
      // Create user with matching custom Amigos ID
      const newUser: KakaoUser = {
        id: `user_amigo_${Date.now()}`,
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        statusMessage: `Connected via unique Amigos ID @${clean} ✨`,
        amigosId: clean,
        kakaoId: clean,
        phone: '010-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
      };
      setFoundUser(newUser);
      setIsAdded(false);
    }
  };

  const handleAdd = (user: KakaoUser) => {
    try {
      kakaoAudio.playKaTalkChime();
      kakaoStorage.addFriend(user);

      // Broadcast real-time friend request over socket
      if (multiplayerSocket && typeof multiplayerSocket.sendFriendRequest === 'function') {
        multiplayerSocket.sendFriendRequest(user.id, {
          id: currentUser?.id || 'me',
          name: currentUser?.name || 'Me',
          avatar: currentUser?.avatar || '',
          amigosId: currentUser?.amigosId || currentUser?.kakaoId || '',
        });
      }

      setIsAdded(true);
      if (onFriendAdded) {
        onFriendAdded(user);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Error adding friend:', err);
      setIsAdded(true);
      if (onFriendAdded) {
        onFriendAdded(user);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FEE500] text-black flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919] leading-none">Add Friend</h2>
              <span className="text-[10px] text-slate-400 font-medium">Connect by unique Amigos ID</span>
            </div>
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

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setTab('id');
              setFoundUser(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'id' ? 'border-[#191919] text-[#191919]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Amigos ID</span>
          </button>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setTab('qr');
              setFoundUser(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'qr' ? 'border-[#191919] text-[#191919]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setTab('phone');
              setFoundUser(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              tab === 'phone' ? 'border-[#191919] text-[#191919]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[520px] overflow-y-auto">
          {tab === 'id' || tab === 'phone' ? (
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                {tab === 'id' && (
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    @
                  </span>
                )}
                <input
                  type={tab === 'phone' ? 'tel' : 'text'}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder={
                    tab === 'id'
                      ? 'Enter Amigos ID (e.g. minji_k)'
                      : 'Enter phone (e.g. 010-2415-9988)'
                  }
                  className={`w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-[#FEE500] ${
                    tab === 'id' ? 'pl-7 pr-3' : 'px-4'
                  }`}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#FEE500] hover:bg-yellow-400 text-[#191919] font-black text-xs transition active:scale-95 border border-black/10 shadow-xs"
              >
                Search
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="relative p-3 bg-white border-2 border-[#FEE500] rounded-3xl shadow-md flex flex-col items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs -mt-1 mb-1">
                  <img src={safeAvatar} alt={safeName} className="w-full h-full object-cover" />
                </div>
                {myQrUrl ? (
                  <img src={myQrUrl} alt="My QR Code" className="w-40 h-40 rounded-xl object-contain" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                )}
                <span className="text-xs font-bold text-[#191919] mt-1">{safeName}</span>
                <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                  @{safeId}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 w-full justify-center">
                {onOpenScanner && (
                  <button
                    onClick={() => {
                      kakaoAudio.playTap();
                      onOpenScanner();
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan QR</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    kakaoAudio.playTap();
                    const link = `https://amigos.app/u/${safeId}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(link);
                    }
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                  title="Copy Profile Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    if (!myQrUrl) return;
                    kakaoAudio.playTap();
                    const a = document.createElement('a');
                    a.href = myQrUrl;
                    a.download = `amigos-qr-${safeName.toLowerCase().replace(/\s+/g, '-')}.png`;
                    a.click();
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                  title="Save QR Code Image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 mt-2">
                Friends can scan this unique QR code with their camera to add you instantly.
              </span>
            </div>
          )}

          {/* Search Result Card */}
          {foundUser && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={foundUser.avatar}
                  alt={foundUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shrink-0"
                />
                <div className="truncate">
                  <h4 className="text-sm font-black text-[#191919] truncate">{foundUser.name}</h4>
                  <span className="text-[10px] font-black text-amber-700 block">
                    @{foundUser.amigosId || foundUser.kakaoId}
                  </span>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {foundUser.statusMessage}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAdd(foundUser)}
                disabled={isAdded}
                className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition shrink-0 active:scale-95 ${
                  isAdded
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#191919] text-white hover:bg-slate-800 shadow-md'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Recommended friends list */}
          <div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
              Amigos Users & Friends
            </span>
            <div className="space-y-2">
              {recommendations.slice(0, 6).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={rec.avatar}
                      alt={rec.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#191919] truncate">{rec.name}</span>
                        <span className="text-[9px] font-black text-amber-600 bg-amber-100/60 px-1 py-0.2 rounded">
                          @{rec.amigosId || rec.kakaoId}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                        {rec.statusMessage}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(rec)}
                    className="py-1.5 px-3 rounded-xl bg-[#FEE500] hover:bg-yellow-400 text-[#191919] font-black text-xs flex items-center gap-1 shrink-0 active:scale-95 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
