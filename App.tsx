
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MainMenu } from './components/MainMenu';
import { Shop } from './components/Shop';
import { ShipSelector } from './components/ShipSelector';
import { GameEngine } from './components/GameEngine';
import { GameOver } from './components/GameOver';
import { Leaderboard } from './components/Leaderboard';
import { Options } from './components/Options';
import { Splash } from './components/Splash';
import { Changelog } from './components/Changelog';
import { HUDEditor } from './components/HUDEditor';

const GameLayout = () => {
  const { screen, loading } = useGame();

  if (loading) return (
    <div className="w-full h-screen bg-black flex items-center justify-center text-neon-cyan font-display animate-pulse uppercase tracking-[0.5em]">
      Syncing...
    </div>
  );

  switch(screen) {
      case 'splash': return <Splash />;
      case 'changelog': return <Changelog />;
      case 'menu': return <MainMenu />;
      case 'shop': return <Shop />;
      case 'ship-select': return <ShipSelector />;
      case 'leaderboard': return <Leaderboard />;
      case 'game': return <GameEngine />;
      case 'game-over': return <GameOver />;
      case 'options': return <Options />;
      case 'hud-editor': return <HUDEditor />;
      case 'credits': return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-12">
             <h2 className="text-4xl text-neon-cyan font-black italic font-display">CREDITS</h2>
             <div><h3 className="text-white font-bold text-xl mb-1 uppercase tracking-widest">TR4FULHA</h3><p className="text-gray-500 text-sm">Design & Core Engineering</p></div>
             <div><h3 className="text-white font-bold text-xl mb-1 uppercase tracking-widest">SYNTH WAVE ENGINE</h3><p className="text-gray-500 text-sm">Dynamic Audio Processing</p></div>
             <BackButton />
          </div>
        );
      default: return <MainMenu />;
  }
};

const BackButton = () => {
    const { goToMenu } = useGame();
    return (
        <button onClick={goToMenu} className="text-gray-500 hover:text-white font-bold text-sm mt-8 uppercase tracking-widest">BACK</button>
    );
}

export default function App() {
  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans select-none">
      <GameProvider>
        <GameLayout />
      </GameProvider>
    </div>
  );
}
