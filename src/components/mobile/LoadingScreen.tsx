import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#1D1D1D] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8">
        <div className="glow-animation">
          <img
            src="/spoonfull-icon.SVG"
            alt="Spoonfull"
            className="pulse-animation w-24 h-auto md:w-28 lg:w-32"
          />
        </div>

        <img
          src="/Spoonfull-Logo-DarkBG.svg"
          alt="Spoonfull"
          className="w-40 h-auto opacity-90 md:w-48"
        />

        <div className="flex flex-col items-center gap-2">
          <p className="text-[#7894FF] text-lg font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
