import React, { useEffect } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';

interface IncomingCallModalProps {
  callId: string;
  callType: 'voice' | 'video';
  caller: KakaoUser;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callId,
  callType,
  caller,
  onAccept,
  onDecline,
}) => {
  useEffect(() => {
    // Play ringing sound until user responds
    kakaoAudio.playVoiceTalkRing();
    const interval = window.setInterval(() => {
      kakaoAudio.playVoiceTalkRing();
    }, 2400);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md text-white select-none animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-xs bg-slate-900 border-2 border-[#FEE500] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Ringing Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>INCOMING {callType === 'video' ? 'FACETALK' : 'VOICETALK'}</span>
        </div>

        {/* Caller Avatar with Animated Rings */}
        <div className="relative w-28 h-28 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[#FEE500] animate-ping opacity-30" />
          <div className="absolute -inset-2 rounded-full border border-emerald-400/40 animate-pulse" />
          <img
            src={caller.avatar || '/src/assets/images/chibi_golden_puppy_1791348861534.jpg'}
            alt={caller.name}
            className="w-full h-full rounded-full object-cover border-4 border-[#FEE500] shadow-xl relative z-10"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FEE500] text-black flex items-center justify-center font-bold z-20 shadow-md">
            {callType === 'video' ? <Video className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          </div>
        </div>

        {/* Caller Info */}
        <h3 className="text-xl font-extrabold text-white tracking-tight">{caller.name}</h3>
        <p className="text-xs font-bold text-amber-300 mt-0.5 mb-1">
          @{caller.amigosId || caller.kakaoId || 'amigo'}
        </p>
        <p className="text-xs text-slate-400 mb-6 font-medium">
          Real live {callType === 'video' ? 'video' : 'voice'} call request
        </p>

        {/* Action Buttons: Accept / Decline */}
        <div className="flex items-center justify-center gap-6 w-full">
          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                onDecline();
              }}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition active:scale-95"
              title="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-bold text-slate-400">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playPayChime();
                onAccept();
              }}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition active:scale-95 animate-bounce"
              title="Accept Call"
            >
              <Phone className="w-6 h-6 fill-current" />
            </button>
            <span className="text-[11px] font-bold text-emerald-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
