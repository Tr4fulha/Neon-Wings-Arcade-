
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { TRANSLATIONS } from '../constants';
import { Save, RotateCcw, Zap, Move } from 'lucide-react';
import { HUDSettings } from '../types';
import { sfx } from '../audioService';

export const HUDEditor: React.FC = () => {
  const { playerData, updateHudSettings, setScreen } = useGame();
  const t = TRANSLATIONS[playerData.language];
  
  const [settings, setSettings] = useState<HUDSettings>({ ...playerData.hudSettings });
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado temporário para drag
  const draggingRef = useRef<'joystick' | 'skill' | null>(null);

  const handleDragStart = (type: 'joystick' | 'skill') => {
      draggingRef.current = type;
  };

  const handleMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      // Clamping 0-100
      const cx = Math.max(5, Math.min(95, x));
      const cy = Math.max(5, Math.min(95, y));

      setSettings(prev => ({
          ...prev,
          [draggingRef.current === 'joystick' ? 'joystickPos' : 'skillBtnPos']: { x: cx, y: cy }
      }));
  };

  const handleSave = () => {
      sfx.uiClick();
      updateHudSettings(settings);
      setScreen('options');
  };

  const handleReset = () => {
      sfx.uiClick();
      setSettings({
          opacity: 0.7,
          scale: 1.0,
          leftHanded: false,
          joystickPos: { x: 15, y: 75 },
          skillBtnPos: { x: 85, y: 75 }
      });
  };

  return (
    <div className="fixed inset-0 bg-[#050014] z-[200] flex flex-col">
       {/* Background Grid simulation */}
       <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none"></div>
       
       {/* Header Controls */}
       <div className="relative z-10 bg-[#0a0610] border-b border-gray-800 p-4 flex items-center justify-between">
            <h2 className="text-xl font-display font-black text-cyan-500 italic uppercase">{t.hud_editor}</h2>
            <div className="flex gap-4">
                <button onClick={handleReset} className="text-gray-500 flex items-center gap-1 hover:text-white"><RotateCcw size={16}/> <span className="hidden md:inline">{t.reset_layout}</span></button>
                <button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Save size={16}/> {t.save_layout}</button>
            </div>
       </div>

       {/* Editor Area */}
       <div 
         ref={containerRef}
         className="flex-1 relative overflow-hidden touch-none"
         onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
         onTouchEnd={() => draggingRef.current = null}
         onMouseMove={(e) => draggingRef.current && handleMove(e.clientX, e.clientY)}
         onMouseUp={() => draggingRef.current = null}
         onMouseLeave={() => draggingRef.current = null}
       >
            {/* Center Line for reference */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-800/50 pointer-events-none"></div>

            {/* Draggable Joystick */}
            <div 
                className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 cursor-move group transition-transform duration-75"
                style={{ 
                    left: `${settings.joystickPos.x}%`, 
                    top: `${settings.joystickPos.y}%`,
                    // Usa a MESMA variável settings.scale para ambos os controles
                    transform: `translate(-50%, -50%) scale(${settings.scale})`,
                    // Usa a MESMA variável settings.opacity para ambos
                    opacity: settings.opacity
                }}
                onMouseDown={() => handleDragStart('joystick')}
                onTouchStart={() => handleDragStart('joystick')}
            >
                <div className="w-full h-full rounded-full border-4 border-dashed border-cyan-500/50 bg-cyan-500/10 flex items-center justify-center">
                    <Move className="text-cyan-500" />
                    <span className="absolute -bottom-8 text-[10px] bg-black text-white px-1 whitespace-nowrap">JOYSTICK</span>
                </div>
            </div>

            {/* Draggable Skill Button */}
            <div 
                className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 cursor-move transition-transform duration-75"
                style={{ 
                    left: `${settings.skillBtnPos.x}%`, 
                    top: `${settings.skillBtnPos.y}%`,
                    // Usa a MESMA variável settings.scale
                    transform: `translate(-50%, -50%) scale(${settings.scale})`,
                    // Usa a MESMA variável settings.opacity
                    opacity: settings.opacity
                }}
                onMouseDown={() => handleDragStart('skill')}
                onTouchStart={() => handleDragStart('skill')}
            >
                <div className="w-full h-full rounded-full border-4 border-yellow-400 bg-black/50 flex flex-col items-center justify-center">
                    <Zap size={30} className="text-yellow-400"/>
                    <span className="text-[10px] font-black text-white mt-1">ULTRA</span>
                </div>
            </div>
       </div>

       {/* Bottom Controls */}
       <div className="relative z-10 bg-[#0a0610] border-t border-gray-800 p-6 flex flex-col md:flex-row gap-8 items-center justify-center">
            
            <div className="flex flex-col gap-2 w-full max-w-xs">
                <label className="text-xs font-bold text-gray-400 flex justify-between uppercase">
                    {t.hud_opacity} <span>{Math.round(settings.opacity * 100)}%</span>
                </label>
                <input 
                    type="range" min="0.1" max="1.0" step="0.1" 
                    value={settings.opacity}
                    onChange={(e) => setSettings(p => ({...p, opacity: parseFloat(e.target.value)}))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs">
                <label className="text-xs font-bold text-gray-400 flex justify-between uppercase">
                    {t.hud_scale} <span>{settings.scale.toFixed(1)}x</span>
                </label>
                <input 
                    type="range" min="0.5" max="1.5" step="0.1" 
                    value={settings.scale}
                    onChange={(e) => setSettings(p => ({...p, scale: parseFloat(e.target.value)}))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            <button 
                onClick={() => setSettings(p => ({...p, leftHanded: !p.leftHanded}))}
                className={`px-4 py-2 border rounded font-bold text-xs uppercase tracking-widest transition-all ${settings.leftHanded ? 'bg-pink-600 border-pink-500 text-white' : 'border-gray-600 text-gray-400'}`}
            >
                {t.left_handed}: {settings.leftHanded ? 'ON' : 'OFF'}
            </button>
       </div>
    </div>
  );
};
