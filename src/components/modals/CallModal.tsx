import React, { useState, useEffect, useRef } from 'react';
import { CallSession, KakaoUser } from '../../types/kakaotalk';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { kakaoStorage } from '../../services/kakaoStorage';
import { multiplayerSocket } from '../../services/multiplayerSocket';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Video,
  VideoOff,
  Radio,
  UserX,
  MessageSquare,
  AlertCircle,
  Wifi,
} from 'lucide-react';

interface CallModalProps {
  session: CallSession & {
    callId?: string;
    isIncoming?: boolean;
    callerId?: string;
  };
  onEndCall: () => void;
  onOpenChatWithUser?: (user: KakaoUser) => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  session,
  onEndCall,
  onOpenChatWithUser,
}) => {
  // Call States: 'dialing' | 'ringing' | 'connected' | 'unavailable' | 'declined' | 'ended'
  const [callState, setCallState] = useState<'dialing' | 'ringing' | 'connected' | 'unavailable' | 'declined' | 'ended'>(
    session.isIncoming ? 'connected' : 'dialing'
  );
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef<string>(session.callId || `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

  const me = kakaoStorage.getMe();
  const targetUser = session.user;

  // WebRTC Setup helper
  const setupWebRTC = (isInitiator: boolean) => {
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

      // Add local tracks (Mic & Camera)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle incoming remote audio/video tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          multiplayerSocket.sendDirectCallSignal(targetUser.id, callIdRef.current, {
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
              multiplayerSocket.sendDirectCallSignal(targetUser.id, callIdRef.current, {
                type: 'offer',
                sdp: pc.localDescription,
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // Graceful fallback
    }
  };

  // 1. Initialize Local Media (Camera & Mic)
  useEffect(() => {
    let active = true;
    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: session.type === 'video' ? { facingMode: 'user' } : false,
            audio: true,
          });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current && session.type === 'video') {
              localVideoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);

            // If incoming call was already accepted, start WebRTC immediately
            if (session.isIncoming) {
              setupWebRTC(false);
            }
          }
        }
      } catch (err) {
        setHasCameraPermission(false);
      }
    }
    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [session.type, session.isIncoming]);

  // 2. Outgoing Call Handling (Check online status & send real invite)
  useEffect(() => {
    if (session.isIncoming) return;

    // Check if target user is currently online
    const isOnline = multiplayerSocket.isUserOnline(targetUser.id, targetUser.name, targetUser.amigosId || targetUser.kakaoId);

    // Play ringing tone while dialing
    kakaoAudio.playVoiceTalkRing();
    const ringInterval = window.setInterval(() => {
      if (callState === 'dialing' || callState === 'ringing') {
        kakaoAudio.playVoiceTalkRing();
      }
    }, 2400);

    // Send real call invite through server & socket
    multiplayerSocket.initiateDirectCall(targetUser.id, session.type, callIdRef.current);

    // If client already knows user is offline, show offline after brief realistic dialing (2.8s)
    let offlineTimer: number | null = null;
    if (!isOnline) {
      offlineTimer = window.setTimeout(() => {
        kakaoAudio.playAlert();
        setCallState('unavailable');
        setUnavailableMessage(`${targetUser.name} is currently offline and unavailable to receive calls.`);
      }, 3000);
    }

    // Call timeout if no answer after 30 seconds
    const timeoutTimer = window.setTimeout(() => {
      if (callState === 'dialing' || callState === 'ringing') {
        kakaoAudio.playAlert();
        setCallState('unavailable');
        setUnavailableMessage(`No answer from ${targetUser.name}.`);
      }
    }, 30000);

    return () => {
      clearInterval(ringInterval);
      if (offlineTimer) clearTimeout(offlineTimer);
      clearTimeout(timeoutTimer);
    };
  }, [session.isIncoming, targetUser.id, targetUser.name, targetUser.amigosId, targetUser.kakaoId, session.type, callState]);

  // 3. Subscribe to Real Direct Call Socket Events
  useEffect(() => {
    // Other user's phone is ringing
    const unsubRinging = multiplayerSocket.onDirectCallRinging((data) => {
      if (data.callId === callIdRef.current) {
        setCallState('ringing');
      }
    });

    // Other user responded (Accepted or Declined)
    const unsubResponse = multiplayerSocket.onDirectCallResponse((data) => {
      if (data.callId === callIdRef.current) {
        if (data.accepted) {
          kakaoAudio.playPayChime();
          setCallState('connected');
          // We initiated, so we are the WebRTC offerer
          setupWebRTC(true);
        } else {
          kakaoAudio.playAlert();
          setCallState('declined');
          setUnavailableMessage(`${targetUser.name} is currently busy / declined the call.`);
        }
      }
    });

    // Other user is offline/unavailable according to server
    const unsubUnavailable = multiplayerSocket.onDirectCallUnavailable((data) => {
      if (data.callId === callIdRef.current) {
        kakaoAudio.playAlert();
        setCallState('unavailable');
        setUnavailableMessage(data.message || `${targetUser.name} is currently offline.`);
      }
    });

    // Remote peer ended the call
    const unsubEnded = multiplayerSocket.onDirectCallEnded((data) => {
      if (data.callId === callIdRef.current) {
        kakaoAudio.playTap();
        setCallState('ended');
        setTimeout(() => {
          onEndCall();
        }, 1500);
      }
    });

    // WebRTC Signaling
    const unsubSignal = multiplayerSocket.onDirectCallSignal(async (data) => {
      if (data.callId === callIdRef.current && peerConnectionRef.current && data.signal) {
        const pc = peerConnectionRef.current;
        try {
          if (data.signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            multiplayerSocket.sendDirectCallSignal(targetUser.id, callIdRef.current, {
              type: 'answer',
              sdp: pc.localDescription,
            });
          } else if (data.signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          } else if (data.signal.type === 'candidate' && data.signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          }
        } catch (err) {}
      }
    });

    return () => {
      unsubRinging();
      unsubResponse();
      unsubUnavailable();
      unsubEnded();
      unsubSignal();
    };
  }, [targetUser.id, targetUser.name, onEndCall]);

  // Call duration counter
  useEffect(() => {
    let timer: number | null = null;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEnd = () => {
    kakaoAudio.playTap();
    multiplayerSocket.endDirectCall(targetUser.id, callIdRef.current);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    onEndCall();
  };

  const handleToggleMute = () => {
    kakaoAudio.playTap();
    setIsMuted((prev) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md text-white select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm h-full max-h-[820px] flex flex-col justify-between p-6 overflow-hidden">
        {/* Top Header Status */}
        <div className="flex flex-col items-center pt-8 z-20">
          <span className="text-xs font-black text-[#FEE500] tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span>REAL {session.type === 'video' ? 'FACETALK' : 'VOICETALK'}</span>
          </span>

          <h2 className="text-2xl font-black tracking-tight text-white">{targetUser.name}</h2>
          <span className="text-xs font-bold text-amber-300 mb-1">
            @{targetUser.amigosId || targetUser.kakaoId || 'amigo'}
          </span>

          {/* Status text */}
          <span className="text-xs font-medium text-slate-300">
            {callState === 'connected' && `Connected (${formatDuration(duration)})`}
            {callState === 'dialing' && 'Connecting to user...'}
            {callState === 'ringing' && 'Ringing...'}
            {callState === 'unavailable' && 'User Offline / Unavailable'}
            {callState === 'declined' && 'Call Declined'}
            {callState === 'ended' && 'Call Ended'}
          </span>
        </div>

        {/* Middle Canvas: Based on Call State */}
        <div className="flex-1 flex items-center justify-center relative my-4">
          {/* Case 1: USER IS OFFLINE / UNAVAILABLE (No fake call!) */}
          {(callState === 'unavailable' || callState === 'declined') && (
            <div className="flex flex-col items-center text-center p-6 bg-slate-900/90 rounded-3xl border border-rose-500/30 max-w-xs animate-in zoom-in-95 duration-200 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <UserX className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">
                {callState === 'declined' ? 'Call Declined' : 'User Is Offline'}
              </h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                {unavailableMessage || `${targetUser.name} is currently offline. Calls can only connect with real online users.`}
              </p>

              <div className="flex flex-col gap-2 w-full">
                {onOpenChatWithUser && (
                  <button
                    type="button"
                    onClick={() => {
                      handleEnd();
                      onOpenChatWithUser(targetUser);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#FEE500] hover:bg-yellow-400 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message in Chat</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEnd}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Case 2: CALL ENDED */}
          {callState === 'ended' && (
            <div className="flex flex-col items-center text-center p-6 bg-slate-900/90 rounded-3xl border border-white/20 max-w-xs animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-white/10 text-slate-300 flex items-center justify-center mb-3">
                <PhoneOff className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">Call Ended</h3>
              <p className="text-xs text-slate-400 mb-4">
                Call duration: {formatDuration(duration)}
              </p>
              <button
                type="button"
                onClick={handleEnd}
                className="py-2 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          )}

          {/* Case 3: DIALING / RINGING / CONNECTED */}
          {callState !== 'unavailable' && callState !== 'declined' && callState !== 'ended' && (
            <>
              {session.type === 'voice' ? (
                /* VoiceTalk Layout */
                <div className="flex flex-col items-center">
                  <div className="relative w-36 h-36">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#FEE500] shadow-2xl relative z-10">
                      <img
                        src={targetUser.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
                        alt={targetUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {callState === 'connected' ? (
                      <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md z-20">
                        <Mic className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 rounded-full border-4 border-[#FEE500] animate-ping opacity-40 pointer-events-none" />
                    )}
                  </div>

                  {callState === 'connected' ? (
                    <div className="mt-6 flex items-center gap-1.5 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                      <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.45s]" />
                      <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.6s]" />
                      <span className="text-[11px] font-bold text-slate-300 ml-2">HD Voice Active</span>
                    </div>
                  ) : (
                    <div className="mt-5 text-xs font-semibold text-amber-300 animate-pulse flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-spin" />
                      <span>{callState === 'ringing' ? 'Ringing real device...' : 'Dialing real user...'}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* FaceTalk Video Call Layout */
                <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 border-2 border-[#FEE500]/60 shadow-2xl">
                  {/* Remote Peer WebRTC Video Stream */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Fallback to real user avatar if remote camera track is not streaming */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-linear-to-b from-black/50 via-slate-950/60 to-black/80">
                    <img
                      src={targetUser.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
                      alt={targetUser.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#FEE500] shadow-2xl mb-2"
                    />
                    <span className="font-extrabold text-sm text-white">{targetUser.name}</span>
                    <span className="text-xs text-amber-300 font-semibold">@{targetUser.amigosId || targetUser.kakaoId}</span>
                    {callState !== 'connected' && (
                      <span className="text-[11px] text-amber-300 font-bold mt-2 animate-pulse">
                        {callState === 'ringing' ? 'Ringing real user...' : 'Connecting live video...'}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/20 z-10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{callState === 'connected' ? 'Live Video Connected' : 'Dialing...'}</span>
                  </div>

                  {/* Local User Self-Camera PiP Window (Top Right) */}
                  <div className="absolute top-3 right-3 w-28 aspect-[3/4] rounded-2xl bg-black border-2 border-[#FEE500] overflow-hidden shadow-2xl z-20">
                    {isVideoOff ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
                        <VideoOff className="w-5 h-5 text-red-400 mb-1" />
                        <span className="text-[9px] font-bold">Cam Off</span>
                      </div>
                    ) : hasCameraPermission ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <img
                          src={me.avatar}
                          alt="You"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-bold text-white">
                      You
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Controls Bar */}
        {callState !== 'unavailable' && callState !== 'declined' && callState !== 'ended' && (
          <div className="relative z-20 flex items-center justify-around py-4 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
            {/* Mute Mic */}
            <button
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEnd}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition active:scale-95"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Video Toggle (For video call) or Speaker (For voice call) */}
            {session.type === 'video' ? (
              <button
                onClick={handleToggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                  isVideoOff ? 'bg-red-500 text-white shadow-lg' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title={isVideoOff ? 'Camera On' : 'Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setIsSpeaker(!isSpeaker);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition active:scale-95 ${
                  isSpeaker ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-700 text-slate-400'
                }`}
                title={isSpeaker ? 'Speaker On' : 'Speaker Off'}
              >
                {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
