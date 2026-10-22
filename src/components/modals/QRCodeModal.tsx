import React, { useState, useEffect, useRef } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  generateUserQRData,
  generateQRCodeDataUrl,
  parseUserQRData,
  decodeQRFromCanvas,
} from '../../utils/qrUtils';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  X,
  QrCode,
  Camera,
  Download,
  Share2,
  Copy,
  Check,
  UserPlus,
  MessageCircle,
  Upload,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface QRCodeModalProps {
  initialUser: KakaoUser;
  initialMode?: 'view' | 'scan';
  onClose: () => void;
  onOpenChat?: (user: KakaoUser) => void;
  onFriendAdded?: (friend: KakaoUser) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  initialUser,
  initialMode = 'view',
  onClose,
  onOpenChat,
  onFriendAdded,
}) => {
  const [mode, setMode] = useState<'view' | 'scan'>(initialMode);
  const [selectedUser, setSelectedUser] = useState<KakaoUser>(initialUser);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<KakaoUser | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const friends = kakaoStorage.getFriends();
  const allUsersList = [kakaoStorage.getMe(), ...friends];

  // Generate QR image when selectedUser changes
  useEffect(() => {
    let isMounted = true;
    async function loadQR() {
      const qrString = generateUserQRData(selectedUser);
      const url = await generateQRCodeDataUrl(qrString, {
        width: 320,
        color: { dark: '#191919', light: '#FFFFFF' },
      });
      if (isMounted) {
        setQrDataUrl(url);
      }
    }
    loadQR();
    return () => {
      isMounted = false;
    };
  }, [selectedUser]);

  // Handle Camera stream in scan mode
  useEffect(() => {
    if (mode === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this device. You can upload a photo or use one-tap test scan.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream could not start:', err);
      setCameraError('Camera unavailable or permission denied. Use Image Upload or One-Tap Test Scan below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startScanningLoop = () => {
    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const decodedString = decodeQRFromCanvas(canvas);
            if (decodedString) {
              handleDecodedPayload(decodedString);
              return;
            }
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(scan);
    };

    animationFrameId.current = requestAnimationFrame(scan);
  };

  const handleDecodedPayload = (qrString: string) => {
    kakaoAudio.playKaTalkChime();
    const payload = parseUserQRData(qrString);

    if (payload) {
      const userObj: KakaoUser = {
        id: payload.id,
        name: payload.name,
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        kakaoId: payload.kakaoId,
        phone: payload.phone,
        statusMessage: payload.status,
      };
      setScannedResult(userObj);
      stopCamera();
    } else {
      // Attempt generic format
      const genericUser: KakaoUser = {
        id: `user_scan_${Date.now()}`,
        name: qrString.length > 20 ? qrString.slice(0, 18) + '...' : qrString,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        statusMessage: 'Scanned via Amigos QR Code',
      };
      setScannedResult(genericUser);
      stopCamera();
    }
  };

  // Image file upload decoder
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    kakaoAudio.playTap();
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const decoded = decodeQRFromCanvas(canvas);
          if (decoded) {
            handleDecodedPayload(decoded);
          } else {
            alert('No valid Amigos QR Code found in this image. Please try another image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Test scan simulation for quick verification
  const handleSimulateScan = (user: KakaoUser) => {
    kakaoAudio.playKaTalkChime();
    setScannedResult(user);
    stopCamera();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    kakaoAudio.playTap();
    const link = document.createElement('a');
    link.download = `amigos-qr-${selectedUser.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyLink = () => {
    kakaoAudio.playTap();
    const link = `https://amigos.app/u/${selectedUser.kakaoId || selectedUser.id}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendFriendRequest = (user: KakaoUser) => {
    try {
      kakaoAudio.playPayChime();
      kakaoStorage.addFriend(user);
      const me = kakaoStorage.getMe();
      if (multiplayerSocket && typeof multiplayerSocket.sendFriendRequest === 'function') {
        multiplayerSocket.sendFriendRequest(user.id, {
          id: me?.id || 'me',
          name: me?.name || 'Me',
          avatar: me?.avatar || '',
          amigosId: me?.kakaoId || '',
        });
      }
      setIsRequestSent(true);
      onFriendAdded?.(user);
    } catch (err) {
      console.error('Error sending friend request:', err);
      setIsRequestSent(true);
      onFriendAdded?.(user);
    }
  };

  const isAlreadyFriend = friends.some((f) => f.id === scannedResult?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
              <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">
                {mode === 'view' ? 'Amigos Profile QR' : 'Scan QR Code'}
              </h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {mode === 'view' ? 'Unique scannable identity card' : 'Scan to connect instantly'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation: View QR vs Scan QR */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setMode('view');
              setScannedResult(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              mode === 'view'
                ? 'border-[#191919] text-[#191919] bg-amber-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Profile QR Code</span>
          </button>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setMode('scan');
              setScannedResult(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              mode === 'scan'
                ? 'border-[#191919] text-[#191919] bg-amber-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {mode === 'view' ? (
            /* ================= VIEW PROFILE QR CODE ================= */
            <div className="w-full flex flex-col items-center gap-4">
              {/* Profile Selector if more than 1 user */}
              <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Switch User:</span>
                {allUsersList.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setSelectedUser(u);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                      selectedUser.id === u.id
                        ? 'bg-[#191919] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </button>
                ))}
              </div>

              {/* Authentic QR Card Container */}
              <div className="relative w-full max-w-[270px] bg-gradient-to-b from-[#FEE500]/20 via-white to-white p-5 rounded-3xl border-2 border-[#FEE500] shadow-xl flex flex-col items-center text-center">
                {/* User avatar on top */}
                <div className="relative -mt-1 w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mt-2 text-center">
                  <h3 className="font-extrabold text-base text-[#191919] leading-tight">
                    {selectedUser.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    @{selectedUser.kakaoId || selectedUser.id.replace('user_', '')}
                  </p>
                </div>

                {/* Real Rendered QR Code */}
                <div className="relative my-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Amigos QR Code"
                      className="w-48 h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  )}

                  {/* Centered Amigos Brand Stamp */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white border-2 border-amber-300 shadow-md flex items-center justify-center p-0.5 overflow-hidden pointer-events-none">
                    <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium px-2 leading-relaxed">
                  Scan this QR code with Amigos camera to send friend request or chat instantly.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-3 gap-2 mt-1">
                <button
                  onClick={handleDownloadQR}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                >
                  {savedSuccess ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4 text-slate-700" />
                  )}
                  <span>{savedSuccess ? 'Saved!' : 'Save QR'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-700" />
                  )}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={() => {
                    kakaoAudio.playTap();
                    setMode('scan');
                  }}
                  className="py-2.5 px-2 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-[#191919]" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= SCAN QR CODE ================= */
            <div className="w-full flex flex-col items-center gap-4">
              {scannedResult ? (
                /* Scanned Profile Result Card */
                <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>

                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    QR Code Scanned!
                  </span>

                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md my-2">
                    <img
                      src={scannedResult.avatar}
                      alt={scannedResult.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="font-extrabold text-lg text-[#191919] mt-1">
                    {scannedResult.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    @{scannedResult.kakaoId || scannedResult.id}
                  </span>
                  <p className="text-xs text-slate-600 mt-1 max-w-[240px]">
                    {scannedResult.statusMessage || 'Connected via Amigos QR Code scan.'}
                  </p>

                  {/* Actions depending on relationship */}
                  <div className="w-full mt-5 flex flex-col gap-2">
                    {isAlreadyFriend ? (
                      <>
                        <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs">
                          Already in your Amigos friends! 🎉
                        </div>
                        <button
                          onClick={() => {
                            kakaoAudio.playTap();
                            onOpenChat?.(scannedResult);
                            onClose();
                          }}
                          className="w-full py-3 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open Message</span>
                        </button>
                      </>
                    ) : isRequestSent ? (
                      <div className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                        <Check className="w-4 h-4" />
                        <span>Friend Added! Connected on Amigos</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendFriendRequest(scannedResult)}
                        className="w-full py-3 bg-[#191919] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                      >
                        <UserPlus className="w-4 h-4 text-[#FEE500]" />
                        <span>Send Friend Request / Connect</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        kakaoAudio.playTap();
                        setScannedResult(null);
                        setIsRequestSent(false);
                        startCamera();
                      }}
                      className="py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      Scan Another QR Code
                    </button>
                  </div>
                </div>
              ) : (
                /* Scanner Viewfinder */
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[280px] h-[260px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanner Framing Box & Animated Laser Line */}
                    <div className="relative z-10 w-44 h-44 border-2 border-dashed border-[#FEE500] rounded-2xl flex flex-col justify-between p-2 shadow-lg">
                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-t-3 border-l-3 border-[#FEE500] -mt-1 -ml-1" />
                        <div className="w-4 h-4 border-t-3 border-r-3 border-[#FEE500] -mt-1 -mr-1" />
                      </div>

                      {/* Moving laser scan line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FEE500] to-transparent shadow-[0_0_8px_#FEE500] animate-pulse" />

                      <div className="flex justify-between">
                        <div className="w-4 h-4 border-b-3 border-l-3 border-[#FEE500] -mb-1 -ml-1" />
                        <div className="w-4 h-4 border-b-3 border-r-3 border-[#FEE500] -mb-1 -mr-1" />
                      </div>
                    </div>

                    {!cameraActive && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                        <Camera className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-white">Camera Standby</span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          {cameraError || 'Align any QR code inside the viewfinder'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload Image & Camera controls */}
                  <div className="w-full flex items-center justify-center gap-2 mt-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* One-Tap Test Scan Simulation Chips */}
                  <div className="w-full mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        ⚡ Quick Test Scan (One-Tap):
                      </span>
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                        Works without camera
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        {
                          id: 'rec_muzi',
                          name: 'Muzi & Con',
                          avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=200&auto=format&fit=crop&q=80',
                          statusMessage: 'Adventures of bunny Muzi & tiny Con 🐰',
                          kakaoId: 'muzi_con',
                        },
                        {
                          id: 'rec_frodo',
                          name: 'Frodo',
                          avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80',
                          statusMessage: 'Neo-loving stylish city dog 🐶💼',
                          kakaoId: 'frodo_city',
                        },
                        {
                          id: 'rec_neo',
                          name: 'Neo',
                          avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80',
                          statusMessage: 'Fashion & bob-haircut lover cat 🐱👠',
                          kakaoId: 'neo_fashion',
                        },
                        ...friends.slice(0, 3),
                      ].map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSimulateScan(u)}
                          className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 transition active:scale-95 text-left"
                        >
                          <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          <span className="text-[11px] font-bold text-slate-700 truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
