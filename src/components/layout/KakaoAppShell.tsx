import React, { useState, useEffect } from 'react';
import { KakaoTab } from '../../types/kakaotalk';
import { KakaoBottomNav } from './KakaoBottomNav';
import { Wifi } from 'lucide-react';

interface KakaoAppShellProps {
  activeTab: KakaoTab;
  unreadChatCount: number;
  onSelectTab: (tab: KakaoTab) => void;
  hideBottomNav?: boolean;
  children: React.ReactNode;
}

export const KakaoAppShell: React.FC<KakaoAppShellProps> = ({
  activeTab,
  unreadChatCount,
  onSelectTab,
  hideBottomNav = false,
  children,
}) => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[100dvh] min-h-[100dvh] bg-[#ECEEF2] flex items-center justify-center p-0 sm:p-3 overflow-hidden font-sans select-none">
      {/* Mobile Frame Container */}
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[min(890px,96vh)] sm:rounded-[42px] sm:border-[6px] sm:border-[#2C2D30] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.2)] overflow-hidden bg-white flex flex-col z-10 box-border">
        
        {/* iOS Native Status Bar */}
        <div className="relative z-40 w-full h-8 px-6 pt-1 flex items-center justify-between text-xs text-[#191919] select-none shrink-0 bg-transparent pointer-events-none">
          {/* Clock */}
          <span className="font-semibold text-[13px] tracking-tight pl-1 text-[#191919]">
            {timeString || '9:41'}
          </span>

          {/* Dynamic Island pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-4.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FEE500]" />
              <div className="w-2 h-2 rounded-full bg-[#1A1A1A] border border-white/10" />
            </div>
          </div>

          {/* Icons: 5G, Wi-Fi, Battery */}
          <div className="flex items-center gap-2 pr-1">
            <span className="text-[10px] font-bold text-[#191919]">5G</span>
            <Wifi className="w-3.5 h-3.5 stroke-[2.2] text-[#191919]" />
            <div className="w-5 h-2.5 rounded-[4px] border border-[#191919] p-0.5 flex items-center">
              <div className="w-full h-full bg-[#191919] rounded-[2px]" />
            </div>
          </div>
        </div>

        {/* Viewport Content Area */}
        <main className="relative flex-1 min-h-0 w-full flex flex-col overflow-hidden bg-[#F5F6F8]">
          {children}
        </main>

        {/* Persistent Amigos Bottom Nav (hidden during in-chat or call) */}
        {!hideBottomNav && (
          <KakaoBottomNav
            activeTab={activeTab}
            unreadChatCount={unreadChatCount}
            onSelectTab={onSelectTab}
          />
        )}
      </div>
    </div>
  );
};
