import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import { KAKAO_EMOTICONS } from '../../services/kakaoStorage';
import {
  X,
  Smile,
  Heart,
  Download,
  Check,
  Sparkles,
  Music,
  Star,
  ShoppingBag,
} from 'lucide-react';

interface EmoticonsModalProps {
  onClose: () => void;
}

export const EmoticonsModal: React.FC<EmoticonsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ryan' | 'choonsik' | 'apeach'>('all');
  const [downloadedPacks, setDownloadedPacks] = useState<string[]>(['pack_daily']);
  const [selectedSticker, setSelectedSticker] = useState<any | null>(null);

  const packs = [
    {
      id: 'pack_daily',
      name: 'Daily Amigos Friends Vol. 1',
      author: 'Amigos Studio',
      avatar: '/src/assets/images/chibi_golden_puppy_1791348861534.jpg',
      price: 'Free',
      itemsCount: 24,
      tag: '🔥 Popular',
    },
    {
      id: 'pack_choonsik',
      name: 'Sweet Choonsik Life & Sweet Potatoes',
      author: 'Choonsik Fans',
      avatar: '/src/assets/images/fluffy_tricolor_pup_1791348872449.jpg',
      price: 'Free',
      itemsCount: 32,
      tag: '⭐ Trending',
    },
    {
      id: 'pack_apeach',
      name: 'Lively & Playful Apeach',
      author: 'Peach Blossom',
      avatar: '/src/assets/images/kawaii_pink_kitten_1791348848054.jpg',
      price: 'Free',
      itemsCount: 28,
      tag: '💖 Cute',
    },
  ];

  const handleDownloadPack = (packId: string) => {
    kakaoAudio.playPayChime();
    setDownloadedPacks((prev) => [...prev, packId]);
  };

  const handlePlaySticker = (emo: any) => {
    setSelectedSticker(emo);
    kakaoAudio.playKaTalkChime();
    setTimeout(() => {
      setSelectedSticker(null);
    }, 1200);
  };

  const filteredStickers = KAKAO_EMOTICONS.filter((e) =>
    activeTab === 'all' ? true : e.character === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos Emoticons</h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Express yourself with animated stickers
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Character Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Stickers' },
            { id: 'ryan', label: '🦁 Ryan' },
            { id: 'choonsik', label: '🐱 Choonsik' },
            { id: 'apeach', label: '🍑 Apeach' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                kakaoAudio.playTap();
                setActiveTab(tab.id as any);
              }}
              className={`py-3 px-3 text-xs font-bold transition shrink-0 border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Sticker Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#191919]">
                Tap to preview sticker & sound:
              </span>
              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                Interactive Sound
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {filteredStickers.map((emo) => (
                <button
                  key={emo.id}
                  onClick={() => handlePlaySticker(emo)}
                  className={`p-3 rounded-2xl border transition active:scale-95 flex flex-col items-center justify-center gap-1.5 ${
                    selectedSticker?.id === emo.id
                      ? 'bg-amber-100/70 border-amber-400 scale-105 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <span className="text-3xl filter drop-shadow-xs">{emo.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-700 truncate w-full text-center">
                    {emo.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Emoticon Packs */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Featured Emoticon Packs
            </span>

            <div className="space-y-2.5">
              {packs.map((pack) => {
                const isDownloaded = downloadedPacks.includes(pack.id);
                return (
                  <div
                    key={pack.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={pack.avatar}
                        alt={pack.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-[#191919]">{pack.name}</h4>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            {pack.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {pack.author} • {pack.itemsCount} emoticons
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadPack(pack.id)}
                      disabled={isDownloaded}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition ${
                        isDownloaded
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] active:scale-95 shadow-2xs'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Get</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
