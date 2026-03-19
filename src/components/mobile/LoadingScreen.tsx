import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#1D1D1D] flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8">
        <div className="glow-animation">
          <img
            src="/Spoonfull-Logo-DarkBG copy.svg"
            alt="Spoonfull Logo"
            className="pulse-animation w-64 h-auto md:w-80 lg:w-96"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[#7894FF] text-lg font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
