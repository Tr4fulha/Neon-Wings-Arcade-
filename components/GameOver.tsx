
import React from 'react';
import { useGame } from '../context/GameContext';
import { sfx } from '../audioService';

export const GameOver: React.FC = () => {
  const { lastGameResult, retryGame, goToMenu } = useGame();

  if (!lastGameResult) return null;

  const handleRetry = () => {
      sfx.uiClick();
      retryGame();
  }

  const handleMenu = () => {
      sfx.uiClick();
      goToMenu();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-red-950/20 animate-pulse-slow">
      <h1 className="text-6xl md:text-8xl font-black italic font-display text-white mb-8 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
        FALHA NA MISSÃO
      </h1>
      
      <div className="space-y-2 text-center mb-12">
        <h2 className="text-2xl text-neon-cyan font-bold">PONTOS: {lastGameResult.score}</h2>
        <h3 className="text-xl text-neon-yellow font-bold">SUCATA COLLECTED: {lastGameResult.scrapCollected}</h3>
        <p className="text-gray-500 text-sm">WAVES SURVIVED: {lastGameResult.survivedWaves}</p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={handleRetry}
          className="w-full py-4 bg-white text-black font-black font-display uppercase hover:scale-105 transition-transform"
        >
          TENTAR NOVAMENTE
        </button>
        <button 
          onClick={handleMenu}
          className="text-gray-500 hover:text-white py-2 text-sm"
        >
          MENU
        </button>
      </div>
    </div>
  );
};
