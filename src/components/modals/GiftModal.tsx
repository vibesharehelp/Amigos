import React, { useState } from 'react';
import { KakaoGiftItem, KakaoUser, KakaoMessage } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { X, Gift, Check, Sparkles, Send } from 'lucide-react';

interface GiftModalProps {
  giftItem: KakaoGiftItem;
  initialRecipient?: KakaoUser;
  currentUser: KakaoUser;
  onSuccess: (recipient: KakaoUser, message: KakaoMessage) => void;
  onClose: () => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  giftItem,
  initialRecipient,
  currentUser,
  onSuccess,
  onClose,
}) => {
  const friends = kakaoStorage.getFriends().filter((f) => !f.isChannel);
  const [selectedRecipient, setSelectedRecipient] = useState<KakaoUser>(
    initialRecipient || friends[0]
  );
  const [greetingCard, setGreetingCard] = useState('Sending this gift with warm thoughts! 💛');

  const greetingPresets = [
    'Happy Birthday! Hope you have the happiest day ever 🎂🎉',
    'Always thankful for you! Enjoy a warm cup of coffee ☕️✨',
    'You worked so hard! Enjoy this sweet treat and recharge 🍰💛',
  ];

  const handleSendGift = (e: React.FormEvent) => {
    e.preventDefault();
    kakaoAudio.playPayChime();

    // 1. Get or create direct chat
    const chat = kakaoStorage.getOrCreateDirectChat(selectedRecipient);

    // 2. Create Amigos gift message
    const message: KakaoMessage = {
      id: `msg_gift_${Date.now()}`,
      chatId: chat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: greetingCard,
      giftItem: giftItem,
      createdAt: Date.now(),
      unreadCount: 1,
    };

    kakaoStorage.saveMessage(message);

    // 3. Save as coupon in storage
    kakaoStorage.addSentCoupon(giftItem, selectedRecipient.name);

    onSuccess(selectedRecipient, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#FEE500] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gift className="w-5 h-5 text-[#191919]" />
            <span className="font-extrabold text-[#191919] text-base">Amigos Gift</span>
          </div>
          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-[#191919] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSendGift} className="p-5 flex flex-col gap-4">
          {/* Product Summary */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <img
              src={giftItem.imageUrl}
              alt={giftItem.title}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-700 block">
                {giftItem.brand}
              </span>
              <h4 className="font-extrabold text-xs text-[#191919] truncate">
                {giftItem.title}
              </h4>
              <span className="text-xs font-black text-[#191919] mt-0.5 block">
                ₳{giftItem.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Recipient Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select Recipient
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {friends.map((friend) => {
                const isSelected = selectedRecipient.id === friend.id;
                return (
                  <button
                    type="button"
                    key={friend.id}
                    onClick={() => {
                      kakaoAudio.playTap();
                      setSelectedRecipient(friend);
                    }}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition shrink-0 ${
                      isSelected
                        ? 'bg-amber-100/70 ring-2 ring-[#FEE500]'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-[11px] font-bold text-slate-800 max-w-[50px] truncate">
                      {friend.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Greeting Card Message */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Gift Card Message
            </label>
            <textarea
              rows={2}
              value={greetingCard}
              onChange={(e) => setGreetingCard(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500] resize-none"
            />

            {/* Quick Presets */}
            <div className="flex flex-col gap-1 mt-1.5">
              {greetingPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setGreetingCard(preset)}
                  className="text-left text-[11px] text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/60 truncate"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 mt-1"
          >
            <Send className="w-4 h-4" />
            <span>Send Gift (₳{giftItem.price.toLocaleString()})</span>
          </button>
        </form>
      </div>
    </div>
  );
};
