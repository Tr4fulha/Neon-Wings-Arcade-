
import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, Settings, Trophy, ShoppingBag, BookOpen, Play, ScrollText, Crosshair } from 'lucide-react';
import { TRANSLATIONS, APP_VERSION } from '../constants';
import { useGame } from '../context/GameContext';
import { drawGrid, drawStars } from '../renderer/CanvasRenderer';
import { Star } from '../types';
import { sfx, music } from '../audioService';

export const MainMenu: React.FC = () => {
  const { setScreen, isOnline, playerData, updateName, startDailyChallenge, dailyConfig } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(playerData.username || 'PILOT');
  const t = TRANSLATIONS[playerData.language];
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
      // Iniciar Música do Menu
      music.playMenu();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const resize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', resize);
      resize();

      const stars: Star[] = [];
      for(let i=0; i<60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 20 + Math.random() * 50,
            size: 1 + Math.random() * 2,
            opacity: 0.2 + Math.random() * 0.6
        });
      }

      let animationId: number;
      let gridOffset = 0;
      let lastTime = performance.now();

      const loop = (time: number) => {
          const dt = (time - lastTime) / 1000;
          lastTime = time;
          
          gridOffset = (gridOffset + 40 * dt) % 60;
          
          stars.forEach(s => {
              s.y += s.speed * dt;
              if(s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
          });

          drawGrid(ctx, canvas.width, canvas.height, gridOffset);
          drawStars(ctx, stars);

          const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/3, canvas.width/2, canvas.height/2, canvas.height);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, 'rgba(5, 0, 20, 0.8)');
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, canvas.width, canvas.height);

          animationId = requestAnimationFrame(loop);
      };
      animationId = requestAnimationFrame(loop);

      return () => {
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', resize);
      };
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      sfx.uiClick();
      updateName(tempName.trim().toUpperCase());
      setIsEditing(false);
    }
  };

  const startEdit = () => {
      sfx.uiClick();
      setIsEditing(true);
  }

  const handleLaunch = () => {
      sfx.uiClick();
      setScreen('ship-select');
  }

  const handleDaily = () => {
      sfx.uiClick();
      startDailyChallenge();
  }

  const getRank = (score: number) => {
      if (score > 100000) return 'ACE';
      if (score > 50000) return 'LEGEND';
      if (score > 10000) return 'VETERAN';
      return 'ROOKIE';
  }

  return (
    <div className="w-full h-full bg-[#050014] overflow-y-auto custom-scrollbar relative flex flex-col items-center justify-center p-4">
      {/* Fundo Canvas Dinâmico */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full" />
      
      {/* Container Principal */}
      <div className="z-10 w-full max-w-[1200px] flex flex-col landscape:flex-row items-center landscape:items-stretch justify-center gap-4 md:gap-12">
        
        {/* LADO ESQUERDO: Perfil */}
        <div className="w-full max-w-lg landscape:flex-1 flex flex-col gap-3">
            <div className="w-full h-12 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-700 rounded-sm relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #fff 5px)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-display font-black tracking-[1em] text-white uppercase italic">NEON WINGS ARCADE</span>
                </div>
            </div>

            <div className="w-full bg-[#0a0610]/95 border border-gray-800 rounded-xl p-5 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-md shadow-lg flex items-center justify-center relative shrink-0">
                        <span className="font-display font-black text-4xl text-white drop-shadow-md z-10">{playerData.level}</span>
                        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-cyan-500 text-[9px] font-bold tracking-[0.3em] uppercase mb-1">{t.pilot_id}</p>
                        {isEditing ? (
                             <div className="flex items-center gap-2">
                                <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="bg-gray-900 border border-cyan-500 text-white px-2 py-1 font-display outline-none w-full uppercase text-sm" autoFocus />
                                <button onClick={handleSaveName} className="text-green-500 hover:scale-110 shrink-0"><Check size={20}/></button>
                             </div>
                        ) : (
                            <div className="group/name cursor-pointer truncate" onClick={startEdit}>
                                <h2 className="text-2xl md:text-4xl font-display font-black text-white italic tracking-wide flex items-center gap-3 truncate">
                                    {playerData.username} 
                                    <Edit2 size={14} className="text-gray-700 group-hover/name:text-cyan-500 transition-colors opacity-0 group-hover/name:opacity-100 shrink-0"/>
                                </h2>
                                <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-1">Status: {getRank(playerData.highScore)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0f0919] rounded-lg p-3 border-l-4 border-pink-500 shadow-inner">
                        <p className="text-pink-500 text-[9px] font-bold tracking-widest uppercase mb-1">{t.credits}</p>
                        <p className="font-display text-white text-lg md:text-2xl truncate">{playerData.scrap.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0f0919] rounded-lg p-3 border-l-4 border-cyan-500 shadow-inner">
                        <p className="text-cyan-500 text-[9px] font-bold tracking-widest uppercase mb-1">{t.high_score}</p>
                        <p className="font-display text-white text-lg md:text-2xl truncate">{playerData.highScore.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* LADO DIREITO: Ações */}
        <div className="w-full max-w-lg landscape:flex-1 flex flex-col gap-4">
            
            <div className="flex gap-4 h-24 md:h-32">
                <button 
                  onClick={handleLaunch} 
                  className="flex-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 rounded-lg relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl active:scale-95 flex flex-col items-center justify-center gap-2"
                >
                    <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)' }}></div>
                    <Play className="fill-white w-8 h-8 md:w-12 md:h-12 drop-shadow-lg group-hover:scale-110 transition-transform" />
                    <span className="font-display font-black text-xl md:text-3xl tracking-[0.1em] text-white drop-shadow-md uppercase italic">{t.launch}</span>
                </button>

                <button 
                  onClick={handleDaily}
                  disabled={!isOnline} 
                  className={`
                      w-1/3 bg-[#110d18] border border-yellow-500/30 rounded-lg relative overflow-hidden group hover:border-yellow-500 transition-all flex flex-col items-center justify-center gap-1
                      ${!isOnline ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}
                  `}
                >
                    {isOnline && <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></div></div>}
                    <Crosshair className="text-yellow-400 w-6 h-6 md:w-8 md:h-8 mb-1" />
                    <span className="font-display font-black text-sm md:text-lg text-yellow-400 italic">DAILY OPS</span>
                    <span className="text-[8px] text-gray-500 font-mono tracking-tighter uppercase">{dailyConfig.ship.name} PROTOCOL</span>
                </button>
            </div>

            {/* Grid de Botões Secundários */}
            <div className="grid grid-cols-5 gap-2 h-16 md:h-24">
                 <SecondaryBtn icon={<ShoppingBag size={24}/>} label={t.shop} onClick={() => setScreen('shop')} color="border-cyan-500/30 text-cyan-500" />
                 <SecondaryBtn icon={<Trophy size={24}/>} label={t.rank} onClick={() => setScreen('leaderboard')} color="border-purple-500/30 text-purple-500" disabled={!isOnline} />
                 <SecondaryBtn icon={<Settings size={24}/>} label={t.opts} onClick={() => setScreen('options')} color="border-blue-500/30 text-blue-500" />
                 <SecondaryBtn icon={<BookOpen size={24}/>} label={t.info} onClick={() => setScreen('credits')} color="border-pink-500/30 text-pink-500" />
                 <SecondaryBtn icon={<ScrollText size={24}/>} label="LOG" onClick={() => setScreen('changelog')} color="border-yellow-500/30 text-yellow-500" />
            </div>
        </div>

      </div>
      
      <div className="fixed bottom-4 right-6 text-cyan-500/20 text-[9px] font-display pointer-events-none select-none italic tracking-widest">
          SYS_VER: {APP_VERSION} // ONLINE_STATUS: {isOnline ? 'ACTIVE' : 'OFFLINE'}
      </div>
    </div>
  );
};

const SecondaryBtn = ({ icon, label, onClick, color, disabled }: any) => (
    <button onClick={() => { sfx.uiClick(); onClick(); }} disabled={disabled} className={`h-full bg-[#0a0610]/90 border ${color} rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-white/5 active:scale-90 transition-all ${disabled ? 'opacity-30 grayscale' : 'hover:border-opacity-100'}`}>
        <div className="shrink-0">{icon}</div>
        <span className="text-[7px] md:text-[10px] font-bold tracking-widest uppercase truncate w-full px-1 text-center">{label}</span>
    </button>
);
