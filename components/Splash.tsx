
import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const Splash: React.FC = () => {
  const { checkChangelog } = useGame();

  useEffect(() => {
    const timer = setTimeout(checkChangelog, 3500);
    return () => clearTimeout(timer);
  }, [checkChangelog]);

  return (
    <div className="fixed inset-0 bg-[#050014] z-[100] flex flex-col items-center justify-center overflow-hidden">
      <div className="relative">
        <div className="text-[120px] font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 animate-pulse relative z-10">
          TR4
        </div>
        <div className="absolute inset-0 text-[120px] font-black italic tracking-tighter text-pink-500/30 blur-lg animate-ping">
          TR4
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>
      
      <div className="mt-8 overflow-hidden h-1 w-48 bg-gray-900 rounded-full relative">
        <div className="absolute inset-0 bg-cyan-500 animate-[loading_3s_ease-in-out_infinite]"></div>
      </div>
      
      <p className="mt-4 text-cyan-500/50 text-[10px] tracking-[0.5em] font-display uppercase animate-pulse">
        System Initializing
      </p>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
