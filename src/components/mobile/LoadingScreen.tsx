import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#1D1D1D] flex items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-8">
        <div className="glow-animation">
          <img
            src="/spoonfull-icon.SVG"
            alt="Spoonfull"
            className="pulse-animation w-20 h-auto"
          />
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7894FF] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#7894FF] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#7894FF] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
