import React, { useState, useEffect } from 'react';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { generateQRCodeDataUrl } from '../../utils/qrUtils';
import {
  X,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Store,
  Coffee,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface PayQRModalProps {
  onClose: () => void;
  onPaymentComplete?: () => void;
}

export const PayQRModal: React.FC<PayQRModalProps> = ({ onClose, onPaymentComplete }) => {
  const [wallet, setWallet] = useState(kakaoStorage.getWallet());
  const [timeLeft, setTimeLeft] = useState(180); // 3:00 minutes
  const [qrUrl, setQrUrl] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<{
    store: string;
    amount: number;
    time: string;
  } | null>(null);

  // Generate dynamic payment QR
  const refreshQR = async () => {
    const payData = `amigos_pay_merchant://pay?code=${Math.random().toString(36).slice(2, 10).toUpperCase()}&t=${Date.now()}`;
    const url = await generateQRCodeDataUrl(payData, {
      width: 220,
      color: { dark: '#191919', light: '#FFFFFF' },
    });
    setQrUrl(url);
    setTimeLeft(180);
  };

  useEffect(() => {
    refreshQR();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          refreshQR();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSimulatePayment = (store: string, amount: number) => {
    if (wallet.balance < amount) {
      alert('Insufficient Amigos Pay balance.');
      return;
    }

    kakaoAudio.playPayChime();
    const success = kakaoStorage.transferMoney(store, amount, 'In-store Pay QR');
    if (success) {
      const updatedWallet = kakaoStorage.getWallet();
      setWallet(updatedWallet);
      setPaymentSuccess({
        store,
        amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      onPaymentComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#FEE500] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#191919] flex items-center justify-center text-[#FEE500] font-black text-xs">
              pay
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos Pay In-Store</h2>
              <span className="text-[10px] text-[#3C1E1E]/80 block font-semibold -mt-0.5">
                Convenience stores, cafes, and partner shops
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
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {paymentSuccess ? (
            /* Payment Receipt Screen */
            <div className="w-full bg-amber-50/50 border border-amber-200 rounded-3xl p-5 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Payment Completed!
              </span>

              <h3 className="font-black text-2xl text-[#191919] mt-2">
                ₳{paymentSuccess.amount.toLocaleString()}
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {paymentSuccess.store}
              </p>

              <div className="w-full mt-4 p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-left">
                <div className="flex justify-between text-slate-500">
                  <span>Payment Method:</span>
                  <span className="font-bold text-slate-800">Amigos Pay Money</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Time:</span>
                  <span className="font-medium text-slate-800">{paymentSuccess.time}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Remaining Balance:</span>
                  <span className="font-extrabold text-[#191919]">
                    ₳{wallet.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setPaymentSuccess(null);
                  refreshQR();
                }}
                className="w-full mt-5 py-3 rounded-2xl bg-[#191919] hover:bg-slate-800 text-white font-extrabold text-xs transition active:scale-95 shadow-sm"
              >
                Pay Another Store
              </button>
            </div>
          ) : (
            /* Barcode & QR Code Card */
            <div className="w-full flex flex-col items-center">
              {/* Balance Bar */}
              <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500">Pay Money Balance</span>
                <span className="text-base font-black text-[#191919]">
                  ₳{wallet.balance.toLocaleString()}
                </span>
              </div>

              {/* Barcode Display */}
              <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
                <div className="h-12 w-full flex items-center justify-between px-3 overflow-hidden">
                  {/* CSS barcode simulation */}
                  <div className="flex items-center gap-[2px] w-full justify-center h-10">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2].map(
                      (w, i) => (
                        <div
                          key={i}
                          className="bg-[#191919] h-full"
                          style={{ width: `${w * 1.5}px` }}
                        />
                      )
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 tracking-widest">
                  8809 1849 2019 4018
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative my-3 p-4 bg-white rounded-3xl border-2 border-[#FEE500] shadow-md flex flex-col items-center">
                {qrUrl ? (
                  <img src={qrUrl} alt="Pay QR" className="w-44 h-44 rounded-xl object-contain" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                )}

                {/* Refresh Timer Pill */}
                <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Valid for {formatTimer(timeLeft)}</span>
                  <button
                    onClick={() => {
                      kakaoAudio.playTap();
                      refreshQR();
                    }}
                    className="ml-1 text-amber-700 hover:text-amber-900"
                    title="Refresh Now"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>One-time dynamic code refreshed automatically</span>
              </div>

              {/* Test Merchant Payment Buttons */}
              <div className="w-full mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  🏪 Test Merchant In-Store Tap:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSimulatePayment('Starbucks Cafe', 4500)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 transition active:scale-95 flex flex-col items-center text-center gap-1"
                  >
                    <Coffee className="w-4 h-4 text-emerald-700" />
                    <span className="text-[11px] font-bold text-slate-800">Starbucks</span>
                    <span className="text-[10px] text-slate-400 font-semibold">₳4,500</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('CU Convenience', 2800)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 transition active:scale-95 flex flex-col items-center text-center gap-1"
                  >
                    <Store className="w-4 h-4 text-purple-700" />
                    <span className="text-[11px] font-bold text-slate-800">CU Mart</span>
                    <span className="text-[10px] text-slate-400 font-semibold">₳2,800</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('Olive Young', 14200)}
                    className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 transition active:scale-95 flex flex-col items-center text-center gap-1"
                  >
                    <ShoppingBag className="w-4 h-4 text-rose-600" />
                    <span className="text-[11px] font-bold text-slate-800">Olive Young</span>
                    <span className="text-[10px] text-slate-400 font-semibold">₳14,200</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
