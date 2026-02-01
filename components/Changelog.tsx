
import React from 'react';
import { TRANSLATIONS } from '../constants';
import { X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';

export const Changelog: React.FC = () => {
  const { markVersionAsSeen, playerData } = useGame();
  const t = TRANSLATIONS[playerData.language];
  const logs = t.changelog || [];

  const handleClose = () => {
      sfx.uiClick();
      markVersionAsSeen();
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#0a0610] border border-cyan-500/50 rounded-xl p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X />
        </button>
        
        <h2 className="text-4xl font-display font-black italic text-cyan-500 mb-2 tracking-widest uppercase">
          {t.changelog_title}
        </h2>
        <p className="text-gray-500 text-[10px] mb-8 uppercase tracking-widest opacity-50">
          Syncing system logs...
        </p>
        
        <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
          {logs.map((log: any) => (
            <div key={log.version} className="border-l-2 border-pink-500 pl-4">
              <h3 className="text-xl font-display font-bold text-white mb-2">v{log.version}</h3>
              <ul className="space-y-1">
                {log.changes.map((change: string, i: number) => (
                  <li key={i} className="text-gray-400 text-sm flex gap-2">
                    <span className="text-cyan-500">›</span> {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleClose}
          className="w-full mt-8 py-4 bg-cyan-600 text-white font-display font-bold tracking-widest hover:bg-cyan-500 transition-all active:scale-95 skew-x-[-10deg]"
        >
          {t.understand}
        </button>
      </div>
    </div>
  );
};
