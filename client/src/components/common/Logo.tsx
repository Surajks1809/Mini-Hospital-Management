import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 font-sans ${className}`}>
      {/* Premium Medical Symbol: Medical Cross + Pulse Curve in Deep Blue & Teal */}
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 shadow-md shadow-blue-500/20 text-white p-1.5`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Medical Cross Outline */}
          <path d="M10 3h4v5h5v4h-5v5h-4v-5H5v-4h5V3z" fill="rgba(255,255,255,0.18)" stroke="currentColor" />
          {/* Vital Pulse Line Overlay */}
          <path d="M3 12h3.5l1.5-3 2 6 2-4 1.5 2H21" stroke="#38BDF8" strokeWidth="2.2" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight select-none">
          <div className={`font-bold tracking-tight text-slate-900 flex items-center gap-1 ${textClass}`}>
            <span>Medi<span className="text-blue-600">Care</span></span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 tracking-wider">
              HMS
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
            Hospital System
          </span>
        </div>
      )}
    </div>
  );
};
