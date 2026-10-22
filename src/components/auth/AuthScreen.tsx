import React, { useState, useRef } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  User,
  Lock,
  Mail,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Gamepad2,
  QrCode,
  MessageSquare,
  Upload,
  X,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: KakaoUser) => void;
  onContinueAsGuest?: () => void;
  initialTab?: 'login' | 'signup' | 'demo';
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

const DEMO_ACCOUNTS = [
  {
    id: 'me_alex',
    name: 'Alex',
    amigosId: 'alex_amigo',
    password: 'password123',
    avatar: '/src/assets/images/happy_white_kitten_1791348895355.jpg',
    status: 'Cherishing good days with good people ☕️✨',
    tag: 'Host (Real)',
  },
  {
    id: 'user_minji',
    name: 'Min-ji Kim',
    amigosId: 'minji_k',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'Anyone up for weekend cafe hopping? ☕️🌿',
    tag: 'Real User',
  },
  {
    id: 'user_jihoon',
    name: 'Ji-hoon Park',
    amigosId: 'jihoon_dev',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    status: 'Project: Escape overtime work 💻🚀',
    tag: 'Real User',
  },
  {
    id: 'user_soyeon',
    name: 'So-yeon Lee',
    amigosId: 'soyeon_lee',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    status: 'Pilates & healthy lifestyle 🥑🧘‍♀️',
    tag: 'Real User',
  },
  {
    id: 'guest_1',
    name: 'Guest Explorer',
    amigosId: 'guest_player1',
    password: 'password123',
    avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
    status: 'Guest User (Online & Ready) ☕️',
    tag: 'Guest User',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onContinueAsGuest,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'demo'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Google Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupAmigosId, setSignupAmigosId] = useState('');
  const [signupContact, setSignupContact] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBio, setSignupBio] = useState('Happy chatting & playing on Amigos! ✨');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        throw new Error(data.error || 'Login failed. Please check your credentials.');
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error occurred. Try again.');
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign up error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Handler
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

  const handleQuickDemoLogin = (profile: typeof DEMO_ACCOUNTS[0]) => {
    kakaoAudio.playPayChime();
    const demoUser: KakaoUser = {
      id: profile.id,
      name: profile.name.replace(/\s*\(.*?\)/, ''),
      kakaoId: profile.amigosId,
      avatar: profile.avatar,
      statusMessage: profile.status,
    };

    kakaoStorage.login(demoUser);
    multiplayerSocket.updateProfile(demoUser);
    onSuccess(demoUser);
  };

  const handleGuestLogin = async () => {
    kakaoAudio.playTap();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Guest Explorer' }),
      });
      const data = await res.json();
      if (data.user) {
        const guestUser: KakaoUser = {
          id: data.user.id,
          name: data.user.name,
          kakaoId: data.user.amigosId,
          avatar: data.user.avatar,
          statusMessage: data.user.statusMessage || 'Guest User (Real Live Mode) ☕️✨',
        };
        kakaoStorage.login(guestUser);
        multiplayerSocket.updateProfile(guestUser);
        onSuccess(guestUser);
        return;
      }
    } catch {}

    const fallbackGuest: KakaoUser = {
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      kakaoId: `guest_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
      statusMessage: 'Guest User (Real Live Mode) ☕️✨',
    };
    kakaoStorage.login(fallbackGuest);
    multiplayerSocket.updateProfile(fallbackGuest);
    if (onContinueAsGuest) onContinueAsGuest();
    else onSuccess(fallbackGuest);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8] select-none overflow-y-auto relative">
      {/* Top Brand Banner */}
      <div className="bg-[#FEE500] px-5 pt-8 pb-6 border-b-3 border-black shrink-0 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-black/5 rounded-full pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md border-2 border-black overflow-hidden shrink-0">
            <img src="/logo.png" alt="Amigos Chat Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-2xl text-black tracking-tight leading-none">
                Amigos Talk
              </h1>
              <span className="bg-black text-[#FEE500] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                LIVE
              </span>
            </div>
            <p className="text-xs font-bold text-black/75 mt-0.5">
              Real Messaging, Feed, QR Connect & Games
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="mt-4 flex items-center justify-between bg-black/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-black/15 text-xs text-black">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-[11px]">Real-Time Server Active</span>
          </div>
          <span className="text-[10px] font-bold text-black/70">WebSocket 1v1 Sync</span>
        </div>
      </div>

      {/* Tab Switcher (Login / Sign Up / Quick Demo) */}
      <div className="bg-white p-3 border-b-2 border-black shrink-0 flex gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            kakaoAudio.playTap();
            setTab('login');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition ${
            tab === 'login'
              ? 'bg-black text-[#FEE500] border-black shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Log In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            kakaoAudio.playTap();
            setTab('signup');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition ${
            tab === 'signup'
              ? 'bg-black text-[#FEE500] border-black shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </button>

        <button
          type="button"
          onClick={() => {
            kakaoAudio.playTap();
            setTab('demo');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition ${
            tab === 'demo'
              ? 'bg-black text-[#FEE500] border-black shadow-xs'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Demo 1-Tap</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-100 border-2 border-red-400 rounded-xl flex items-center gap-2 text-red-800 text-xs font-bold animate-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab Contents */}
      <div className="p-4 flex-1">
        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <div className="space-y-4">
            {/* Google Sign In Primary Button */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowGoogleModal(true);
              }}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border-2 border-slate-300 hover:border-black shadow-md flex items-center justify-center gap-2.5 transition active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Login using Google Account</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or with Amigos ID / Password
              </span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            {/* Traditional Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 bg-white p-4 rounded-2xl border-2 border-black shadow-md">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Amigos ID, Email or Phone
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">e.g. alex_amigo</span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter Amigos ID, email or phone"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">default: password123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-sm rounded-xl border-2 border-black shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log In & Connect</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Don't have an account yet?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-[11px] font-black text-black underline hover:text-amber-700"
                >
                  Sign Up here
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <div className="space-y-4">
            {/* Google Sign Up option */}
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                setShowGoogleModal(true);
              }}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border-2 border-slate-300 hover:border-black shadow-md flex items-center justify-center gap-2.5 transition active:scale-98"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign up with Google Account</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or create custom account
              </span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3 bg-white p-4 rounded-2xl border-2 border-black shadow-md">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Alex Kim or Rahul"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Unique Amigos ID (For QR & Search) *
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold">@handle</span>
                </div>
                <div className="relative">
                  <span className="text-slate-400 font-black text-xs absolute left-3 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    value={signupAmigosId}
                    onChange={(e) => setSignupAmigosId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. rahul_gamer"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Email or Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupContact}
                    onChange={(e) => setSignupContact(e.target.value)}
                    placeholder="name@email.com or 010-1234-5678"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Profile Avatar Selection & Custom Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-700">
                    Profile Picture / Avatar
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {/* Current Selected Avatar Preview */}
                  <div className="relative shrink-0">
                    <img
                      src={selectedAvatar}
                      alt="Selected Avatar"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-black shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-black text-[#FEE500] rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="w-px h-8 bg-slate-300 mx-1 shrink-0" />

                  {/* Character Presets */}
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => {
                        kakaoAudio.playTap();
                        setSelectedAvatar(av.url);
                      }}
                      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition ${
                        selectedAvatar === av.url ? 'border-black scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={av.name}
                    >
                      <img src={av.url} alt={av.name} className="w-10 h-10 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Bio / Status Message
                </label>
                <input
                  type="text"
                  value={signupBio}
                  onChange={(e) => setSignupBio(e.target.value)}
                  placeholder="e.g. Coffee lover & game champion! ☕️"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-sm rounded-xl border-2 border-black shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Join Live</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Already registered?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-[11px] font-black text-black underline hover:text-amber-700"
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DEMO 1-TAP ACCOUNTS */}
        {tab === 'demo' && (
          <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-black shadow-md">
            <div>
              <h3 className="font-black text-xs text-black uppercase tracking-wider">
                ⚡ 1-Tap Instant Test Accounts
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Open two browser tabs or devices, log in as Alex on one and Min-ji on another to chat and play 1v1 online!
              </p>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-[#FEE500]/25 border-2 border-slate-200 hover:border-black rounded-xl flex items-center justify-between transition group active:scale-98 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-10 h-10 rounded-xl object-cover border border-black/20"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-black">{acc.name}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 bg-black text-[#FEE500] rounded-sm">
                          {acc.tag}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[170px]">
                        @{acc.amigosId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-black text-black group-hover:translate-x-0.5 transition">
                    <span>Log In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Features Preview Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col items-center text-center">
            <MessageSquare className="w-4 h-4 text-amber-500 mb-1" />
            <span className="font-extrabold text-[10px] text-black">Live Chat</span>
            <span className="text-[9px] text-slate-400">Message & OpenChat</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col items-center text-center">
            <QrCode className="w-4 h-4 text-blue-500 mb-1" />
            <span className="font-extrabold text-[10px] text-black">QR Request</span>
            <span className="text-[9px] text-slate-400">Scan & Connect</span>
          </div>

          <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-col items-center text-center">
            <Gamepad2 className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="font-extrabold text-[10px] text-black">13 Games</span>
            <span className="text-[9px] text-slate-400">Online & AI</span>
          </div>
        </div>

        {/* Guest Explore option */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border-2 border-slate-300 hover:border-black bg-white text-xs font-black text-slate-700 hover:text-black transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
          >
            <span>Continue as Guest User ☕️ (No Password Needed)</span>
          </button>
        </div>
      </div>

      {/* GOOGLE SIGN IN MODAL / ACCOUNT CHOOSER */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border-2 border-black shadow-2xl p-5 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h3 className="font-black text-sm text-black">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-500 font-medium">to continue to Amigos Talk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  kakaoAudio.playTap();
                  setShowGoogleModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click with User's Google Account */}
            <div className="mt-4 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-500">Choose an account</span>

              {/* 1-Click Primary Google Account */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('vibeshare.help@gmail.com', 'VibeShare User')}
                disabled={loading}
                className="w-full p-3 bg-slate-50 hover:bg-blue-50/70 border-2 border-slate-200 hover:border-blue-500 rounded-xl flex items-center gap-3 text-left transition group active:scale-98"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                  V
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-black group-hover:text-blue-700">VibeShare User</div>
                  <div className="text-[11px] text-slate-500 truncate">vibeshare.help@gmail.com</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </button>

              {/* Or enter any other Google Email */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">Or enter another Google Email:</span>
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                    />
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={googleNameInput}
                      onChange={(e) => setGoogleNameInput(e.target.value)}
                      placeholder="Your Name (optional)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-bold focus:border-black focus:outline-hidden transition"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!googleEmailInput.trim()) {
                        setErrorMsg('Please enter a valid Google email address.');
                        return;
                      }
                      handleGoogleSignIn(googleEmailInput, googleNameInput);
                    }}
                    disabled={loading}
                    className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 mt-1"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Sign in with this Google Account</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
