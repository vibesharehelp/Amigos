import React, { useState, useRef } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  X,
  User,
  Lock,
  Mail,
  Camera,
  Check,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Upload,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: KakaoUser) => void;
  initialTab?: 'login' | 'signup';
  isMandatory?: boolean;
}

const PRESET_AVATARS = [
  {
    name: 'Choonsik 🍠',
    url: '/src/assets/images/kakao_choonsik_avatar_1791097626474.jpg',
  },
  {
    name: 'Ryan 🦁',
    url: '/src/assets/images/kakao_ryan_avatar_1791097603606.jpg',
  },
  {
    name: 'Apeach 🍑',
    url: '/src/assets/images/kakao_apeach_avatar_1791097615635.jpg',
  },
  {
    name: 'Neo 🕶️',
    url: '/src/assets/images/baby_rottweiler_pup_1791348883847.jpg',
  },
  {
    name: 'Alex 👓',
    url: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
  isMandatory = false,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupAmigosId, setSignupAmigosId] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBio, setSignupBio] = useState('Happy chatting on Amigos! ✨');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your Amigos ID, Email, or Phone.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your details.');
      }

      const loggedUser: KakaoUser = {
        id: data.user.id,
        name: data.user.name,
        kakaoId: data.user.amigosId,
        avatar: data.user.avatar,
        email: data.user.email,
        phone: data.user.phone,
        statusMessage: data.user.statusMessage || 'Online on Amigos ✨',
      };

      kakaoAudio.playPayChime();
      kakaoStorage.login(loggedUser);
      multiplayerSocket.updateProfile(loggedUser);
      onSuccess(loggedUser);
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupAmigosId.trim()) {
      setErrorMsg('Please choose a unique Amigos ID (for QR & search).');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const isEmail = signupContact.includes('@');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          amigosId: signupAmigosId.trim().toLowerCase(),
          email: isEmail ? signupContact.trim() : undefined,
          phone: !isEmail && signupContact ? signupContact.trim() : undefined,
          password: signupPassword,
          avatar: selectedAvatar,
          statusMessage: signupBio.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Try a different Amigos ID.');
      }

      const newUser: KakaoUser = {
        id: data.user.id,
        name: data.user.name,
        kakaoId: data.user.amigosId,
        avatar: data.user.avatar,
        email: data.user.email,
        phone: data.user.phone,
        statusMessage: data.user.statusMessage,
      };

      kakaoAudio.playGameWin();
      kakaoStorage.login(newUser);
      multiplayerSocket.updateProfile(newUser);
      onSuccess(newUser);
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (email: string, name?: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name?.trim() || email.split('@')[0],
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          googleId: btoa(email.trim().toLowerCase()).slice(0, 16),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed.');
      }

      const loggedUser: KakaoUser = {
        id: data.user.id,
        name: data.user.name,
        kakaoId: data.user.amigosId,
        avatar: data.user.avatar,
        email: data.user.email,
        statusMessage: data.user.statusMessage || 'Signed in with Google Account ✨',
      };

      kakaoAudio.playPayChime();
      kakaoStorage.login(loggedUser);
      multiplayerSocket.updateProfile(loggedUser);
      setShowGoogleModal(false);
      onSuccess(loggedUser);
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setSelectedAvatar(ev.target.result as string);
        kakaoAudio.playTap();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickDemoLogin = (profile: any) => {
    kakaoAudio.playPayChime();
    const demoUser: KakaoUser = {
      id: profile.id,
      name: profile.name,
      kakaoId: profile.amigosId,
      avatar: profile.avatar,
      statusMessage: profile.status,
    };
    kakaoStorage.login(demoUser);
    multiplayerSocket.updateProfile(demoUser);
    onSuccess(demoUser);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm border-2 border-black shadow-[0_8px_0_#000] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#FEE500] px-4 py-3.5 border-b-2 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white p-0.5 border border-black overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-black text-sm text-black">Amigos Account</h2>
              <span className="text-[10px] font-bold text-black/70">Real Messaging & Online Sync</span>
            </div>
          </div>
          {!isMandatory && onClose && (
            <button
              onClick={() => {
                kakaoAudio.playTap();
                onClose();
              }}
              className="p-1 rounded-full hover:bg-black/10 transition"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-2 flex gap-1.5 border-b border-slate-200 shrink-0">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition ${
              tab === 'login'
                ? 'bg-black text-[#FEE500] border-black shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              setTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition ${
              tab === 'signup'
                ? 'bg-black text-[#FEE500] border-black shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-xs font-bold animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {/* Google Sign In option */}
          <button
            type="button"
            onClick={() => {
              kakaoAudio.playTap();
              setShowGoogleModal(true);
            }}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border-2 border-slate-300 hover:border-black shadow-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Amigos ID, Email or Phone
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. alex_amigo"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-black outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-black outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#FEE500] hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1.5"
              >
                {loading ? <span>Logging in...</span> : <span>Log In to Amigos</span>}
              </button>

              {/* 1-Tap Quick Demo */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[9px] font-black uppercase text-slate-500 mb-1.5">
                  ⚡ Quick Demo Accounts:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      id: 'me_alex',
                      name: 'Alex',
                      amigosId: 'alex_amigo',
                      avatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
                      status: 'Cherishing good days ☕️✨',
                    },
                    {
                      id: 'user_minji',
                      name: 'Min-ji Kim',
                      amigosId: 'minji_k',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                      status: 'Weekend cafe hopping ☕️🌿',
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(p)}
                      className="p-1.5 bg-slate-50 hover:bg-yellow-50 border border-slate-300 rounded-xl flex items-center gap-1.5 active:scale-95 transition text-left"
                    >
                      <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover border border-black" />
                      <div className="leading-tight truncate">
                        <div className="font-black text-[11px] text-slate-800 truncate">{p.name}</div>
                        <span className="text-[8px] text-slate-500">@{p.amigosId}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Alex Kim"
                  className="w-full px-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-black outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                  Amigos ID (@handle)
                </label>
                <input
                  type="text"
                  value={signupAmigosId}
                  onChange={(e) => setSignupAmigosId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. alex_kim"
                  className="w-full px-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-black outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-black outline-none transition"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase text-slate-600">Avatar</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-blue-600 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={selectedAvatar} alt="Chosen" className="w-9 h-9 rounded-xl object-cover border-2 border-black shrink-0" />
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.name}
                        type="button"
                        onClick={() => setSelectedAvatar(av.url)}
                        className={`rounded-lg overflow-hidden border transition ${
                          selectedAvatar === av.url ? 'border-black scale-105' : 'border-slate-200 opacity-60'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-7 h-7 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#FEE500] hover:bg-yellow-400 disabled:opacity-50 text-black font-black text-xs rounded-xl border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? <span>Creating account...</span> : <span>Create Account</span>}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Google Sign In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs border-2 border-black shadow-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-black text-xs text-black">Sign in with Google</span>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('vibeshare.help@gmail.com', 'VibeShare User')}
                className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center gap-2 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  V
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-black">VibeShare User</div>
                  <div className="text-[10px] text-slate-500 truncate">vibeshare.help@gmail.com</div>
                </div>
              </button>

              <div className="pt-2 border-t border-slate-200">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="Or enter your Google Email"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold mb-1.5 outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (googleEmailInput.trim()) {
                      handleGoogleSignIn(googleEmailInput);
                    }
                  }}
                  className="w-full py-2 bg-black text-white font-black text-xs rounded-xl"
                >
                  Continue with this Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
