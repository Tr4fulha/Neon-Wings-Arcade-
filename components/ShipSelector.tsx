
import React, { useState } from 'react';
import { SHIPS, TRANSLATIONS, MODULES } from '../constants';
import { Lock, Cpu, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';

export const ShipSelector: React.FC = () => {
  const { launchGame, goToMenu, playerData, equipModule, unequipModule } = useGame();
  const [selectedId, setSelectedId] = useState<string>('core');
  const [isEquippingSlot, setIsEquippingSlot] = useState<number | null>(null);

  const selectedShip = SHIPS.find(s => s.id === selectedId) || SHIPS[0];
  const maxWave = playerData.maxWave || 0;
  const isLocked = maxWave < selectedShip.unlockWave;

  // Maestria
  const mastery = playerData.shipMastery[selectedId] || { xp: 0, level: 1 };
  const xpToNext = mastery.level * 500;
  const xpPercent = Math.min(100, (mastery.xp / xpToNext) * 100);

  // Módulos
  const equippedModules = playerData.modules.equipped[selectedId] || [];
  const inventoryModules = playerData.modules.inventory;

  // Access translations
  const t = TRANSLATIONS[playerData.language];
  const getT = (key: string) => key.split('.').reduce((obj, i) => obj?.[i], t) || key;

  const handleLaunch = () => {
      sfx.uiClick();
      launchGame(selectedShip);
  }

  const handleSelect = (id: string) => {
      sfx.uiClick();
      setSelectedId(id);
      setIsEquippingSlot(null);
  }

  const handleBack = () => {
      sfx.uiClick();
      goToMenu();
  }

  const handleEquip = (moduleId: string) => {
      if (isEquippingSlot !== null) {
          sfx.uiClick();
          equipModule(selectedId, moduleId, isEquippingSlot);
          setIsEquippingSlot(null);
      }
  }

  const handleUnequip = (slotIdx: number) => {
      sfx.uiClick();
      unequipModule(selectedId, slotIdx);
  }

  return (
    <div className="w-full h-full bg-[#050014] flex flex-col md:justify-center p-0 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 retro-grid opacity-20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-6xl mx-auto flex flex-col md:grid md:grid-cols-12 gap-0 md:gap-8 h-full md:h-[90vh] bg-[#050014] md:bg-transparent">
        
        {/* HEADER (Mobile Only) */}
        <div className="md:hidden p-4 border-b border-gray-800 bg-[#0a0610]">
            <h2 className="text-xl font-display font-black text-white italic">SELECT CRAFT</h2>
        </div>

        {/* LEFT: Ship Preview & Config */}
        <div className="md:col-span-8 order-1 md:order-2 flex flex-col relative h-[60vh] md:h-auto overflow-y-auto custom-scrollbar">
            
            {/* Holographic Ship Preview */}
            <div className="h-64 md:h-[40vh] flex items-center justify-center relative bg-gradient-to-b from-[#0a0610] to-transparent shrink-0">
                 <div className="absolute inset-0 bg-cyan-500/5 blur-[50px] md:blur-[100px] rounded-full pointer-events-none"></div>
                 <div className="absolute bottom-10 md:bottom-20 w-48 md:w-64 h-16 md:h-24 border border-cyan-500/30 rounded-[100%] animate-[spin_10s_linear_infinite] [transform:rotateX(70deg)]"></div>
                 
                 <div className="relative z-10 animate-bounce transition-all duration-500">
                     <div 
                        className={`
                            w-24 h-24 md:w-32 md:h-32 border-2 relative rotate-45 transition-colors duration-300
                            ${isLocked ? 'border-red-500 shadow-[0_0_20px_#ef4444]' : 'border-cyan-400 shadow-[0_0_30px_#06b6d4]'}
                        `}
                     >
                        <div className="absolute inset-0 border border-white/20 m-2"></div>
                     </div>
                 </div>
            </div>

            {/* Stats & Modules Panel */}
            <div className="bg-[#0f0919] border-t border-cyan-500/30 p-6 md:p-8 backdrop-blur-xl shrink-0">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-display font-black text-white italic">{selectedShip.name}</h1>
                        <p className="text-cyan-400 text-xs md:text-sm tracking-widest mt-1 md:mt-2">{getT(selectedShip.descriptionKey)}</p>
                    </div>
                    {isLocked && <div className="text-red-500 font-bold border border-red-500 px-2 py-1 md:px-4 md:py-2 rounded text-[10px] md:text-xs">LOCKED</div>}
                 </div>

                 {/* Mastery Bar */}
                 <div className="mb-6 bg-gray-900 rounded-lg p-3 border border-gray-700">
                     <div className="flex justify-between text-xs font-bold mb-1">
                         <span className="text-purple-400">{t.mastery} LVL {mastery.level}</span>
                         <span className="text-gray-500">{mastery.level >= 5 ? 'MAX' : `${mastery.xp}/${xpToNext} XP`}</span>
                     </div>
                     <div className="h-2 bg-black rounded-full overflow-hidden mb-2">
                         <div className="h-full bg-purple-500" style={{ width: `${mastery.level >= 5 ? 100 : xpPercent}%` }}></div>
                     </div>
                     <p className="text-[10px] text-gray-400">{getT(selectedShip.masteryBonusKey)}</p>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatBar label="SPEED" value={selectedShip.speed} max={10} color="bg-blue-500" />
                    <StatBar label="POWER" value={selectedShip.power * 5} max={10} color="bg-pink-500" />
                    <StatBar label="ARMOR" value={selectedShip.health * 2} max={10} color="bg-green-500" />
                 </div>

                 {/* Module Slots */}
                 {!isLocked && (
                     <div className="mb-6">
                         <h3 className="text-cyan-500 text-xs font-bold tracking-widest mb-3 uppercase">{t.modules_title}</h3>
                         <div className="flex gap-4">
                             {Array.from({ length: selectedShip.slots }).map((_, idx) => {
                                 const modId = equippedModules[idx];
                                 const mod = MODULES.find(m => m.id === modId);
                                 return (
                                     <button 
                                        key={idx}
                                        onClick={() => setIsEquippingSlot(isEquippingSlot === idx ? null : idx)}
                                        className={`
                                            w-16 h-16 border rounded bg-black/40 flex items-center justify-center relative
                                            ${isEquippingSlot === idx ? 'border-white shadow-[0_0_15px_white]' : 'border-gray-700 hover:border-cyan-500'}
                                        `}
                                     >
                                         {mod ? (
                                             <div className="text-cyan-400 flex flex-col items-center">
                                                 <Cpu size={20} />
                                                 <button 
                                                    onClick={(e) => { e.stopPropagation(); handleUnequip(idx); }}
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-400"
                                                 >
                                                     <X size={12}/>
                                                 </button>
                                             </div>
                                         ) : (
                                             <span className="text-gray-600 text-[10px] uppercase">{t.empty_slot}</span>
                                         )}
                                     </button>
                                 );
                             })}
                         </div>
                         
                         {/* Module Selection Modal (Inline) */}
                         {isEquippingSlot !== null && (
                             <div className="mt-4 p-4 bg-gray-900/80 border border-gray-700 rounded grid grid-cols-1 md:grid-cols-2 gap-2 animate-fade-in">
                                 {inventoryModules.map(modId => {
                                     const m = MODULES.find(x => x.id === modId);
                                     if (!m) return null;
                                     // Não mostrar se já equipado em outro slot
                                     const isEquippedElsewhere = equippedModules.includes(modId) && equippedModules[isEquippingSlot] !== modId;
                                     if (isEquippedElsewhere) return null;

                                     return (
                                         <button 
                                            key={modId}
                                            onClick={() => handleEquip(modId)}
                                            className="flex items-center gap-3 p-2 bg-black border border-gray-800 hover:border-cyan-500 text-left"
                                         >
                                             <div className="bg-cyan-900/30 p-2 rounded"><Cpu size={16} className="text-cyan-400"/></div>
                                             <div>
                                                 <p className="text-xs font-bold text-white uppercase">{getT(m.nameKey)}</p>
                                                 <p className="text-[10px] text-gray-500 truncate">{getT(m.descKey)}</p>
                                             </div>
                                         </button>
                                     );
                                 })}
                                 {inventoryModules.length === 0 && <p className="text-gray-500 text-xs italic p-2">NO MODULES IN INVENTORY. VISIT SHOP.</p>}
                             </div>
                         )}
                     </div>
                 )}

                 <button 
                    onClick={handleLaunch}
                    disabled={isLocked}
                    className={`
                        w-full py-4 md:py-6 font-display font-black text-xl md:text-2xl tracking-widest transition-all relative overflow-hidden group
                        ${isLocked 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'}
                    `}
                 >
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)' }}></div>
                    <span className="relative z-10">{isLocked ? 'LOCKED' : t.initiate_launch}</span>
                 </button>
            </div>
        </div>

        {/* RIGHT: Ship List */}
        <div className="md:col-span-4 order-2 md:order-1 bg-[#0a0610] md:bg-glass border-t md:border-r border-cyan-500/20 p-4 md:p-6 flex flex-col gap-2 md:gap-4 overflow-y-auto h-[30vh] md:h-auto">
           <h2 className="hidden md:block text-2xl font-display font-black text-white italic mb-4">FLEET</h2>
           {SHIPS.map(ship => {
               const active = selectedId === ship.id;
               const locked = maxWave < ship.unlockWave;
               return (
                   <button 
                     key={ship.id}
                     onClick={() => handleSelect(ship.id)}
                     className={`
                        p-3 md:p-4 text-left border-l-4 transition-all duration-300 relative group overflow-hidden shrink-0
                        ${active 
                            ? 'bg-gradient-to-r from-cyan-900/50 to-transparent border-cyan-400' 
                            : 'border-gray-700 hover:bg-white/5'}
                     `}
                   >
                      <div className="relative z-10">
                        <h3 className={`font-display font-bold text-base md:text-lg ${active ? 'text-white' : 'text-gray-400'}`}>{ship.name}</h3>
                        {locked && <div className="text-[10px] text-red-500 flex items-center gap-1 mt-1"><Lock size={8}/> WAVE {ship.unlockWave}</div>}
                      </div>
                   </button>
               )
           })}
           <button onClick={handleBack} className="mt-auto text-gray-500 hover:text-white text-xs md:text-sm py-4 uppercase">{t.back}</button>
        </div>

      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => (
    <div>
        <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400 mb-1 md:mb-2">
            <span>{label}</span>
            <span>{Math.round((value/max)*100)}%</span>
        </div>
        <div className="h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${color} shadow-[0_0_10px_currentColor]`} style={{ width: `${(value/max)*100}%` }}></div>
        </div>
    </div>
);
