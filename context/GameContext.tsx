
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Screen, PlayerData, ShipConfig, Upgrade, GameResult, Language, HUDSettings, AudioSettings, Module, GameMode } from '../types';
import { SHIPS, APP_VERSION } from '../constants';
import { getPlayerData, savePlayerData, submitDailyScore } from '../supabaseService';
import { sfx, music } from '../audioService';
import { cyrb128 } from '../utils/rng';

interface GameContextType {
  playerData: PlayerData;
  isOnline: boolean;
  loading: boolean;
  screen: Screen;
  selectedShip: ShipConfig;
  lastGameResult: GameResult | null;
  gameMode: GameMode;
  dailyConfig: { ship: ShipConfig, seed: number };
  
  // Ações
  setScreen: (screen: Screen) => void;
  updateName: (name: string) => void;
  setLanguage: (lang: Language) => void;
  buyUpgrade: (upgrade: Upgrade) => void;
  buyModule: (module: Module) => void;
  equipModule: (shipId: string, moduleId: string, slotIndex: number) => void;
  unequipModule: (shipId: string, slotIndex: number) => void;
  updateHudSettings: (settings: HUDSettings) => void;
  updateAudioSettings: (settings: AudioSettings) => void;
  handleGameOver: (result: GameResult) => void;
  launchGame: (ship: ShipConfig) => void;
  startDailyChallenge: () => void;
  checkChangelog: () => void;
  markVersionAsSeen: () => void;
  retryGame: () => void;
  goToMenu: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<Screen>('splash');
  const [playerData, setPlayerData] = useState<PlayerData>({ 
    username: 'ROOKIE', 
    scrap: 0, 
    darkMatter: 0,
    highScore: 0, 
    inventory: [],
    level: 1,
    currentXp: 0,
    maxWave: 0,
    language: 'pt',
    lastSeenVersion: '0.0.0',
    hudSettings: {
        opacity: 0.7,
        scale: 1.0,
        leftHanded: false,
        joystickPos: { x: 15, y: 75 },
        skillBtnPos: { x: 85, y: 75 }
    },
    audioSettings: {
        masterVolume: 0.5,
        musicVolume: 0.5,
        sfxVolume: 0.5
    },
    modules: { inventory: [], equipped: {} },
    shipMastery: {}
  });
  const [selectedShip, setSelectedShip] = useState<ShipConfig>(SHIPS[0]);
  const [lastGameResult, setLastGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('normal');

  // Gerar Configuração do Dia
  const todayStr = new Date().toISOString().slice(0, 10); // "2023-10-27"
  const dailySeed = cyrb128(todayStr);
  const dailyShipIndex = dailySeed % SHIPS.length;
  const dailyConfig = {
      ship: SHIPS[dailyShipIndex],
      seed: dailySeed
  };

  // Carregamento Inicial
  useEffect(() => {
    const init = async () => {
      const { data, isOnline } = await getPlayerData();
      setPlayerData(data);
      setIsOnline(isOnline);
      setLoading(false);
      
      // Aplicar configurações de áudio carregadas
      sfx.init();
      sfx.setMasterVolume(data.audioSettings.masterVolume);
      music.setVolume(data.audioSettings.musicVolume);
      sfx.setVolume(data.audioSettings.sfxVolume);
      
      // Tenta carregar arquivos de áudio externos
      sfx.loadAllSounds();
    };
    init();
  }, []);

  // Handlers
  const updateName = (newName: string) => {
    const newData = { ...playerData, username: newName };
    setPlayerData(newData);
    savePlayerData(newData);
  };

  const setLanguage = (l: Language) => {
    const newData = { ...playerData, language: l };
    setPlayerData(newData);
    savePlayerData(newData);
  };

  const updateHudSettings = (settings: HUDSettings) => {
      const newData = { ...playerData, hudSettings: settings };
      setPlayerData(newData);
      savePlayerData(newData);
  };

  const updateAudioSettings = (settings: AudioSettings) => {
      const newData = { ...playerData, audioSettings: settings };
      setPlayerData(newData);
      savePlayerData(newData);
      
      sfx.setMasterVolume(settings.masterVolume);
      music.setVolume(settings.musicVolume);
      sfx.setVolume(settings.sfxVolume);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (playerData.scrap >= upgrade.cost && !playerData.inventory.includes(upgrade.id)) {
      const newData = {
        ...playerData,
        scrap: playerData.scrap - upgrade.cost,
        inventory: [...playerData.inventory, upgrade.id]
      };
      setPlayerData(newData);
      savePlayerData(newData);
    }
  };

  const buyModule = (module: Module) => {
      if (playerData.scrap >= module.cost && !playerData.modules.inventory.includes(module.id)) {
          const newData = {
              ...playerData,
              scrap: playerData.scrap - module.cost,
              modules: {
                  ...playerData.modules,
                  inventory: [...playerData.modules.inventory, module.id]
              }
          };
          setPlayerData(newData);
          savePlayerData(newData);
      }
  };

  const equipModule = (shipId: string, moduleId: string, slotIndex: number) => {
      const currentEquipped = playerData.modules.equipped[shipId] || [];
      const newEquipped = [...currentEquipped];
      // Garantir tamanho do array
      while (newEquipped.length <= slotIndex) newEquipped.push('');
      
      // Se módulo já está equipado em outro slot dessa nave, remove
      const existingIndex = newEquipped.indexOf(moduleId);
      if (existingIndex !== -1) newEquipped[existingIndex] = '';

      newEquipped[slotIndex] = moduleId;

      const newData = {
          ...playerData,
          modules: {
              ...playerData.modules,
              equipped: {
                  ...playerData.modules.equipped,
                  [shipId]: newEquipped
              }
          }
      };
      setPlayerData(newData);
      savePlayerData(newData);
  };

  const unequipModule = (shipId: string, slotIndex: number) => {
      const currentEquipped = playerData.modules.equipped[shipId] || [];
      const newEquipped = [...currentEquipped];
      if (newEquipped[slotIndex]) {
          newEquipped[slotIndex] = '';
          const newData = {
              ...playerData,
              modules: {
                  ...playerData.modules,
                  equipped: {
                      ...playerData.modules.equipped,
                      [shipId]: newEquipped
                  }
              }
          };
          setPlayerData(newData);
          savePlayerData(newData);
      }
  };

  const handleGameOver = (result: GameResult) => {
    setLastGameResult(result);
    
    // XP do Piloto (Ganha em ambos os modos)
    let newLevel = playerData.level;
    let newXp = playerData.currentXp + result.xpGained;
    let xpToNext = newLevel * 100;
    while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel++;
        xpToNext = newLevel * 100;
        sfx.collect();
    }

    // XP da Nave (Maestria)
    const shipId = result.shipId;
    const currentMastery = playerData.shipMastery[shipId] || { xp: 0, level: 1 };
    let shipXp = currentMastery.xp + result.xpGained;
    let shipLvl = currentMastery.level;
    let shipXpToNext = shipLvl * 500; 

    while (shipXp >= shipXpToNext && shipLvl < 5) {
        shipXp -= shipXpToNext;
        shipLvl++;
        shipXpToNext = shipLvl * 500;
    }
    if (shipLvl >= 5) shipXp = Math.min(shipXp, shipXpToNext);

    // Save Data
    const newData = {
      ...playerData,
      scrap: playerData.scrap + result.scrapCollected,
      // High Score Global só atualiza no modo normal
      highScore: result.mode === 'normal' ? Math.max(playerData.highScore, result.score) : playerData.highScore,
      level: newLevel,
      currentXp: newXp,
      maxWave: Math.max(playerData.maxWave, result.survivedWaves),
      shipMastery: {
          ...playerData.shipMastery,
          [shipId]: { xp: shipXp, level: shipLvl }
      }
    };
    setPlayerData(newData);
    savePlayerData(newData);

    // Envio de Score Diário
    if (result.mode === 'daily_challenge' && isOnline) {
        submitDailyScore(result.score, result.survivedWaves, shipId);
    }

    setScreen('game-over');
  };

  const launchGame = (ship: ShipConfig) => {
    setSelectedShip(ship);
    setGameMode('normal');
    setScreen('game');
  };

  const startDailyChallenge = () => {
      setSelectedShip(dailyConfig.ship);
      setGameMode('daily_challenge');
      setScreen('game');
  };

  const checkChangelog = () => {
    if (playerData.lastSeenVersion !== APP_VERSION) {
      setScreen('changelog');
    } else {
      setScreen('menu');
    }
  };

  const markVersionAsSeen = () => {
    const newData = { ...playerData, lastSeenVersion: APP_VERSION };
    setPlayerData(newData);
    savePlayerData(newData);
    setScreen('menu');
  };

  const retryGame = () => {
      if (gameMode === 'daily_challenge') {
          // No diário, retenta imediatamente com a mesma config
          setScreen('game');
      } else {
          setScreen('ship-select');
      }
  }
  
  const goToMenu = () => setScreen('menu');

  return (
    <GameContext.Provider value={{
      playerData, isOnline, loading, screen, selectedShip, lastGameResult, gameMode, dailyConfig,
      setScreen, updateName, setLanguage, updateHudSettings, updateAudioSettings, 
      buyUpgrade, buyModule, equipModule, unequipModule, handleGameOver, launchGame, startDailyChallenge,
      checkChangelog, markVersionAsSeen, retryGame, goToMenu
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
