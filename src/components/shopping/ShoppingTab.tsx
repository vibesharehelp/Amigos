import React, { useState } from 'react';
import { KakaoGiftItem, KakaoCoupon } from '../../types/kakaotalk';
import { kakaoStorage } from '../../services/kakaoStorage';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { handleGiftError } from '../../utils/imageUtils';
import {
  Search,
  Gift,
  Heart,
  Sparkles,
  ShoppingBag,
  Barcode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  X,
  ChevronLeft,
} from 'lucide-react';

interface ShoppingTabProps {
  onSendGiftItem: (item: KakaoGiftItem) => void;
  onClose?: () => void;
}

export const ShoppingTab: React.FC<ShoppingTabProps> = ({ onSendGiftItem, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'shop' | 'my_gifts'>('shop');
  const [likedItemIds, setLikedItemIds] = useState<string[]>([]);
  const [myCoupons, setMyCoupons] = useState<KakaoCoupon[]>(kakaoStorage.getMyCoupons());

  const gifts = kakaoStorage.getGifts();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'cafe', label: '☕ Cafe & Bakery' },
    { id: 'birthday', label: '🎂 Birthday Cakes' },
    { id: 'friends_goods', label: '🦁 Amigos Merch' },
    { id: 'beauty', label: '🎁 Gift Vouchers' },
  ];

  const filteredGifts = gifts.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    kakaoAudio.playTap();
    setLikedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRedeemCoupon = (couponId: string) => {
    kakaoAudio.playKaTalkChime();
    kakaoStorage.redeemCoupon(couponId);
    setMyCoupons(kakaoStorage.getMyCoupons());
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8] select-none overflow-y-auto pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={() => {
                kakaoAudio.playTap();
                onClose();
              }}
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition active:scale-95"
              title="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img
            src="/Amigos Chat Logo Reveal.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
            alt="Amigos Logo"
            className="w-7 h-7 object-contain rounded-lg shadow-2xs border border-slate-100"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#191919] tracking-tight leading-none">Amigos Gift</h1>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">The easiest way to share warm hearts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-800">
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setIsSearchOpen((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
            title="Search"
          >
            <Search className="w-5 h-5 text-slate-800" />
          </button>

          {/* Switch to My Gift Box */}
          <button
            onClick={() => {
              kakaoAudio.playTap();
              setViewMode((prev) => (prev === 'shop' ? 'my_gifts' : 'shop'));
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
              viewMode === 'my_gifts'
                ? 'bg-[#191919] text-white shadow-xs'
                : 'bg-[#FEE500] text-[#191919] hover:bg-[#FADA0A]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{viewMode === 'my_gifts' ? 'Gift Store' : 'My Gift Box'}</span>
          </button>
        </div>
      </header>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-slate-100 bg-white animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brands, items, cakes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* My Gift Box (Coupons) View */}
      {viewMode === 'my_gifts' ? (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#191919]">
              My Received Gifts ({myCoupons.length})
            </h2>
            <span className="text-[11px] text-slate-400">Redeem instantly in-store with barcode</span>
          </div>

          {myCoupons.length === 0 ? (
            <div className="py-16 text-center">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No received gift coupons yet.</p>
              <p className="text-xs text-slate-400 mt-1">Surprise a friend with a thoughtful gift first!</p>
            </div>
          ) : (
            myCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl p-4 border transition ${
                  coupon.isUsed
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-amber-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={coupon.item.imageUrl}
                    alt={coupon.item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleGiftError(e, coupon.item.title)}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-amber-700 block">
                      {coupon.item.brand}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#191919] truncate">
                      {coupon.item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      From: <span className="font-semibold text-slate-800">{coupon.fromName}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {coupon.expiresAt}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex flex-col items-center">
                  <div className="flex items-center gap-1 h-8 px-4 bg-slate-100 rounded-md">
                    <Barcode className="w-28 h-6 text-slate-800" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 mt-1">
                    {coupon.item.barcode || '8801 2345 6789 0123'}
                  </span>

                  {!coupon.isUsed ? (
                    <button
                      onClick={() => handleRedeemCoupon(coupon.id)}
                      className="mt-2 w-full py-2 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-800" />
                      <span>Mark as Used in Store</span>
                    </button>
                  ) : (
                    <span className="mt-2 text-xs font-bold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Redeemed Coupon
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Store View */
        <>
          {/* Hero Banner */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#FFF385] via-[#FEE500] to-[#FFCA00] p-4 text-[#191919] shadow-xs overflow-hidden flex items-center justify-between">
              <div className="z-10 max-w-[70%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#3C1E1E]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C1E1E]/80">
                    Amigos Gift Special
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-[#191919] leading-tight">
                  Birthday Wishes & Thoughtful Gifts
                </h3>
                <p className="text-[11px] text-[#3C1E1E]/80 mt-1">
                  Send coffee vouchers and celebration cakes directly to Amigos friends!
                </p>
              </div>
              <div className="text-4xl select-none animate-pulse">
                🎁
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  kakaoAudio.playTap();
                  setActiveCategory(c.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  activeCategory === c.id
                    ? 'bg-[#191919] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Product Feed Grid */}
          <div className="px-4 py-2 grid grid-cols-2 gap-3">
            {filteredGifts.map((item) => {
              const isLiked = likedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  {/* Image Container with Like button */}
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleGiftError(e, item.title)}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={(e) => toggleLike(item.id, e)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-500 transition shadow-xs"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'
                        }`}
                      />
                    </button>

                    {item.isPopular && (
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-black tracking-tight shadow-xs">
                        TOP RANK
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">
                        {item.brand}
                      </span>
                      <h4 className="font-extrabold text-[#191919] text-xs line-clamp-2 mt-0.5 leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="font-extrabold text-sm text-[#191919]">
                          ₳{item.price.toLocaleString()}
                        </span>
                        {item.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₳{item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Gift Action Button */}
                      <button
                        onClick={() => {
                          kakaoAudio.playTap();
                          onSendGiftItem(item);
                        }}
                        className="mt-2 w-full py-1.5 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Send as Gift</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
