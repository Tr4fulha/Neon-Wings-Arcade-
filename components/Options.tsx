
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Maximize, Minimize, LayoutTemplate, Volume2, Globe, Joystick, Speaker, Activity } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';

type Tab = 'audio' | 'lang' | 'controls';

export const Options: React.FC = () => {
  const { playerData, setLanguage, goToMenu, setScreen, updateAudioSettings } = useGame();
  const t = TRANSLATIONS[playerData.language];
  const [activeTab, setActiveTab] = useState<Tab>('audio');
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [audioSource, setAudioSource] = useState<'synth' | 'pack'>('synth');

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    
    // Checar status do áudio
    setAudioSource(sfx.isPackLoaded() ? 'pack' : 'synth');

    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    sfx.uiClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
          if (screen.orientation && 'lock' in screen.orientation) {
              // @ts-ignore
              screen.orientation.lock('landscape').catch((e) => {
                  console.log("Landscape lock not supported or blocked: ", e);
              });
          }
      }).catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
          if (screen.orientation && 'unlock' in screen.orientation) {
              screen.orientation.unlock();
          }
      });
    }
  };

  const handleAudioChange = (key: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: number) => {
      const newSettings = { ...playerData.audioSettings, [key]: value };
      updateAudioSettings(newSettings);
  };

  return (
     <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-4 md:p-8 relative">
        <div className="absolute inset-0 retro-grid opacity-10 pointer-events-none"></div>
        
        <h2 className="text-3xl md:text-4xl text-neon-cyan font-black italic font-display mb-8 uppercase tracking-widest text-center">{t.opts}</h2>
        
        <div className="flex flex-1 gap-6 md:gap-12 overflow-hidden">
            
            {/* LEFT SIDEBAR: Categories */}
            <div className="w-24 md:w-64 flex flex-col gap-4">
                <NavButton 
                    active={activeTab === 'audio'} 
                    icon={<Volume2 size={24}/>} 
                    label={t.cat_audio} 
                    onClick={() => { sfx.uiClick(); setActiveTab('audio'); }} 
                />
                <NavButton 
                    active={activeTab === 'controls'} 
                    icon={<Joystick size={24}/>} 
                    label={t.cat_ctrl} 
                    onClick={() => { sfx.uiClick(); setActiveTab('controls'); }} 
                />
                <NavButton 
                    active={activeTab === 'lang'} 
                    icon={<Globe size={24}/>} 
                    label={t.cat_lang} 
                    onClick={() => { sfx.uiClick(); setActiveTab('lang'); }} 
                />

                <button 
                    onClick={() => { sfx.uiClick(); goToMenu(); }} 
                    className="mt-auto text-white font-black font-display text-sm md:text-xl uppercase tracking-tighter hover:text-cyan-400 transition-colors py-4"
                >
                    {t.back}
                </button>
            </div>

            {/* RIGHT PANEL: Content */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-sm p-4 md:p-10 relative overflow-y-auto custom-scrollbar">
                
                {activeTab === 'audio' && (
                    <div className="space-y-8 animate-fade-in">
                        
                        {/* Audio Source Status */}
                        <div className="flex items-center justify-between bg-black/40 border border-white/10 p-4 rounded">
                            <div className="flex items-center gap-3">
                                {audioSource === 'pack' ? <Speaker className="text-green-400"/> : <Activity className="text-yellow-400"/>}
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">AUDIO DRIVER</p>
                                    <p className={`font-display font-bold ${audioSource === 'pack' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {audioSource === 'pack' ? 'ASSET PACK (HQ)' : 'SYNTHESIZER (FALLBACK)'}
                                    </p>
                                </div>
                            </div>
                            {audioSource === 'synth' && (
                                <p className="text-[9px] text-gray-600 w-32 text-right leading-tight">
                                    Files not found in /public/sounds. Using procedural audio.
                                </p>
                            )}
                        </div>

                        <VolumeSlider label={t.vol_master} value={playerData.audioSettings.masterVolume} onChange={(val) => handleAudioChange('masterVolume', val)} />
                        <VolumeSlider label={t.vol_music} value={playerData.audioSettings.musicVolume} onChange={(val) => handleAudioChange('musicVolume', val)} />
                        <VolumeSlider label={t.vol_sfx} value={playerData.audioSettings.sfxVolume} onChange={(val) => handleAudioChange('sfxVolume', val)} />
                    </div>
                )}

                {activeTab === 'lang' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        {(['pt', 'en', 'es'] as Language[]).map(lang => (
                            <button 
                                key={lang}
                                onClick={() => { sfx.uiClick(); setLanguage(lang); }}
                                className={`p-6 border transition-all text-left flex justify-between items-center group ${playerData.language === lang ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-black/80 border-white/10 text-gray-500 hover:border-gray-500'}`}
                            >
                                <span className="font-display font-black text-xl italic tracking-tighter">{lang.toUpperCase()}</span>
                                {playerData.language === lang && <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f3ff]"></div>}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'controls' && (
                    <div className="space-y-8 animate-fade-in">
                        <section className="space-y-4">
                            <label className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{t.hud_editor}</label>
                            <button 
                                onClick={() => { sfx.uiClick(); setScreen('hud-editor'); }}
                                className="w-full p-6 flex items-center justify-between border-2 border-cyan-900/30 bg-cyan-950/20 hover:bg-cyan-900/40 transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <LayoutTemplate className="text-cyan-400 group-hover:scale-110 transition-transform" size={28}/>
                                    <span className="font-display font-black text-xl md:text-2xl text-cyan-400 italic tracking-tighter uppercase">{t.configure_hud}</span>
                                </div>
                                <span className="text-xs font-bold text-cyan-700">EDITOR</span>
                            </button>
                        </section>

                        <section className="space-y-4">
                            <label className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{t.fullscreen}</label>
                            <button 
                                onClick={toggleFullscreen}
                                className={`w-full p-6 flex items-center justify-between border-2 transition-all group ${isFullscreen ? 'border-pink-900/30 bg-pink-950/20 text-pink-500' : 'border-blue-900/30 bg-blue-950/20 text-blue-500'}`}
                            >
                                <div className="flex items-center gap-6">
                                    {isFullscreen ? <Minimize size={28}/> : <Maximize size={28}/>}
                                    <span className="font-display font-black text-xl md:text-2xl italic tracking-tighter uppercase">{t.fullscreen}</span>
                                </div>
                                <span className="text-xs font-bold opacity-60 uppercase">{isFullscreen ? 'ON' : 'OFF'}</span>
                            </button>
                            <p className="text-[10px] text-gray-500 italic">
                                * On mobile, fullscreen automatically attempts to lock orientation to landscape.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </div>
     </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full h-20 md:h-24 flex flex-col items-center justify-center gap-2 border-t-4 transition-all relative overflow-hidden group
            ${active ? 'bg-[#0a0610] border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-black/60 border-transparent text-gray-600 hover:text-gray-400'}
        `}
    >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest hidden md:block">{label}</span>
        {active && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>}
    </button>
);

const VolumeSlider = ({ label, value, onChange }: any) => (
    <div className="space-y-4">
        <div className="flex justify-between items-end">
            <label className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{label}</label>
            <span className="text-white font-display font-bold text-xl">{Math.round(value * 100)}%</span>
        </div>
        <div className="relative flex items-center h-8">
            <div className="absolute inset-0 bg-gray-900/50 rounded-full h-2 my-auto"></div>
            <div className="absolute left-0 h-2 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full my-auto" style={{ width: `${value * 100}%` }}></div>
            <input 
                type="range" min="0" max="1" step="0.05"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            {/* Custom thumb visual */}
            <div 
                className="absolute w-6 h-6 bg-white rounded-sm shadow-[0_0_15px_white] pointer-events-none -translate-x-1/2"
                style={{ left: `${value * 100}%` }}
            ></div>
        </div>
    </div>
);
