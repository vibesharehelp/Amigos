import React, { useState } from 'react';
import { KakaoUser } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { X, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface SendMoneyModalProps {
  recipient?: KakaoUser;
  onSuccess: (recipient: KakaoUser, amount: number, note: string) => void;
  onClose: () => void;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({
  recipient: initialRecipient,
  onSuccess,
  onClose,
}) => {
  const friends = kakaoStorage.getFriends().filter((f) => !f.isChannel);
  const [selectedRecipient, setSelectedRecipient] = useState<KakaoUser>(
    initialRecipient || friends[0]
  );
  const [amountStr, setAmountStr] = useState('10000');
  const [note, setNote] = useState('Sending with love and care 💛');
  const wallet = kakaoStorage.getWallet();

  const presetAmounts = [10000, 30000, 50000, 100000];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0 || amount > wallet.balance) return;

    kakaoAudio.playPayChime();
    kakaoStorage.transferMoney(selectedRecipient.name, amount, note);
    onSuccess(selectedRecipient, amount, note);
  };

  const amountNum = parseInt(amountStr, 10) || 0;
  const isOverBalance = amountNum > wallet.balance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#FEE500] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#191919] text-base">Amigos Pay Transfer</span>
          </div>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[#191919] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 flex flex-col gap-4">
          {/* Recipient Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Recipient</label>
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={selectedRecipient.avatar}
                alt={selectedRecipient.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-[#191919] block truncate">
                  {selectedRecipient.name}
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  {selectedRecipient.kakaoId ? `@${selectedRecipient.kakaoId}` : 'Amigos Friend'}
                </span>
              </div>
            </div>

            {/* Quick Friend Avatars Selector if no fixed recipient */}
            {!initialRecipient && (
              <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar py-1">
                {friends.slice(0, 5).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      kakaoAudio.playTap();
                      setSelectedRecipient(f);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                      selectedRecipient.id === f.id
                        ? 'bg-[#FEE500] font-bold text-[#191919]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <img src={f.avatar} alt={f.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-500">Transfer Amount</label>
              <span className="text-xs text-slate-400">
                Pay Balance: <strong className="text-slate-700">₳{wallet.balance.toLocaleString()}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-lg font-bold text-[#191919] focus:outline-none transition ${
                  isOverBalance ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#FEE500]'
                }`}
                placeholder="0"
                min="1000"
                max={wallet.balance}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">₳</span>
            </div>
            {isOverBalance && (
              <span className="text-xs text-rose-500 font-semibold mt-1 block">
                Insufficient balance. (Max ₳{wallet.balance.toLocaleString()})
              </span>
            )}

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    kakaoAudio.playTap();
                    setAmountStr(String(preset));
                  }}
                  className={`py-1.5 rounded-xl text-xs font-medium border transition ${
                    amountNum === preset
                      ? 'border-[#191919] bg-slate-100 font-bold text-[#191919]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  +{preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Note message */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Memo & Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-[#FEE500]"
              placeholder="Add a memo or message for your friend"
              maxLength={40}
            />
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero fee · Amigos Pay 100% Secure Transfer Guarantee</span>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={amountNum <= 0 || isOverBalance}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] ${
              amountNum > 0 && !isOverBalance
                ? 'bg-[#FEE500] hover:bg-[#ffe000] text-[#191919] cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Send ₳{amountNum.toLocaleString()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
