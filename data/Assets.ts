
import { ShipConfig, Upgrade, Module } from '../types';

export const SHIPS: ShipConfig[] = [
  { id: 'core', name: 'CORE', color: '#00f0ff', speed: 5, power: 1, health: 3, descriptionKey: 'ships.core.desc', unlockWave: 0, skillId: 'emp', slots: 2, masteryBonusKey: 'ships.core.mastery' },
  { id: 'phantom', name: 'PHANTOM', color: '#a855f7', speed: 7, power: 0.8, health: 2, descriptionKey: 'ships.phantom.desc', unlockWave: 10, skillId: 'phase', slots: 3, masteryBonusKey: 'ships.phantom.mastery' },
  { id: 'striker', name: 'STRIKER', color: '#ef4444', speed: 4, power: 1.5, health: 4, descriptionKey: 'ships.striker.desc', unlockWave: 20, skillId: 'overdrive', slots: 2, masteryBonusKey: 'ships.striker.mastery' }
];

export const UPGRADES: Upgrade[] = [
  { id: 'reinforced_hull', nameKey: 'upgrades.reinforced_hull.name', descriptionKey: 'upgrades.reinforced_hull.desc', cost: 500, icon: 'shield' },
  { id: 'weapon_preheat', nameKey: 'upgrades.weapon_preheat.name', descriptionKey: 'upgrades.weapon_preheat.desc', cost: 1000, icon: 'flame' },
  { id: 'gravity_well', nameKey: 'upgrades.gravity_well.name', descriptionKey: 'upgrades.gravity_well.desc', cost: 300, icon: 'magnet' },
  { id: 'thruster_coolant', nameKey: 'upgrades.thruster_coolant.name', descriptionKey: 'upgrades.thruster_coolant.desc', cost: 400, icon: 'wind' },
  { id: 'data_mining', nameKey: 'upgrades.data_mining.name', descriptionKey: 'upgrades.data_mining.desc', cost: 600, icon: 'database' }
];

export const MODULES: Module[] = [
  { id: 'vampiric_rounds', nameKey: 'modules.vampiric.name', descKey: 'modules.vampiric.desc', cost: 2500, icon: 'drop', type: 'passive' },
  { id: 'berzerk_drive', nameKey: 'modules.berzerk.name', descKey: 'modules.berzerk.desc', cost: 3000, icon: 'skull', type: 'passive' },
  { id: 'auto_magnet', nameKey: 'modules.magnet.name', descKey: 'modules.magnet.desc', cost: 1500, icon: 'magnet', type: 'passive' }
];
