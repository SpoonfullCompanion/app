import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#1D1D1D] flex flex-col items-center px-6">
      <div className="pt-16 md:pt-20">
        <img
          src="/Spoonfull-Logo-DarkBG.svg"
          alt="Spoonfull"
          className="w-40 h-auto opacity-90 md:w-48"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="glow-animation">
          <img
            src="/spoonfull-icon.SVG"
            alt="Spoonfull"
            className="pulse-animation w-24 h-auto md:w-28 lg:w-32"
          />
        </div>
        <p className="text-[#7894FF] text-lg font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
