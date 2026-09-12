import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, ArrowLeft, Circle, Square } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  onAndroidBack?: () => void;
  title?: string;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isDarkMode,
  onAndroidBack,
  title,
}) => {
  const [timeStr, setTimeStr] = useState<string>('۱۲:۴۵');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-0 sm:p-4 transition-colors ${
        isDarkMode ? 'bg-slate-950' : 'bg-slate-200'
      }`}
    >
      {/* Phone Shell Container */}
      <div
        className={`relative w-full max-w-[440px] h-[100dvh] sm:h-[94vh] sm:max-h-[880px] sm:rounded-[42px] overflow-hidden flex flex-col shadow-2xl transition-colors ${
          isDarkMode
            ? 'bg-slate-950 text-slate-100 sm:border-8 sm:border-slate-800'
            : 'bg-slate-50 text-slate-900 sm:border-8 sm:border-slate-300'
        }`}
      >
        {/* Android Status Bar (Material 3 Style) */}
        <div
          className={`h-7 px-6 flex items-center justify-between text-[11px] font-medium z-30 select-none flex-shrink-0 transition-colors ${
            isDarkMode ? 'bg-slate-900/90 text-slate-300' : 'bg-slate-200/90 text-slate-700'
          }`}
        >
          {/* Clock */}
          <span className="font-sans font-semibold tracking-wider">{timeStr}</span>

          {/* Camera punch hole dot in center */}
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-700/60" />

          {/* Status Icons */}
          <div className="flex items-center gap-1.5 opacity-90">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={14} className="rotate-90" />
          </div>
        </div>

        {/* Dynamic App Content Screen */}
        <div className="relative flex-1 flex flex-col overflow-hidden bg-slate-950">
          {children}
        </div>

        {/* Android Navigation Bar (Bottom) */}
        <div
          className={`h-8 flex items-center justify-center gap-12 z-30 select-none flex-shrink-0 transition-colors ${
            isDarkMode ? 'bg-slate-950 border-t border-slate-900' : 'bg-slate-100 border-t border-slate-200'
          }`}
        >
          {/* Android Back button */}
          <button
            onClick={onAndroidBack}
            className="p-1 text-slate-500 hover:text-slate-300 active:scale-90 transition-transform"
            title="بازگشت"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Android Home indicator / pill */}
          <div className="w-24 h-1 rounded-full bg-slate-600/70" />

          {/* Android Recents */}
          <button
            className="p-1 text-slate-600"
            disabled
          >
            <Square size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
