import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  BookOpen,
  Heart,
  Star,
  Eye,
  MessageCircle,
  Share2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface AmigosPageModalProps {
  onClose: () => void;
}

export const AmigosPageModal: React.FC<AmigosPageModalProps> = ({ onClose }) => {
  const [selectedWebtoon, setSelectedWebtoon] = useState<any | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({
    w1: 18420,
    w2: 12500,
    w3: 24900,
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  const webtoons = [
    {
      id: 'w1',
      title: 'The Secret Life of Choonsik',
      author: 'Amigos Toon',
      genre: 'Comedy • Daily Life',
      rating: 9.9,
      cover: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&auto=format&fit=crop&q=80',
      description: 'Choonsik’s undercover mission to collect the sweetest roasted sweet potatoes in Seoul!',
      episodes: [
        { ep: 1, title: 'Ep 1. Finding the Golden Sweet Potato 🍠', views: '142K' },
        { ep: 2, title: 'Ep 2. Ryan’s Sofa Hijacking Mission 🛋️', views: '128K' },
        { ep: 3, title: 'Ep 3. Midnight Kitchen Heist 🐾', views: '98K' },
      ],
    },
    {
      id: 'w2',
      title: 'Han River Cafe Diaries',
      author: 'Breeze Studio',
      genre: 'Romance • Slice of Life',
      rating: 9.8,
      cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      description: 'Heartwarming encounters at a small rooftop cafe overlooking the Han River.',
      episodes: [
        { ep: 1, title: 'Ep 1. Warm Latte on a Rainy Day ☕', views: '95K' },
        { ep: 2, title: 'Ep 2. An Unexpected Regular 🌿', views: '88K' },
      ],
    },
    {
      id: 'w3',
      title: 'Solo Level-Up in Gangnam',
      author: 'K-Fantasy Works',
      genre: 'Action • Fantasy',
      rating: 9.9,
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
      description: 'When mysterious dungeon portals open under Gangnam Station Subway Exit 11!',
      episodes: [
        { ep: 1, title: 'Ep 1. The Red Portal Underground ⚔️', views: '210K' },
        { ep: 2, title: 'Ep 2. Awakening the S-Rank Shield 🛡️', views: '190K' },
      ],
    },
  ];

  const handleToggleLike = (id: string) => {
    kakaoAudio.playTap();
    const isLiked = userLiked[id];
    setUserLiked((prev) => ({ ...prev, [id]: !isLiked }));
    setLikes((prev) => ({ ...prev, [id]: (prev[id] || 0) + (isLiked ? -1 : 1) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            {selectedWebtoon ? (
              <button
                onClick={() => {
                  kakaoAudio.playTap();
                  setSelectedWebtoon(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">
                {selectedWebtoon ? selectedWebtoon.title : 'Amigos Page'}
              </h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Popular webtoons, stories & culture
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

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {selectedWebtoon ? (
            /* Episode List & Detail Screen */
            <div className="space-y-4">
              <div className="relative h-44 rounded-2xl overflow-hidden shadow-md">
                <img
                  src={selectedWebtoon.cover}
                  alt={selectedWebtoon.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                  <h3 className="font-extrabold text-base">{selectedWebtoon.title}</h3>
                  <p className="text-xs text-slate-200">{selectedWebtoon.genre}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{selectedWebtoon.rating}</span>
                </div>

                <button
                  onClick={() => handleToggleLike(selectedWebtoon.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                    userLiked[selectedWebtoon.id]
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${userLiked[selectedWebtoon.id] ? 'fill-white' : ''}`} />
                  <span>{likes[selectedWebtoon.id]?.toLocaleString()}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedWebtoon.description}
              </p>

              {/* Episodes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Episodes Available
                </span>

                {selectedWebtoon.episodes.map((ep: any) => (
                  <div
                    key={ep.ep}
                    onClick={() => {
                      kakaoAudio.playTap();
                      alert(`Reading ${ep.title}! Enjoy the chapter!`);
                    }}
                    className="p-3 bg-white hover:bg-amber-50/60 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition active:scale-[0.99]"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#191919]">{ep.title}</h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Eye className="w-3 h-3" /> {ep.views} views
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Webtoon Catalog */
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-[#191919] block">
                ⭐ Top Trending Webtoons Today
              </span>

              {webtoons.map((wt) => (
                <div
                  key={wt.id}
                  onClick={() => {
                    kakaoAudio.playTap();
                    setSelectedWebtoon(wt);
                  }}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 cursor-pointer hover:border-red-300 transition active:scale-[0.99]"
                >
                  <img
                    src={wt.cover}
                    alt={wt.title}
                    className="w-16 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                      {wt.genre}
                    </span>
                    <h3 className="font-extrabold text-xs text-[#191919] truncate leading-tight mt-0.5">
                      {wt.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{wt.author}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {wt.rating}
                      </span>
                      <span>•</span>
                      <span>{wt.episodes.length} Episodes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
