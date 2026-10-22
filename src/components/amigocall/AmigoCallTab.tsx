import React, { useState, useEffect, useRef } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { multiplayerSocket, AmigoCallPeer } from '../../services/multiplayerSocket';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  FastForward,
  UserPlus,
  Send,
  Check,
  RefreshCw,
  MessageSquare,
  Globe,
  Radio,
  Users,
  Copy,
  AlertCircle,
  Wifi,
} from 'lucide-react';

interface AmigoCallTabProps {
  currentUser: KakaoUser;
  onOpenGiftForUser?: (user: KakaoUser) => void;
  onSelectUserForProfile?: (user: KakaoUser) => void;
}

interface CallChatMessage {
  id: string;
  sender: 'me' | 'partner';
  senderName: string;
  text: string;
  time: string;
}

export const AmigoCallTab: React.FC<AmigoCallTabProps> = ({
  currentUser,
  onOpenGiftForUser,
  onSelectUserForProfile,
}) => {
  // Call States: 'idle' | 'searching' | 'no_users' | 'waiting' | 'connected'
  const [callState, setCallState] = useState<'idle' | 'searching' | 'no_users' | 'waiting' | 'connected'>('searching');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [partner, setPartner] = useState<AmigoCallPeer | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<CallChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [friendReqSent, setFriendReqSent] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [searchPulse, setSearchPulse] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const [callToast, setCallToast] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Show temporary toast helper
  const showToast = (text: string) => {
    setCallToast(text);
    setTimeout(() => {
      setCallToast((prev) => (prev === text ? null : prev));
    }, 3000);
  };

  // Setup local user camera and audio stream
  useEffect(() => {
    let active = true;
    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true,
          });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
          }
        }
      } catch (err) {
        // Fallback gracefully without breaking
        setHasCameraPermission(false);
      }
    }
    initCamera();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // WebRTC PeerConnection setup when connected to a real user
  const setupWebRTC = (roomId: string, isInitiator: boolean) => {
    try {
      if (typeof RTCPeerConnection === 'undefined') return;

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      });
      peerConnectionRef.current = pc;

      // Add local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle remote incoming stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send local ICE candidates to real partner
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          multiplayerSocket.sendAmigoCallSignal(roomId, {
            type: 'candidate',
            candidate: event.candidate,
          });
        }
      };

      // If initiator, create offer
      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              multiplayerSocket.sendAmigoCallSignal(roomId, {
                type: 'offer',
                sdp: pc.localDescription,
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // Gracefully continue even if WebRTC fails in restricted sandbox
    }
  };

  // Subscribe to real Multiplayer WebSocket & BroadcastChannel events
  useEffect(() => {
    // 1. Real Peer Matched
    const unsubMatched = multiplayerSocket.onAmigoCallMatched((data) => {
      kakaoAudio.playPayChime();
      setActiveRoomId(data.roomId);
      setPartner(data.peer);
      setCallState('connected');
      setChatMessages([]);
      setFriendReqSent(false);

      // Determine initiator deterministically based on user ID sorting
      const isInitiator = currentUser.id > data.peer.id;
      setupWebRTC(data.roomId, isInitiator);
    });

    // 2. No other user online
    const unsubNoUsers = multiplayerSocket.onAmigoCallNoUsers((data) => {
      setOnlineCount(0);
      setCallState('no_users');
    });

    // 3. Online users exist, waiting in queue
    const unsubWaiting = multiplayerSocket.onAmigoCallWaiting((data) => {
      setOnlineCount(data.onlineCount || 1);
      setCallState('waiting');
    });

    // 4. Partner left the call
    const unsubPeerLeft = multiplayerSocket.onAmigoCallPeerLeft(() => {
      kakaoAudio.playAlert();
      showToast('Partner left the video call');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setPartner(null);
      setActiveRoomId(null);
      setCallState('searching');
      // Re-trigger search for next real user
      multiplayerSocket.joinAmigoCall();
    });

    // 5. In-call live chat message from real partner
    const unsubMessage = multiplayerSocket.onAmigoCallMessage((data) => {
      kakaoAudio.playKaTalkChime();
      const newMsg: CallChatMessage = {
        id: `msg_p_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        sender: 'partner',
        senderName: data.sender.name,
        text: data.text,
        time: data.time || 'Just now',
      };
      setChatMessages((prev) => [...prev, newMsg]);
    });

    // 6. WebRTC signaling from real partner
    const unsubSignal = multiplayerSocket.onAmigoCallSignal(async (data) => {
      const pc = peerConnectionRef.current;
      if (!pc || !data.signal) return;

      try {
        if (data.signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (activeRoomId) {
            multiplayerSocket.sendAmigoCallSignal(activeRoomId, {
              type: 'answer',
              sdp: pc.localDescription,
            });
          }
        } else if (data.signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        } else if (data.signal.type === 'candidate' && data.signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      } catch (err) {
        // Fallback gracefully
      }
    });

    // Automatically join AmigoCall queue on mount
    multiplayerSocket.joinAmigoCall();

    return () => {
      unsubMatched();
      unsubNoUsers();
      unsubWaiting();
      unsubPeerLeft();
      unsubMessage();
      unsubSignal();
      multiplayerSocket.leaveAmigoCall();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [currentUser.id, activeRoomId]);

  // Call duration timer
  useEffect(() => {
    let timer: number | null = null;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // Searching pulse animation
  useEffect(() => {
    let interval: number | null = null;
    if (callState === 'searching' || callState === 'waiting') {
      interval = window.setInterval(() => {
        setSearchPulse((prev) => (prev + 1) % 4);
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Scroll in-call chat to bottom
  useEffect(() => {
    if (showInCallChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showInCallChat]);

  // Start finding a partner
  const startFindingPartner = () => {
    kakaoAudio.playVoiceTalkRing();
    setCallState('searching');
    setPartner(null);
    setActiveRoomId(null);
    setChatMessages([]);
    setFriendReqSent(false);
    multiplayerSocket.joinAmigoCall();
  };

  const handleNextPartner = () => {
    kakaoAudio.playTap();
    multiplayerSocket.leaveAmigoCall();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    startFindingPartner();
  };

  const handleEndCall = () => {
    kakaoAudio.playTap();
    multiplayerSocket.leaveAmigoCall();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPartner(null);
    setActiveRoomId(null);
    setCallState('idle');
  };

  const handleToggleMic = () => {
    kakaoAudio.playTap();
    setIsMicMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  };

  const handleToggleVideo = () => {
    kakaoAudio.playTap();
    setIsVideoOff((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  };

  // Send real live message to partner
  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeRoomId || !partner) return;
    kakaoAudio.playSendPop();

    const text = chatInput.trim();
    const myMsg: CallChatMessage = {
      id: `call_msg_${Date.now()}`,
      sender: 'me',
      senderName: currentUser.name,
      text,
      time: 'Just now',
    };

    setChatMessages((prev) => [...prev, myMsg]);
    setChatInput('');

    // Send through server WebSocket & cross-tab BroadcastChannel
    multiplayerSocket.sendAmigoCallMessage(activeRoomId, text);
  };

  // Send real friend request to matched partner
  const handleSendFriendRequest = () => {
    if (!partner || friendReqSent) return;
    kakaoAudio.playGameWin();

    const newFriend: KakaoUser = {
      id: partner.id,
      name: partner.name,
      avatar: partner.avatar,
      kakaoId: partner.amigosId || partner.id,
      statusMessage: 'Connected via AmigoCall 🎥',
    };

    kakaoStorage.addFriend(newFriend);
    multiplayerSocket.sendFriendRequest(partner.id, {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      amigosId: currentUser.amigosId || currentUser.kakaoId,
    });
    setFriendReqSent(true);
    showToast(`Friend request sent to ${partner.name}!`);
  };

  const handleCopyMyAmigosId = () => {
    const idToCopy = currentUser.amigosId || currentUser.kakaoId || currentUser.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
    }
    kakaoAudio.playTap();
    setCopiedId(true);
    showToast(`Amigos ID @${idToCopy} copied to clipboard!`);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0F141C] text-white select-none relative overflow-hidden">
      {/* Toast Notification */}
      {callToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {callToast}
        </div>
      )}

      {/* Top Banner: Status Header */}
      <div
        className="bg-[#18202F] border-b border-white/10 flex items-center justify-between z-30 shrink-0"
        style={{
          paddingLeft: '14px',
          paddingRight: '10px',
          marginLeft: '0px',
          width: '373px',
          height: '40.5px',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FEE500] text-black flex items-center justify-center font-black shadow-xs">
            <Video className="w-4 h-4 fill-current" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-tight">AmigoCall</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE VIDEO</span>
              </span>
            </div>

            {callState === 'searching' && (
              <p className="text-[11px] font-bold text-amber-300 animate-pulse">
                Finding online user{searchPulse === 1 ? '.' : searchPulse === 2 ? '..' : searchPulse === 3 ? '...' : ''}
              </p>
            )}

            {callState === 'no_users' && (
              <p className="text-[11px] font-bold text-rose-400">
                No user is online
              </p>
            )}

            {callState === 'waiting' && (
              <p className="text-[11px] font-bold text-amber-300">
                {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online, waiting to pair...
              </p>
            )}

            {callState === 'connected' && partner && (
              <p className="text-[11px] font-medium text-slate-300 truncate">
                Connected with <span className="text-[#FEE500] font-bold">@{partner.amigosId || partner.id}</span> ({formatTimer(callDuration)})
              </p>
            )}

            {callState === 'idle' && (
              <p className="text-[11px] font-medium text-slate-400">Ready to meet online users</p>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {callState === 'connected' && partner && (
            <button
              type="button"
              onClick={handleSendFriendRequest}
              disabled={friendReqSent}
              style={{
                height: '32px',
                width: '70.891px',
              }}
              className={`px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 border transition active:scale-95 ${
                friendReqSent
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#FEE500] hover:bg-yellow-400 text-black border-black shadow-xs'
              }`}
            >
              {friendReqSent ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Friend</span>
                </>
              )}
            </button>
          )}

          {callState === 'connected' && (
            <button
              type="button"
              onClick={() => setShowInCallChat((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 relative ${
                showInCallChat ? 'bg-[#FEE500] text-black' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Toggle Live Chat Overlay"
            >
              <MessageSquare className="w-4 h-4" />
              {chatMessages.length > 0 && !showInCallChat && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Video Call Canvas */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* State 1: SEARCHING / RADAR SCANNING */}
        {callState === 'searching' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
            {/* Concentric Animated Radar Rings */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border border-yellow-400/20 animate-ping duration-1000" />
              <div className="absolute inset-6 rounded-full border-2 border-yellow-400/40 animate-pulse" />
              <div className="absolute inset-14 rounded-full border border-white/20" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FEE500] to-yellow-500 text-black flex flex-col items-center justify-center shadow-2xl border-4 border-black z-10 animate-bounce">
                <Video className="w-9 h-9 fill-current" />
              </div>

              {/* Pulsing rotating scanner blip */}
              <div className="absolute top-4 right-10 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399] animate-pulse" />
              <div className="absolute bottom-6 left-8 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-pulse" />
            </div>

            <div className="max-w-xs space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                Finding online user...
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Checking for real online Amigos users. Connecting in real time as soon as a user is found!
              </p>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-300 font-bold">
                <Radio className="w-4 h-4 animate-spin text-amber-400" />
                <span>Camera & audio ready for live video</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={handleEndCall}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95"
              >
                Cancel Search
              </button>
            </div>
          </div>
        )}

        {/* State 2: NO USER IS ONLINE (Requested by user) */}
        {callState === 'no_users' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 shadow-xl">
              <Users className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-extrabold mb-3">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No user is online</span>
            </div>

            <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
              No User Is Online
            </h3>

            <p className="text-xs text-slate-300 max-w-xs mb-6 leading-relaxed">
              There are currently no other real users online in AmigoCall. Invite a friend or open the app in another browser tab to video call right now!
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={handleCopyMyAmigosId}
                className="w-full py-3 px-4 bg-[#FEE500] hover:bg-yellow-400 text-black font-extrabold text-xs rounded-2xl border-2 border-black shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId ? 'Copied to Clipboard!' : `Share My Amigos ID (@${currentUser.amigosId || currentUser.kakaoId || 'amigo'})`}</span>
              </button>

              <button
                type="button"
                onClick={startFindingPartner}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Check Again & Wait</span>
              </button>
            </div>

            {/* Radar keeping watch in the background */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Standing by: will auto-connect when someone joins</span>
            </div>
          </div>
        )}

        {/* State 3: WAITING FOR ONLINE USER */}
        {callState === 'waiting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-150">
            <div className="relative w-44 h-44 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping duration-1000" />
              <div className="absolute inset-4 rounded-full border-2 border-emerald-400/40 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 text-black flex flex-col items-center justify-center shadow-2xl border-4 border-black z-10">
                <Wifi className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineCount} Real {onlineCount === 1 ? 'User' : 'Users'} Online</span>
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              Waiting for user to enter AmigoCall...
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mb-6">
              Real users are active on the network. You will be connected directly as soon as they open the video call!
            </p>

            <button
              type="button"
              onClick={handleEndCall}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95"
            >
              Cancel
            </button>
          </div>
        )}

        {/* State 4: IDLE */}
        {callState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-20 h-20 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center mb-4">
              <Globe className="w-10 h-10 text-[#FEE500]" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Real-Time Video Call</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              Connect directly with real online users. Camera, audio and live messaging ready.
            </p>
            <button
              type="button"
              onClick={startFindingPartner}
              className="px-6 py-3.5 bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-sm rounded-2xl border-2 border-black shadow-xl flex items-center gap-2 transition active:scale-95"
            >
              <Video className="w-5 h-5 fill-current" />
              <span>Start AmigoCall 🚀</span>
            </button>
          </div>
        )}

        {/* State 5: CONNECTED REAL PARTNER STREAM */}
        {callState === 'connected' && partner && (
          <div className="absolute inset-0 w-full h-full flex flex-col justify-between">
            {/* Remote Real Partner Video / Avatar Canvas */}
            <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* WebRTC Video Element for Real Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Real Partner Avatar Canvas (Visible if remote camera track is not streaming) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-linear-to-b from-black/50 via-slate-900/60 to-black/80">
                <img
                  src={partner.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
                  alt={partner.name}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-[#FEE500] shadow-2xl mb-3"
                />
                <h4 className="text-lg font-black text-white">{partner.name}</h4>
                <span className="text-xs font-bold text-amber-300">@{partner.amigosId || partner.id}</span>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real User Live</span>
                </span>
              </div>

              {/* Subtle top/bottom vignette overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Remote Partner Profile Tag (Top Left) */}
            <div className="relative z-10 m-4 flex items-center justify-between">
              <div
                className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-2.5 shadow-lg"
                style={{
                  marginLeft: '-11px',
                  paddingLeft: '7px',
                  paddingRight: '0px',
                  paddingBottom: '4px',
                  paddingTop: '5px',
                  marginRight: '-10px',
                  marginTop: '-13px',
                  marginBottom: '13px',
                  width: '203.125px',
                  height: '42px',
                }}
              >
                <img
                  src={partner.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
                  alt={partner.name}
                  className="w-9 h-9 rounded-xl object-cover border border-[#FEE500]"
                />
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-extrabold text-xs text-white truncate">{partner.name}</span>
                    <span className="text-[9px] font-black text-[#FEE500] bg-black/40 px-1 py-0.2 rounded shrink-0">
                      @{partner.amigosId || partner.id}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium block truncate">Real Online Amigo</span>
                </div>
              </div>

              {/* Live Audio Visualizer Dots */}
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[10px] text-white">Live</span>
              </div>
            </div>

            {/* In-Call Text Chat Floating Overlay */}
            {showInCallChat && (
              <div className="relative z-20 mx-4 mb-2 bg-black/85 backdrop-blur-md rounded-2xl border border-white/20 p-3 max-h-52 flex flex-col animate-in slide-in-from-bottom-2 duration-150 shadow-2xl">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-[#FEE500]">In-Call Live Messages</span>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">Real-Time</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInCallChat(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1 max-h-32">
                  {chatMessages.length === 0 && (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      Say hi to {partner.name}!
                    </p>
                  )}
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[9px] text-slate-400 mb-0.5 px-1">{m.senderName}</span>
                      <div
                        className={`px-2.5 py-1.5 rounded-xl max-w-[85%] font-medium text-[11px] ${
                          m.sender === 'me'
                            ? 'bg-[#FEE500] text-black font-bold'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <form onSubmit={handleSendInCallMessage} className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Message ${partner.name}...`}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-400 outline-none focus:border-[#FEE500]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#FEE500] text-black font-black rounded-xl text-xs flex items-center justify-center active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Local User Camera Preview (PiP Window at Top Right) */}
        <div
          className="absolute top-4 right-4 z-20 aspect-[3/4] bg-slate-900 rounded-2xl border-2 border-[#FEE500] overflow-hidden shadow-2xl flex flex-col justify-end"
          style={{
            marginTop: '-3px',
            marginBottom: '-11px',
            marginRight: '-9px',
            marginLeft: '18px',
            paddingTop: '0px',
            paddingLeft: '0px',
            width: '85px',
          }}
        >
          {isVideoOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
              <VideoOff className="w-6 h-6 mb-1 text-red-400" />
              <span className="text-[9px] font-bold">Cam Off</span>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Actual webcam element */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`}
              />
              {/* Fallback avatar camera preview if permission pending/denied */}
              {!hasCameraPermission && (
                <div className="w-full h-full relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-1 bg-black/60 rounded text-[8px] font-bold text-amber-300">
                    Preview
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1">
            <span>You</span>
            {isMicMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar (Omegle style: Next / Mute / Video / End) */}
      <div
        className="bg-[#18202F] px-4 border-t border-white/10 z-30 shrink-0 flex items-center justify-between gap-3"
        style={{
          height: '45px',
        }}
      >
        {/* Next Partner Button */}
        <button
          type="button"
          onClick={handleNextPartner}
          style={{
            width: '123px',
            height: '37px',
          }}
          className="px-4 rounded-2xl bg-[#FEE500] hover:bg-yellow-400 text-black font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow-lg transition active:scale-95"
        >
          <FastForward className="w-4 h-4 fill-current" />
          <span>Next Partner ⏭️</span>
        </button>

        {/* Mute Mic */}
        <button
          type="button"
          onClick={handleToggleMic}
          style={{
            height: '36px',
          }}
          className={`w-11 rounded-2xl flex items-center justify-center border transition active:scale-95 ${
            isMicMuted
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
          }`}
          title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={handleToggleVideo}
          style={{
            height: '37px',
          }}
          className={`w-11 rounded-2xl flex items-center justify-center border transition active:scale-95 ${
            isVideoOff
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* End Call / Stop Button */}
        <button
          type="button"
          onClick={handleEndCall}
          style={{
            height: '38px',
          }}
          className="w-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md border border-rose-500 active:scale-95 transition"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
