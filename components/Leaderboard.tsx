
import React, { useEffect, useState } from 'react';
import { getLeaderboard, getDailyLeaderboard } from '../supabaseService';
import { Profile, DailyScore } from '../types';
import { ArrowLeft, Trophy, Medal, Crown, Crosshair } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';
import { TRANSLATIONS } from '../constants';

type Tab = 'global' | 'daily';

export const Leaderboard: React.FC = () => {
  const { goToMenu, playerData } = useGame();
  const [globalScores, setGlobalScores] = useState<Profile[]>([]);
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('global');
  const t = TRANSLATIONS[playerData.language];

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      const [g, d] = await Promise.all([getLeaderboard(), getDailyLeaderboard()]);
      setGlobalScores(g);
      setDailyScores(d);
      setLoading(false);
    };
    fetchScores();
  }, []);

  const handleBack = () => {
      sfx.uiClick();
      goToMenu();
  }

  return (
    <div className="w-full h-full bg-[#050014] flex items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 retro-grid opacity-15 pointer-events-none"></div>

      <div className="w-full h-full flex flex-col md:flex-row relative z-10">
        
        {/* SIDEBAR: Summary & Navigation */}
        <div className="w-full md:w-80 bg-[#0a0610]/95 border-r border-white/5 flex flex-col shrink-0 h-auto md:h-full relative shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
            
            <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-950/20 to-transparent">
                <Trophy className="text-purple-400 mb-4" size={48} />
                <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-display tracking-wide uppercase leading-none">
                    HALL OF<br/>FAME
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setTab('global')}
                    className={`flex-1 p-3 text-xs font-bold uppercase tracking-widest ${tab === 'global' ? 'bg-purple-900/30 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    GLOBAL
                </button>
                <button 
                    onClick={() => setTab('daily')}
                    className={`flex-1 p-3 text-xs font-bold uppercase tracking-widest ${tab === 'daily' ? 'bg-yellow-900/30 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    DAILY OPS
                </button>
            </div>

            {/* Current Pilot Card */}
            <div className="p-6">
                <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase mb-2">{t.pilot_id}</p>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center font-bold text-black text-lg">
                             {playerData.username?.charAt(0) || "P"}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="text-white font-display font-bold text-lg truncate">{playerData.username}</h3>
                            <p className="text-gray-500 text-xs">LVL {playerData.level}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-white/10 pt-3">
                        <span className="text-gray-400 text-xs">BEST SCORE</span>
                        <span className="text-2xl font-display font-black text-white">{playerData.highScore.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 mt-auto border-t border-white/5">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group w-full p-2">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="font-bold tracking-widest text-xs uppercase">{t.back}</span>
                </button>
            </div>
        </div>

        {/* CONTENT: Leaderboard Table */}
        <div className="flex-1 bg-black/20 relative overflow-hidden flex flex-col">
            
            {/* Top Shine */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${tab === 'daily' ? 'via-yellow-500/50' : 'via-purple-500/50'} to-transparent`}></div>

            <div className="flex-1 overflow-y-auto p-0 md:p-8 custom-scrollbar">
                <div className="bg-[#0f0b1a] border border-white/5 md:rounded-xl overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead className={`bg-opacity-20 text-xs tracking-widest sticky top-0 backdrop-blur-md z-10 ${tab === 'daily' ? 'bg-yellow-900 text-yellow-300' : 'bg-purple-900 text-purple-300'}`}>
                        <tr>
                          <th className="p-4 md:p-6 border-b border-white/5">#</th>
                          <th className="p-4 md:p-6 border-b border-white/5 w-full">PILOT</th>
                          <th className="p-4 md:p-6 border-b border-white/5 text-right">SCORE</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-sm md:text-lg">
                        {loading ? (
                            <tr><td colSpan={3} className="p-12 text-center text-purple-400 animate-pulse tracking-widest text-xs">ESTABLISHING UPLINK...</td></tr>
                        ) : (tab === 'global' ? globalScores : dailyScores).length === 0 ? (
                            <tr><td colSpan={3} className="p-12 text-center text-gray-600 tracking-widest text-xs">NO RECORDS FOUND</td></tr>
                        ) : (tab === 'global' ? globalScores : dailyScores).map((entry: any, index: number) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="p-4 md:p-6">
                                <RankBadge index={index} />
                            </td>
                            <td className="p-4 md:p-6">
                                <div className="flex flex-col">
                                    <span className={`font-bold transition-colors ${index < 3 ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {entry.username || (entry.user_id ? `PILOT-${entry.user_id.substring(0, 4).toUpperCase()}` : 'PILOT')}
                                    </span>
                                    {entry.ship_id && <span className="text-[10px] text-yellow-600 font-bold uppercase">{entry.ship_id.toUpperCase()} CLASS</span>}
                                    {entry.level && <span className="text-[10px] text-gray-600">Level {entry.level}</span>}
                                </div>
                            </td>
                            <td className={`p-4 md:p-6 text-right font-display font-bold ${tab === 'daily' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                              {(entry.score || entry.high_score).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const RankBadge = ({ index }: { index: number }) => {
    if (index === 0) return (
        <div className="w-8 h-8 rounded bg-yellow-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse">
            <Crown size={16} fill="black" />
        </div>
    );
    if (index === 1) return (
        <div className="w-8 h-8 rounded bg-gray-300 text-black flex items-center justify-center font-bold">2</div>
    );
    if (index === 2) return (
        <div className="w-8 h-8 rounded bg-orange-700 text-white flex items-center justify-center font-bold border border-orange-500">3</div>
    );
    return (
        <div className="w-8 h-8 rounded bg-gray-800 text-gray-500 flex items-center justify-center font-bold text-xs">{index + 1}</div>
    );
};
