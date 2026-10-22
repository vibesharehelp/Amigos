import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  Car,
  MapPin,
  Navigation,
  Clock,
  Shield,
  Star,
  CheckCircle2,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AmigosTModalProps {
  onClose: () => void;
}

export const AmigosTModal: React.FC<AmigosTModalProps> = ({ onClose }) => {
  const [pickup, setPickup] = useState('Gangnam Station Exit 2');
  const [dropoff, setDropoff] = useState('COEX World Trade Center');
  const [selectedTier, setSelectedTier] = useState('standard');
  const [rideStatus, setRideStatus] = useState<'idle' | 'calling' | 'matched' | 'completed'>('idle');

  const tiers = [
    {
      id: 'standard',
      name: 'Amigos T Standard',
      price: 11800,
      eta: '3 mins',
      car: 'Hyundai Sonata / K5',
      icon: '🚕',
    },
    {
      id: 'blue',
      name: 'Amigos T Blue',
      price: 13500,
      eta: '4 mins',
      car: 'Hyundai IONIQ 5 (Electric)',
      icon: '🚙',
      badge: 'Fast Dispatch',
    },
    {
      id: 'black',
      name: 'Amigos Black VIP',
      price: 26000,
      eta: '2 mins',
      car: 'Genesis G90 Luxury',
      icon: '🚗',
      badge: 'Premium Driver',
    },
  ];

  const handleRequestRide = () => {
    kakaoAudio.playTap();
    setRideStatus('calling');
    setTimeout(() => {
      kakaoAudio.playKaTalkChime();
      setRideStatus('matched');
    }, 1800);
  };

  const handleFinishRide = () => {
    kakaoAudio.playPayChime();
    setRideStatus('completed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#FEE500] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
              <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos T Mobility</h2>
              <span className="text-[10px] text-[#3C1E1E]/80 font-bold block -mt-0.5">
                Fast, reliable taxi hailing & rides
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[#191919] transition"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {rideStatus === 'matched' ? (
            /* Driver Matched Card */
            <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>

              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Driver is on the way!
              </span>
              <h3 className="font-black text-xl text-[#191919] mt-1">Arriving in 3 mins</h3>

              <div className="w-full mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-left">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Driver"
                  className="w-12 h-12 rounded-full object-cover border border-amber-300 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-[#191919]">Driver Kim Sung-woo</h4>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.98
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Hyundai IONIQ 5</p>
                  <p className="text-[11px] font-mono text-slate-400">Seoul 34-Ga 8282</p>
                </div>
              </div>

              {/* Live route simulation */}
              <div className="w-full mt-3 p-3 bg-white rounded-2xl border border-slate-100 text-xs text-left space-y-1">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{pickup}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Navigation className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{dropoff}</span>
                </div>
              </div>

              <button
                onClick={handleFinishRide}
                className="w-full mt-4 py-3 bg-[#191919] hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition active:scale-95 shadow-sm"
              >
                Complete Ride & Pay with Amigos Pay
              </button>
            </div>
          ) : rideStatus === 'completed' ? (
            /* Ride Complete */
            <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FEE500] text-[#191919] flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-[#191919]">Ride Completed</h3>
              <p className="text-xs text-slate-500 mt-1">Paid automatically via Amigos Pay Money.</p>
              <button
                onClick={() => setRideStatus('idle')}
                className="mt-4 px-5 py-2.5 bg-[#FEE500] text-[#191919] font-bold text-xs rounded-xl shadow-xs"
              >
                Book New Ride
              </button>
            </div>
          ) : (
            /* Booking Screen */
            <>
              {/* Route Input */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="flex-1 text-xs font-semibold text-[#191919] focus:outline-none"
                    placeholder="Pickup location"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                  <Navigation className="w-4 h-4 text-rose-600 shrink-0" />
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    className="flex-1 text-xs font-semibold text-[#191919] focus:outline-none"
                    placeholder="Dropoff destination"
                  />
                </div>
              </div>

              {/* Quick Pick Destinations */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['Hongdae Street', 'Namsan Tower', 'Incheon Airport', 'Itaewon'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setDropoff(loc);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-[11px] font-semibold text-slate-700 shrink-0 transition"
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>

              {/* Ride Tiers */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Ride Type
                </span>

                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setSelectedTier(tier.id);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      selectedTier === tier.id
                        ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tier.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-[#191919]">{tier.name}</h4>
                          {tier.badge && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {tier.eta} away • {tier.car}
                        </p>
                      </div>
                    </div>

                    <span className="font-extrabold text-sm text-[#191919]">
                      ₳{tier.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Request Button */}
              <button
                onClick={handleRequestRide}
                disabled={rideStatus === 'calling'}
                className="w-full mt-2 py-3.5 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-sm rounded-2xl transition active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                {rideStatus === 'calling' ? (
                  <span>Dispatching Nearest Amigos T... 🚕</span>
                ) : (
                  <>
                    <Car className="w-4 h-4" />
                    <span>Call Amigos Taxi</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
