
import React, { useState } from 'react';
import { UPGRADES, MODULES, TRANSLATIONS, APP_VERSION } from '../constants';
import { ArrowLeft, Zap, Shield, Wind, Magnet, Database, Cpu, Droplets, Skull, Box, Layers, Network, Clock, Info, X, Check } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';

type ShopCategory = 'equipment' | 'cards' | 'tech_tree' | 'soon';

export const Shop: React.FC = () => {
  const { playerData, buyUpgrade, buyModule, goToMenu } = useGame();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('equipment');
  
  // Estado para o Modal de Detalhes
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<'upgrade' | 'module' | null>(null);

  const t = TRANSLATIONS[playerData.language];
  const getT = (key: string) => key.split('.').reduce((obj, i) => obj?.[i], t) || key;
  
  const getIcon = (icon: string, size: number = 24) => {
      switch(icon) {
          case 'shield': return <Shield className="text-cyan-400" size={size}/>;
          case 'flame': return <Zap className="text-yellow-400" size={size}/>;
          case 'magnet': return <Magnet className="text-purple-400" size={size}/>;
          case 'wind': return <Wind className="text-blue-400" size={size}/>;
          case 'database': return <Database className="text-green-400" size={size}/>;
          case 'drop': return <Droplets className="text-red-400" size={size}/>;
          case 'skull': return <Skull className="text-gray-200" size={size}/>;
          default: return <Cpu className="text-white" size={size}/>;
      }
  }

  const handleBack = () => { sfx.uiClick(); goToMenu(); }

  const handleOpenDetails = (item: any, type: 'upgrade' | 'module') => {
      sfx.uiClick();
      setSelectedItem(item);
      setSelectedType(type);
  }

  const handleCloseDetails = () => {
      sfx.uiClick();
      setSelectedItem(null);
      setSelectedType(null);
  }

  const handleBuyFromModal = () => {
      if (!selectedItem) return;
      sfx.uiClick();
      if (selectedType === 'upgrade') buyUpgrade(selectedItem);
      else if (selectedType === 'module') buyModule(selectedItem);
  }

  return (
    <div className="w-full h-full bg-[#050014] flex items-center justify-center relative overflow-hidden">
      {/* Background Cyberpunk Grid */}
      <div className="absolute inset-0 retro-grid opacity-15 pointer-events-none"></div>
      
      {/* --- MODAL DE DETALHES --- */}
      {selectedItem && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-lg bg-[#0a0610] border border-cyan-500/50 rounded-xl relative shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
                  
                  {/* Modal Header Decoration */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                  
                  <button onClick={handleCloseDetails} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20">
                      <X size={24} />
                  </button>

                  <div className="p-8 flex flex-col items-center text-center">
                      {/* Ícone Grande */}
                      <div className="w-24 h-24 rounded-full bg-cyan-900/20 border-2 border-cyan-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                          {getIcon(selectedItem.icon, 48)}
                      </div>

                      {/* Nome e Tipo */}
                      <h2 className="text-2xl md:text-3xl font-display font-black text-white italic uppercase mb-2 tracking-wide">
                          {getT(selectedItem.nameKey)}
                      </h2>
                      <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-widest mb-6 border border-gray-700">
                          {selectedType === 'upgrade' ? t.shop_cats.equipment : t.shop_cats.cards}
                      </span>

                      {/* Descrição Detalhada */}
                      <div className="bg-white/5 p-4 rounded-lg w-full mb-8 border border-white/5 text-left">
                          <p className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                              <Info size={12}/> {t.item_details}
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                              {getT(selectedItem.descriptionKey || selectedItem.descKey)}
                          </p>
                      </div>

                      {/* Botão de Compra / Status */}
                      {((selectedType === 'upgrade' && playerData.inventory.includes(selectedItem.id)) || 
                        (selectedType === 'module' && playerData.modules.inventory.includes(selectedItem.id))) ? (
                          <div className="w-full py-4 bg-gray-800 border border-gray-700 text-green-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded">
                              <Check size={20} /> {t.owned}
                          </div>
                      ) : (
                          <button 
                            onClick={handleBuyFromModal}
                            disabled={playerData.scrap < selectedItem.cost}
                            className={`
                                w-full py-4 font-bold tracking-[0.2em] text-sm uppercase transition-all relative overflow-hidden group rounded
                                ${playerData.scrap >= selectedItem.cost 
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-lg' 
                                    : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'}
                            `}
                          >
                              <div className="flex flex-col items-center">
                                  <span>{t.buy}</span>
                                  <span className="text-[10px] font-mono opacity-80">{t.cost}: {selectedItem.cost}</span>
                              </div>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="w-full h-full flex flex-col md:flex-row relative z-10">
        
        {/* SIDEBAR NAVIGATION (Esquerda) */}
        <div className="w-full md:w-64 bg-[#0a0610]/95 border-r border-white/5 flex flex-col shrink-0 h-auto md:h-full relative shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
            
            {/* Header da Sidebar */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-950/20 to-transparent">
                <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-display tracking-wide uppercase">
                    {t.shop}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-pink-500 font-bold tracking-widest">CREDITS</span>
                    <span className="text-xl font-mono text-white text-shadow-glow">{playerData.scrap.toLocaleString()}</span>
                </div>
            </div>

            {/* Lista de Categorias */}
            <div className="flex-1 overflow-y-auto flex flex-row md:flex-col p-2 gap-2">
                <SidebarItem 
                    active={activeCategory === 'equipment'} 
                    label={t.shop_cats.equipment} 
                    icon={<Box size={20}/>} 
                    onClick={() => { sfx.uiClick(); setActiveCategory('equipment'); }} 
                />
                <SidebarItem 
                    active={activeCategory === 'cards'} 
                    label={t.shop_cats.cards} 
                    icon={<Layers size={20}/>} 
                    onClick={() => { sfx.uiClick(); setActiveCategory('cards'); }} 
                />
                <SidebarItem 
                    active={activeCategory === 'tech_tree'} 
                    label={t.shop_cats.tech_tree} 
                    icon={<Network size={20}/>} 
                    onClick={() => { sfx.uiClick(); setActiveCategory('tech_tree'); }} 
                />
                <SidebarItem 
                    active={activeCategory === 'soon'} 
                    label={t.shop_cats.soon} 
                    icon={<Clock size={20}/>} 
                    onClick={() => { sfx.uiClick(); setActiveCategory('soon'); }} 
                />
            </div>

            {/* Botão Voltar (Fim da Sidebar) */}
            <div className="p-4 mt-auto border-t border-white/5">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group w-full p-2">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="font-bold tracking-widest text-xs uppercase">{t.back}</span>
                </button>
            </div>
        </div>

        {/* CONTENT AREA (Direita) */}
        <div className="flex-1 bg-black/20 relative overflow-hidden flex flex-col">
            
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                
                {/* CATEGORY: EQUIPMENT */}
                {activeCategory === 'equipment' && (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {UPGRADES.map(upgrade => (
                            <ShopItem 
                                key={upgrade.id} 
                                item={upgrade}
                                isOwned={playerData.inventory.includes(upgrade.id)}
                                canAfford={playerData.scrap >= upgrade.cost}
                                onBuy={() => { sfx.uiClick(); buyUpgrade(upgrade); }}
                                onClick={() => handleOpenDetails(upgrade, 'upgrade')}
                                getIcon={getIcon} getT={getT} t={t}
                                type="upgrade"
                            />
                        ))}
                    </div>
                )}

                {/* CATEGORY: CARDS (MODULES) */}
                {activeCategory === 'cards' && (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MODULES.map(module => (
                            <ShopItem 
                                key={module.id} 
                                item={module}
                                isOwned={playerData.modules.inventory.includes(module.id)}
                                canAfford={playerData.scrap >= module.cost}
                                onBuy={() => { sfx.uiClick(); buyModule(module); }}
                                onClick={() => handleOpenDetails(module, 'module')}
                                getIcon={getIcon} getT={getT} t={t}
                                type="module"
                            />
                        ))}
                    </div>
                )}

                {/* CATEGORY: TECH TREE (Placeholder Visual) */}
                {activeCategory === 'tech_tree' && (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in text-center p-8 border border-dashed border-gray-800 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #00f3ff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        
                        {/* Mock Nodes */}
                        <div className="relative z-10 flex flex-col items-center gap-8 opacity-50 grayscale pointer-events-none">
                            <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-cyan-900/20 flex items-center justify-center"><Zap /></div>
                            <div className="w-1 h-12 bg-gray-700"></div>
                            <div className="flex gap-12">
                                <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-black flex items-center justify-center"><Shield size={16}/></div>
                                <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-black flex items-center justify-center"><Wind size={16}/></div>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black italic text-gray-500 mt-8 uppercase">{t.tech_tree_locked}</h3>
                        <p className="text-xs text-gray-600 mt-2 tracking-widest">COMING IN v2.0</p>
                    </div>
                )}

                {/* CATEGORY: COMING SOON */}
                {activeCategory === 'soon' && (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in text-gray-600">
                        <Clock size={64} className="mb-4 opacity-50 animate-pulse"/>
                        <h3 className="text-xl font-bold tracking-widest uppercase">EXPANSION PACK</h3>
                        <p className="text-xs mt-2">SKINS & PETS SYSTEM LOADING...</p>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

// Componente do Botão da Sidebar
const SidebarItem = ({ active, label, icon, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`
            flex-1 md:flex-none w-full p-4 flex items-center gap-4 transition-all duration-300 relative overflow-hidden group
            ${active 
                ? 'bg-gradient-to-r from-cyan-900/40 to-transparent border-l-4 border-cyan-400 text-white' 
                : 'text-gray-500 hover:bg-white/5 hover:text-gray-300 border-l-4 border-transparent'}
        `}
    >
        <div className={`transition-transform duration-300 ${active ? 'scale-110 text-cyan-400' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest truncate transition-all ${active ? 'translate-x-1' : ''}`}>
            {label}
        </span>
        
        {/* Active Glow Effect */}
        {active && <div className="absolute inset-0 bg-cyan-400/5 pointer-events-none"></div>}
    </button>
);

// Componente do Card de Item
const ShopItem = ({ item, isOwned, canAfford, onBuy, onClick, getIcon, getT, t, type }: any) => (
    <div 
        onClick={onClick}
        className={`
            relative p-6 border rounded-xl transition-all duration-300 group flex flex-col justify-between overflow-hidden cursor-pointer
            ${isOwned 
                ? 'bg-[#0f0b1a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                : 'bg-[#0a0610] border-white/5 hover:border-cyan-500/50 hover:bg-[#0f0b1a] hover:scale-[1.02]'}
        `}
    >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`
                w-12 h-12 rounded-lg border flex items-center justify-center transition-colors 
                ${isOwned ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-gray-700 bg-black/40 text-gray-500'}
                ${type === 'module' && !isOwned ? 'rounded-sm' : ''} 
            `}>
                {getIcon(item.icon)}
            </div>
            
            <div className="flex gap-2">
                {!isOwned && <Info size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />}
                {isOwned && (
                    <span className="text-[9px] font-black bg-cyan-500 text-black px-2 py-0.5 rounded shadow-[0_0_10px_cyan]">
                        {t.installed}
                    </span>
                )}
            </div>
        </div>

        {/* Card Info */}
        <div className="mb-6 relative z-10">
            <h3 className={`font-display font-bold text-lg mb-1 uppercase truncate ${isOwned ? 'text-cyan-400' : 'text-white'}`}>
                {getT(item.nameKey)}
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                {getT(item.descriptionKey || item.descKey)}
            </p>
        </div>
        
        {/* Action Button (Propagate click stopped to prevent modal when clicking buy directly) */}
        {!isOwned && (
            <button 
                onClick={(e) => { e.stopPropagation(); onBuy(); }}
                disabled={!canAfford}
                className={`
                w-full py-3 font-bold tracking-[0.2em] text-xs uppercase transition-all relative z-10
                ${canAfford 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:brightness-110 shadow-lg' 
                    : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'}
                `}
            >
                {t.buy} <span className="font-mono">{item.cost}</span>
            </button>
        )}

        {/* Decorative Background for Modules */}
        {type === 'module' && (
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>
        )}
    </div>
);
