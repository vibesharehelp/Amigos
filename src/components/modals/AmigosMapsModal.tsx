import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  MapPin,
  Search,
  Star,
  Coffee,
  Utensils,
  ShoppingBag,
  Send,
  Navigation,
  Share2,
  Check,
} from 'lucide-react';

interface AmigosMapsModalProps {
  onClose: () => void;
  onShareToChat?: (placeName: string) => void;
}

export const AmigosMapsModal: React.FC<AmigosMapsModalProps> = ({ onClose, onShareToChat }) => {
  const [category, setCategory] = useState<'all' | 'cafe' | 'food' | 'store'>('all');
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [sharedToast, setSharedToast] = useState(false);

  const places = [
    {
      id: 'p1',
      name: 'Amigos Friends Gangnam Flagship Store',
      category: 'store',
      type: 'Official Merch & Cafe',
      rating: 4.9,
      reviews: 1420,
      address: '429 Gangnam-daero, Seocho-gu, Seoul',
      photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
      open: 'Open until 22:00',
    },
    {
      id: 'p2',
      name: 'Cafe Onion Seongsu',
      category: 'cafe',
      type: 'Industrial Bakery Cafe',
      rating: 4.8,
      reviews: 2890,
      address: '8 Achasan-ro 9-gil, Seongdong-gu, Seoul',
      photo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
      open: 'Open until 21:00',
    },
    {
      id: 'p3',
      name: 'Maple Tree House Itaewon',
      category: 'food',
      type: 'Premium Korean BBQ & Galbi',
      rating: 4.7,
      reviews: 950,
      address: '26 Itaewon-ro 27ga-gil, Yongsan-gu, Seoul',
      photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
      open: 'Open until 23:00',
    },
    {
      id: 'p4',
      name: 'Daelim Changgo Gallery Cafe',
      category: 'cafe',
      type: 'Art Gallery & Roastery',
      rating: 4.6,
      reviews: 1200,
      address: '78 Seongsui-ro, Seongdong-gu, Seoul',
      photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
      open: 'Open until 22:30',
    },
  ];

  const filteredPlaces = places.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (!search.trim()) return true;
    return p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
  });

  const handleShare = (p: any) => {
    kakaoAudio.playKaTalkChime();
    setSharedToast(true);
    onShareToChat?.(p.name);
    setTimeout(() => setSharedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
              <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos Maps</h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Explore nearby cafes, meetups & hotspots
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

        {/* Search */}
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places in Seoul, cafes, BBQ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FEE500]"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Places' },
              { id: 'store', label: '🦁 Amigos Stores' },
              { id: 'cafe', label: '☕ Hot Cafes' },
              { id: 'food', label: '🍖 Dining & BBQ' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  kakaoAudio.playTap();
                  setCategory(cat.id as any);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition ${
                  category === cat.id
                    ? 'bg-[#191919] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Map View Canvas */}
        <div className="relative w-full h-36 bg-gradient-to-tr from-emerald-100 via-sky-100 to-amber-100 border-b border-slate-200 overflow-hidden flex items-center justify-center">
          {/* Map grid lines */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Pins */}
          <div className="relative z-10 flex items-center gap-6">
            <div className="animate-bounce flex flex-col items-center">
              <div className="px-2 py-0.5 rounded-full bg-[#191919] text-[#FEE500] font-extrabold text-[9px] shadow-md">
                Amigos Gangnam 🦁
              </div>
              <MapPin className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>

            <div className="flex flex-col items-center">
              <div className="px-2 py-0.5 rounded-full bg-white text-slate-800 font-extrabold text-[9px] shadow-sm">
                Onion Cafe ☕
              </div>
              <MapPin className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            </div>
          </div>
        </div>

        {/* Places List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2 hover:border-amber-300 transition"
            >
              <div className="flex gap-3">
                <img
                  src={place.photo}
                  alt={place.name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-extrabold text-xs text-[#191919] leading-tight">
                      {place.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{place.type}</p>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{place.rating}</span>
                    <span className="text-slate-400 text-[10px]">({place.reviews})</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{place.open}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                  {place.address}
                </span>

                <button
                  onClick={() => handleShare(place)}
                  className="px-3 py-1 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold rounded-lg flex items-center gap-1 active:scale-95 transition"
                >
                  {sharedToast ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  <span>{sharedToast ? 'Shared' : 'Share to Chat'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
