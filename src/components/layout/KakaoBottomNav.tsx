import React from 'react';
import { KakaoTab } from '../../types/kakaotalk';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  Home,
  MessageCircle,
  Hash,
  Video,
  MoreHorizontal,
} from 'lucide-react';

interface KakaoBottomNavProps {
  activeTab: KakaoTab;
  unreadChatCount: number;
  onSelectTab: (tab: KakaoTab) => void;
}

export const KakaoBottomNav: React.FC<KakaoBottomNavProps> = ({
  activeTab,
  unreadChatCount,
  onSelectTab,
}) => {
  const tabs: Array<{
    id: KakaoTab;
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'friends',
      label: 'Home',
      icon: <Home className="w-[22px] h-[22px] stroke-[1.8]" />,
      activeIcon: <Home className="w-[22px] h-[22px] stroke-[2.4] fill-current" />,
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageCircle className="w-[22px] h-[22px] stroke-[1.8]" />,
      activeIcon: <MessageCircle className="w-[22px] h-[22px] fill-current stroke-[2]" />,
      badgeCount: unreadChatCount,
    },
    {
      id: 'openchat',
      label: 'OpenChat',
      icon: <Hash className="w-[22px] h-[22px] stroke-[2]" />,
      activeIcon: <Hash className="w-[22px] h-[22px] stroke-[2.8]" />,
    },
    {
      id: 'amigocall',
      label: 'AmigoCall',
      icon: <Video className="w-[22px] h-[22px] stroke-[1.8]" />,
      activeIcon: <Video className="w-[22px] h-[22px] fill-current stroke-[2]" />,
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreHorizontal className="w-[22px] h-[22px] stroke-[2]" />,
      activeIcon: <MoreHorizontal className="w-[22px] h-[22px] stroke-[2.8]" />,
    },
  ];

  return (
    <nav className="relative z-30 w-full h-[60px] bg-white border-t border-slate-200/80 flex items-center justify-around select-none shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              kakaoAudio.playTap();
              onSelectTab(tab.id);
            }}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-transform active:scale-95 ${
              isActive ? 'text-[#191919]' : 'text-[#8E8E93] hover:text-[#555555]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {isActive ? tab.activeIcon : tab.icon}

              {tab.badgeCount && tab.badgeCount > 0 ? (
                <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 bg-[#FF4B4B] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                </span>
              ) : null}
            </div>

            <span
              className={`text-[10px] mt-0.5 tracking-tight ${
                isActive ? 'font-bold text-[#191919]' : 'font-medium text-[#8E8E93]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
