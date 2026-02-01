
import { GameState, PlayerState, ShipConfig, GameMode, InputState, PowerUpType, Enemy, GameResult, GameUiData, Bullet, FloatingText, Language, Particle, Scrap, PowerUp, BossType, BossState } from '../types';
import { SeededRNG } from '../utils/rng';
import { sfx, music } from '../audioService';
import { InputHandler } from './InputHandler';
import { EventBus } from './EventBus';
import { ObjectPool } from './ObjectPool';

import { drawGrid, drawStars } from '../renderer/CanvasRenderer';
import { drawPlayer } from '../renderer/PlayerRenderer';
import { drawEnemy, drawBoss } from '../renderer/EnemyRenderer';
import { drawBullet, drawEnemyBullet, drawScrap, drawPowerUp, drawParticles, drawFloatingTexts } from '../renderer/ObjectRenderer';

import { updatePlayerMovement, updateEntities, updateScraps, updateBoss } from './systems/Physics';
import { checkCollisions } from './systems/Collision';
import { resetEnemy } from './systems/Spawner';
import { TRANSLATIONS } from '../constants';

interface GameConfig {
    canvas: HTMLCanvasElement;
    ship: ShipConfig;
    mode: GameMode;
    dailySeed?: number;
    inventory: string[];
    equippedModules: string[];
    language: Language;
}

export class GameController {
    public events = new EventBus();

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    private width: number;
    private height: number;
    private scale: number = 1;

    private config: GameConfig;
    private rng: SeededRNG | null;

    private gameState: GameState;
    private player: PlayerState;
    
    // Inputs
    public input: InputHandler;
    private fireCooldown: number = 0;

    // Loop Control
    private animationId: number = 0;
    private lastTime: number = 0;
    private isPaused: boolean = false;
    private isRunning: boolean = false;
    private isDead: boolean = false;
    
    private isSpawning: boolean = true;
    private initialSpawnTimer: any = null;
    private hearts: number = 3;

    // --- OBJECT POOLS ---
    private bulletPool: ObjectPool<Bullet>;
    private enemyBulletPool: ObjectPool<Bullet>;
    private enemyPool: ObjectPool<Enemy>;
    private particlePool: ObjectPool<Particle>;
    private floatingTextPool: ObjectPool<FloatingText>;
    private scrapPool: ObjectPool<Scrap>;
    private powerupPool: ObjectPool<PowerUp>;

    constructor(config: GameConfig) {
        this.config = config;
        this.canvas = config.canvas;
        this.ctx = config.canvas.getContext('2d', { alpha: false })!;
        this.width = config.canvas.width;
        this.height = config.canvas.height;
        
        this.rng = config.mode === 'daily_challenge' && config.dailySeed 
            ? new SeededRNG(config.dailySeed) 
            : null;

        this.input = new InputHandler();

        // Initialize Pools
        this.bulletPool = new ObjectPool<Bullet>(() => ({ active: false, x:0, y:0, w:0, h:0, vy:0, color:'', damage: 1 }), 50);
        this.enemyBulletPool = new ObjectPool<Bullet>(() => ({ active: false, x:0, y:0, w:0, h:0, vy:0, color:'', damage: 1 }), 100);
        this.enemyPool = new ObjectPool<Enemy>(() => ({ active: false, x:0, y:0, vx:0, vy:0, width:0, height:0, hp:0, type:'scout', color:'', shootTimer:0, pattern:'', baseX:0, isEntering:false, targetY:0, hitFlash:0 }), 30);
        this.particlePool = new ObjectPool<Particle>(() => ({ active: false, x:0, y:0, vx:0, vy:0, life:0, maxLife:0, color:'', size:0 }), 100);
        this.floatingTextPool = new ObjectPool<FloatingText>(() => ({ active: false, x:0, y:0, text:'', life:0, maxLife:0, color:'', size:0, vy:0 }), 20);
        this.scrapPool = new ObjectPool<Scrap>(() => ({ active: false, x:0, y:0, value:0, vx:0, vy:0, size:0 }), 50);
        this.powerupPool = new ObjectPool<PowerUp>(() => ({ active: false, x:0, y:0, type:'health', color:'', size:0, vx:0, vy:0 }), 5);

        // Init States
        this.player = this.createInitialPlayer();
        this.gameState = this.createInitialGameState();

        this.initEnvironment();
    }

    private createInitialPlayer(): PlayerState {
        return {
            x: 0, y: 2000, vx: 0, vy: 0, width: 44, height: 44, 
            invulnerable: 5.0, lean: 0, hitFlash: 0, 
            energy: 0, maxEnergy: 100,
            status: { frozen: 0, burn: 0, burnTick: 0 },
            killCount: 0,
            timers: { rapid_fire: 0, triple_shot: 0, shield: 0, laser: 0, missile: 0, skill_active: 0, damage: 0 }
        };
    }

    private createInitialGameState(): GameState {
        return {
            bullets: [], enemyBullets: [], enemies: [], scraps: [], powerups: [],
            particles: [], floatingTexts: [], stars: [],
            waveEnemiesToSpawn: 12, waveStatus: 'announcing',
            announcementTimer: 2.0,
            enemySpawnTimer: 0, gameScore: 0, scrapCollected: 0, waveCount: 1,
            currentCombo: 1, comboTimer: 0, shake: 0,
            boss: { 
                active: false, type: 'observer', hp: 0, maxHp: 0, x: 0, y: -300, targetY: 120, width: 180, height: 140, 
                entering: false, phase: 0, shootTimer: 0, moveDir: 1, hitFlash: 0, chargeFlash: 0 
            },
            currentSector: 'void',
            solarFlareTimer: 0, isSolarFlaring: false
        };
    }

    private initEnvironment() {
        this.player.y = this.height + 500;
        this.player.x = this.width / 2 - this.player.width / 2;
        this.initHearts();

        for(let i=0; i<85; i++) {
            this.gameState.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: 40 + Math.random() * 220,
                size: 1 + Math.random() * 2.5,
                opacity: 0.15 + Math.random() * 0.85
            });
        }
    }

    private initHearts() {
        this.hearts = this.config.ship.health + (this.config.inventory.includes('reinforced_hull') ? 1 : 0);
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.input.bind();
        
        music.playGame();
        
        this.isSpawning = true;
        this.initialSpawnTimer = setTimeout(() => {
            this.isSpawning = false;
        }, 2500);

        this.loop(this.lastTime);
    }

    public stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
        music.stop();
        this.input.unbind();
        this.events.clear();
        if (this.initialSpawnTimer) clearTimeout(this.initialSpawnTimer);
    }

    public pause() {
        this.isPaused = true;
        music.stop();
    }

    public resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        music.playGame(); 
        this.loop(this.lastTime);
    }

    public resize(width: number, height: number, scale: number) {
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    public useSkill() {
        if (this.isDead || this.isSpawning) return;
        if (this.player.energy >= 100) {
            this.player.energy = 0;
            sfx.ultimateUse();
            this.gameState.shake = 25;
            this.player.timers.skill_active = 5.0;
            this.notifyUi();
        }
    }

    public setJoystick(x: number, y: number) {
        this.input.setJoystick(x, y);
    }

    public setFiring(firing: boolean) {
        this.input.setFiring(firing);
    }

    public triggerPlayerHit(dmg: number) {
        this.handlePlayerHit(dmg);
    }

    private cleanupPools() {
        this.cleanupList(this.gameState.bullets, this.bulletPool);
        this.cleanupList(this.gameState.enemyBullets, this.enemyBulletPool);
        this.cleanupList(this.gameState.enemies, this.enemyPool);
        this.cleanupList(this.gameState.particles, this.particlePool);
        this.cleanupList(this.gameState.floatingTexts, this.floatingTextPool);
        this.cleanupList(this.gameState.scraps, this.scrapPool);
        this.cleanupList(this.gameState.powerups, this.powerupPool);
    }

    private cleanupList<T extends { active: boolean }>(list: T[], pool: ObjectPool<T>) {
        let i = 0;
        while (i < list.length) {
            if (!list[i].active) {
                pool.release(list[i]);
                list[i] = list[list.length - 1];
                list.pop();
            } else {
                i++;
            }
        }
    }

    private loop = (timestamp: number) => {
        if (!this.isRunning) return;
        if (this.isPaused) {
            this.lastTime = timestamp; 
            this.draw(timestamp);
            this.animationId = requestAnimationFrame(this.loop);
            return;
        }

        let dt = (timestamp - this.lastTime) / 1000;
        if (dt > 0.05) dt = 0.05; 
        this.lastTime = timestamp;

        this.update(dt, timestamp);
        this.cleanupPools();
        this.draw(timestamp);

        this.animationId = requestAnimationFrame(this.loop);
    }

    private random() {
        return this.rng ? this.rng.next() : Math.random();
    }

    private update(dt: number, timestamp: number) {
        const state = this.gameState;
        const player = this.player;
        const inputState = this.input.getState();

        if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);

        // Wave Logic
        if (!state.boss.active && !this.isSpawning) {
            if (state.waveEnemiesToSpawn > 0) {
                state.enemySpawnTimer -= dt;
                if (state.enemySpawnTimer <= 0) {
                    this.spawnEnemy();
                    state.enemySpawnTimer = 0.5 + this.random() * (2.0 / (1 + state.waveCount * 0.1));
                }
            } else if (state.enemies.length === 0) {
                this.nextWave();
            }
        }

        // --- UPDATE SYSTEMS ---
        updatePlayerMovement(player, inputState.keys, inputState.joystick, this.config.ship, dt, this.width, this.height, this.scale);
        updateEntities(state, dt, this.width, this.height, this.scale, this.height / 2);
        updateBoss(state.boss, dt, this.width, this.scale, timestamp);
        updateScraps(state.scraps, player, dt, this.height, this.scale, this.config.equippedModules.includes('auto_magnet'));
        
        this.updateBossLogic(dt, timestamp);
        this.handleCombat(dt, timestamp, inputState.fire);
        
        // Solar Flare Event
        if (state.currentSector === 'solar_storm') {
            if (state.isSolarFlaring) {
                state.solarFlareTimer -= dt;
                if (state.solarFlareTimer <= 0) {
                    state.isSolarFlaring = false;
                    state.solarFlareTimer = 15 + this.random() * 10;
                } else if (player.invulnerable <= 0) {
                    // Dano por tick se não estiver protegido (sombra de asteroides - não implementado visualmente, então dano baixo)
                    if (timestamp % 500 < 50) this.handlePlayerHit(0.5); 
                }
            } else {
                state.solarFlareTimer -= dt;
                if (state.solarFlareTimer <= 0) {
                    state.isSolarFlaring = true;
                    state.solarFlareTimer = 3.0; // Duração
                    this.events.emit('warning', TRANSLATIONS[this.config.language].warnings.solar_flare);
                }
            }
        }

        // Regen Module
        if (this.config.equippedModules.includes('vampiric_rounds') && player.killCount >= 50) {
            if (this.hearts < (this.config.ship.health + 1)) {
                this.hearts++;
                player.killCount = 0;
                this.spawnFloatingText(player.x, player.y - 20, "REPAIR", "#0f0");
                this.notifyUi();
            }
        }

        // Status Effects
        if (player.status.burn > 0) {
            player.status.burn -= dt;
            player.status.burnTick -= dt;
            if (player.status.burnTick <= 0) {
                this.handlePlayerHit(0.5); // DoT
                player.status.burnTick = 1.0;
            }
        }
        if (player.status.frozen > 0) {
            player.status.frozen -= dt;
            // Slow down logic would go in movement
        }

        // Collision Check
        checkCollisions(state, player, this.scale, {
            onBossHit: (dmg) => {
                state.boss.hp -= dmg;
                if (state.boss.hp <= 0) {
                    this.handleBossDefeated();
                }
                this.notifyUi();
            },
            onPlayerHit: (dmg) => {
                this.handlePlayerHit(dmg);
            },
            onEnemyHit: (idx, dmg) => {
                const e = state.enemies[idx];
                e.hp -= dmg;
                if (e.hp <= 0) {
                    this.handleEnemyKill(e, idx);
                }
            },
            onScrapCollect: (idx, val) => {
                const s = state.scraps[idx];
                s.active = false;
                state.scrapCollected += Math.floor(val * (this.config.inventory.includes('data_mining') ? 1.2 : 1.0));
                state.gameScore += 10;
                sfx.collect();
                this.notifyUi();
            },
            onPowerUpCollect: (idx, type) => {
                const p = state.powerups[idx];
                p.active = false;
                this.activatePowerUp(type);
                sfx.powerup();
            },
            onExplosion: (x, y, radius, dmg) => {
                this.spawnExplosion(x, y, radius);
                // Simple AOE check
                for(let i=0; i<state.enemies.length; i++) {
                    const e = state.enemies[i];
                    if(!e.active) continue;
                    const dx = e.x - x;
                    const dy = e.y - y;
                    if(Math.sqrt(dx*dx+dy*dy) < radius) {
                        e.hp -= dmg;
                        e.hitFlash = 0.1;
                        if(e.hp <= 0) this.handleEnemyKill(e, i);
                    }
                }
            }
        });
        
        // Combo Timer
        if (state.comboTimer > 0) {
            state.comboTimer -= dt;
            if (state.comboTimer <= 0) state.currentCombo = 1;
        }

        // Notify UI
        this.notifyUi();
    }

    private updateBossLogic(dt: number, timestamp: number) {
        const boss = this.gameState.boss;
        if (!boss.active) return;
        if (boss.entering) return;
    
        boss.shootTimer -= dt;
    
        // --- OBSERVER AI ---
        if (boss.type === 'observer') {
            if (boss.shootTimer <= 0) {
                this.fireObserverPattern();
                boss.shootTimer = boss.phase === 3 ? 1.5 : 2.0;
            }
            
            const hpPercent = boss.hp / boss.maxHp;
            if (hpPercent < 0.4) boss.phase = 3;
            else if (hpPercent < 0.7) boss.phase = 2;
            else boss.phase = 1;
        }
    
        // --- TITAN AI ---
        else if (boss.type === 'titan') {
            if (boss.isCharging) {
                // Charging movement
                boss.y += 800 * dt * this.scale;
                if (boss.y > this.height) {
                    boss.y = -200;
                    boss.isCharging = false;
                    boss.chargeFlash = 0;
                    boss.shootTimer = 2.0;
                }
                return; 
            }
    
            // Charge Prep
            if (!boss.isCharging && boss.chargeFlash && boss.chargeFlash > 0) {
                boss.chargeFlash -= dt;
                if (boss.chargeFlash <= 0) {
                    boss.isCharging = true;
                    sfx.ultimateUse();
                }
                return;
            }
    
            if (boss.shootTimer <= 0) {
                // Chance to charge
                if (boss.hp < boss.maxHp * 0.6 && this.random() > 0.7) {
                    boss.chargeFlash = 1.0; 
                } else {
                    this.fireTitanPattern();
                    boss.shootTimer = 2.5;
                }
            }
        }
    
        // --- WRAITH AI ---
        else if (boss.type === 'wraith') {
            if (boss.teleportTimer !== undefined) {
                 boss.teleportTimer -= dt;
                 
                 if (boss.teleportTimer < 0.5 && boss.teleportTimer > 0) {
                     boss.opacity = Math.max(0, boss.teleportTimer * 2); 
                 }
                 
                 if (boss.teleportTimer <= 0) {
                     boss.x = 50 + this.random() * (this.width - 100);
                     boss.y = 50 + this.random() * (this.height / 3);
                     boss.opacity = 1.0;
                     boss.teleportTimer = 3.0 + this.random() * 2.0;
                     
                     this.fireWraithPattern();
                     boss.shootTimer = 1.5;
                 }
            } else {
                boss.teleportTimer = 4.0;
            }
    
            if (boss.shootTimer <= 0 && (!boss.opacity || boss.opacity > 0.8)) {
                 this.fireWraithPattern();
                 boss.shootTimer = 1.2;
            }
        }
    }

    private fireObserverPattern() {
        const boss = this.gameState.boss;
        const phase = boss.phase;
        const cx = boss.x + boss.width/2;
        const cy = boss.y + boss.height/2;

        if (phase === 1) {
            // Fan
            for(let i=-2; i<=2; i++) {
                this.spawnEnemyBullet(cx, cy + 40, i * 0.3, 300, '#00f3ff');
            }
        } else if (phase === 2) {
            // Spiral
            const count = 12;
            for(let i=0; i<count; i++) {
                const angle = (i / count) * Math.PI * 2 + (performance.now() / 1000);
                this.spawnEnemyBullet(cx, cy, Math.cos(angle)*1.5, Math.sin(angle)*300, '#ff00ff');
            }
        } else {
            // Heavy
             for(let i=-4; i<=4; i++) {
                this.spawnEnemyBullet(cx + i*10, cy + 50, 0, 450, '#ff0000');
            }
        }
        sfx.shoot();
    }

    private fireTitanPattern() {
        const boss = this.gameState.boss;
        const cx = boss.x + boss.width/2;
        const cy = boss.y + boss.height;

        // Wall
        for(let i=0; i<8; i++) {
            const xOff = (i - 3.5) * 40 * this.scale;
            this.spawnEnemyBullet(cx + xOff, cy, 0, 250, '#ffaa00');
        }
        sfx.shoot();
    }

    private fireWraithPattern() {
        const boss = this.gameState.boss;
        const cx = boss.x + boss.width/2;
        const cy = boss.y + boss.height/2;

        // Sniper Shot (Aimed)
        const dx = (this.player.x + this.player.width/2) - cx;
        const dy = (this.player.y + this.player.height/2) - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const vx = (dx/dist) * 1.5;
        const speed = 600;

        this.spawnEnemyBullet(cx, cy, vx, speed, '#d946ef');
        // Side bullets
        this.spawnEnemyBullet(cx, cy, vx - 0.5, speed * 0.8, '#d946ef');
        this.spawnEnemyBullet(cx, cy, vx + 0.5, speed * 0.8, '#d946ef');
        
        sfx.shoot();
    }

    private handleCombat(dt: number, timestamp: number, fireInput: boolean) {
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        // Auto-fire or Manual
        if (fireInput && this.fireCooldown <= 0) {
            this.fireBullet();
            
            // Base fire rate logic
            let baseRate = 0.25;
            if (this.config.ship.id === 'core') baseRate = 0.2; // Faster
            if (this.config.ship.id === 'striker') baseRate = 0.35; // Slower
            
            // Bonuses
            if (this.player.timers.rapid_fire > 0) baseRate *= 0.5;
            if (this.config.inventory.includes('weapon_preheat')) baseRate *= 0.9;

            this.fireCooldown = baseRate;
        }
    }

    private fireBullet() {
        const p = this.player;
        const cx = p.x + p.width/2;
        const cy = p.y;
        
        const dmg = this.config.ship.power * (this.player.timers.damage > 0 ? 2 : 1) * (this.config.inventory.includes('weapon_preheat') ? 1.15 : 1.0);
        const color = this.player.timers.damage > 0 ? '#ff0000' : this.config.ship.color;

        // Berzerk Module Logic
        const berzerkMult = this.config.equippedModules.includes('berzerk_drive') ? (1 + (3 - this.hearts) * 0.3) : 1;
        const finalDmg = dmg * berzerkMult;

        this.spawnPlayerBullet(cx, cy, 0, -800, color, finalDmg);

        if (this.player.timers.triple_shot > 0) {
            this.spawnPlayerBullet(cx - 10, cy + 5, -0.2, -750, color, finalDmg);
            this.spawnPlayerBullet(cx + 10, cy + 5, 0.2, -750, color, finalDmg);
        }

        sfx.shoot();
    }

    private spawnPlayerBullet(x: number, y: number, vx: number, vy: number, color: string, damage: number) {
        const b = this.bulletPool.get();
        b.x = x - 2; b.y = y; b.w = 4 * this.scale; b.h = 12 * this.scale;
        b.vx = vx * 500; b.vy = vy * this.scale; b.color = color;
        b.damage = damage;
        b.isHoming = this.config.ship.id === 'phantom'; 
        b.isExplosive = this.config.ship.id === 'striker';
        this.gameState.bullets.push(b);
    }

    private spawnEnemyBullet(x: number, y: number, vx: number, speed: number, color: string) {
        const b = this.enemyBulletPool.get();
        b.x = x; b.y = y;
        b.vx = vx * 300 * this.scale; 
        b.vy = speed * this.scale; 
        b.color = color;
        this.gameState.enemyBullets.push(b);
    }

    private spawnEnemy() {
        const e = this.enemyPool.get();
        // Spawner Reset Logic
        resetEnemy(e, this.gameState.waveCount, this.width, this.height, this.scale, this.rng);
        
        this.gameState.enemies.push(e);
        this.gameState.waveEnemiesToSpawn--;
    }

    private spawnBoss() {
        const wave = this.gameState.waveCount;
        
        // Cycle: Wave 5->Observer, 10->Titan, 15->Wraith
        const bossIndex = (Math.floor(wave / 5) - 1) % 3;
        const types: BossType[] = ['observer', 'titan', 'wraith'];
        const type = types[bossIndex] || 'observer';
    
        let hp = 500 * (1 + wave * 0.2);
        if (type === 'titan') hp *= 1.5;
        if (type === 'wraith') hp *= 0.7;
    
        this.gameState.boss = {
            active: true,
            type: type,
            hp: hp,
            maxHp: hp,
            x: this.width / 2 - 90,
            y: -300,
            targetY: 100,
            width: type === 'titan' ? 140 : (type === 'wraith' ? 100 : 180),
            height: type === 'titan' ? 140 : (type === 'wraith' ? 80 : 140),
            entering: true,
            phase: 1,
            shootTimer: 2.0,
            moveDir: 1,
            hitFlash: 0,
            chargeFlash: 0,
            teleportTimer: type === 'wraith' ? 3.0 : undefined,
            opacity: 1.0
        };
    
        this.isSpawning = false;
        
        const t = TRANSLATIONS[this.config.language];
        const name = type === 'titan' ? 'TITAN PRIME' : (type === 'wraith' ? 'VOID WRAITH' : 'THE OBSERVER');
        const sub = type === 'titan' ? 'HEAVY ARMOR DETECTED' : (type === 'wraith' ? 'STEALTH SIGNATURE' : t.boss_warning);
        
        this.events.emit('warning', `${name}\n${sub}`);
    }

    private nextWave() {
        this.gameState.waveCount++;
        this.gameState.waveEnemiesToSpawn = 10 + Math.floor(this.gameState.waveCount * 1.5);
        this.gameState.waveStatus = 'announcing';
        this.gameState.announcementTimer = 3.0;
        this.gameState.enemySpawnTimer = 0;

        // Difficulty / Sector Rotation
        const sectorCycle = Math.floor((this.gameState.waveCount - 1) / 5) % 4;
        const sectors = ['void', 'nebula', 'asteroid_belt', 'solar_storm'];
        this.gameState.currentSector = sectors[sectorCycle] as any;

        // Spawn Boss every 5 waves
        if (this.gameState.waveCount % 5 === 0) {
            this.spawnBoss();
        } else {
            const t = TRANSLATIONS[this.config.language];
            this.events.emit('warning', `${t.wave} ${this.gameState.waveCount}`);
        }
    }

    private handlePlayerHit(dmg: number) {
        if (this.player.invulnerable > 0 || this.isDead || this.player.timers.skill_active > 0) return;
        
        if (this.player.timers.shield > 0) {
            this.player.timers.shield = 0;
            this.player.invulnerable = 2.0;
            return;
        }

        this.hearts -= dmg;
        this.player.invulnerable = 2.0;
        this.gameState.currentCombo = 1;
        this.gameState.shake = 10;
        sfx.hit();
        this.notifyUi();

        if (this.hearts <= 0) {
            this.handleDeath();
        }
    }

    private handleDeath() {
        if (this.isDead) return;
        this.isDead = true;
        this.spawnExplosion(this.player.x, this.player.y, 100);
        sfx.explosion();
        
        const t = TRANSLATIONS[this.config.language];
        this.events.emit('message', t.mission_failed);

        setTimeout(() => {
            const result: GameResult = {
                score: this.gameState.gameScore,
                scrapCollected: this.gameState.scrapCollected,
                survivedWaves: this.gameState.waveCount - 1,
                xpGained: Math.floor(this.gameState.gameScore / 10),
                shipId: this.config.ship.id,
                mode: this.config.mode
            };
            this.events.emit('game_over', result);
            this.stop();
        }, 2000);
    }

    private handleEnemyKill(e: Enemy, idx: number) {
        // Drop System
        if (this.random() > 0.6) {
            const s = this.scrapPool.get();
            s.x = e.x; s.y = e.y; s.value = 10 + this.gameState.waveCount; s.vx = (this.random()-0.5)*100; s.vy = -100; s.size = 8 * this.scale;
            this.gameState.scraps.push(s);
        }
        
        if (this.random() > 0.95) {
            const p = this.powerupPool.get();
            p.x = e.x; p.y = e.y; p.size = 20 * this.scale; p.vx = 0; p.vy = 50;
            const types: PowerUpType[] = ['triple_shot', 'rapid_fire', 'shield', 'battery', 'damage'];
            if(this.hearts < this.config.ship.health) types.push('health');
            p.type = types[Math.floor(this.random() * types.length)];
            this.gameState.powerups.push(p);
        }

        this.spawnExplosion(e.x, e.y, e.width);
        this.spawnFloatingText(e.x, e.y, `+${100 * this.gameState.currentCombo}`, '#ffff00');
        
        this.player.killCount++;
        this.player.energy = Math.min(100, this.player.energy + 5);
        this.gameState.gameScore += 100 * this.gameState.currentCombo;
        this.gameState.currentCombo++;
        this.gameState.comboTimer = 3.0;

        e.active = false;
        sfx.explosion();
        this.notifyUi();
    }

    private handleBossDefeated() {
        const b = this.gameState.boss;
        this.spawnExplosion(b.x + b.width/2, b.y + b.height/2, 200);
        this.spawnFloatingText(b.x, b.y, "BOSS DEFEATED", '#ff00ff');
        
        b.active = false;
        this.gameState.gameScore += 5000;
        this.gameState.scrapCollected += 500;
        this.player.energy = 100;
        
        // Clear bullets
        this.gameState.enemyBullets.forEach(b => b.active = false);

        sfx.explosion();
        this.nextWave();
        this.notifyUi();
    }

    private spawnExplosion(x: number, y: number, size: number) {
        const count = 10 + Math.floor(size / 5);
        for(let i=0; i<count; i++) {
            const p = this.particlePool.get();
            p.x = x; p.y = y;
            const ang = this.random() * Math.PI * 2;
            const spd = this.random() * 200;
            p.vx = Math.cos(ang) * spd;
            p.vy = Math.sin(ang) * spd;
            p.life = 0.5 + this.random() * 0.5;
            p.maxLife = p.life;
            p.color = this.random() > 0.5 ? '#ffaa00' : '#ff0000';
            p.size = 2 + this.random() * 4;
            this.gameState.particles.push(p);
        }
    }

    private spawnFloatingText(x: number, y: number, text: string, color: string) {
        const ft = this.floatingTextPool.get();
        ft.x = x; ft.y = y; ft.text = text; ft.color = color;
        ft.life = 1.0; ft.maxLife = 1.0; ft.size = 16 * this.scale; ft.vy = 50;
        this.gameState.floatingTexts.push(ft);
    }

    private activatePowerUp(type: PowerUpType) {
        const d = 10.0;
        switch(type) {
            case 'health': 
                this.hearts = Math.min(this.hearts + 1, this.config.ship.health + 1); 
                break;
            case 'triple_shot': this.player.timers.triple_shot = d; break;
            case 'rapid_fire': this.player.timers.rapid_fire = d; break;
            case 'shield': this.player.timers.shield = d; break;
            case 'battery': this.player.energy = 100; break;
            case 'damage': this.player.timers.damage = d; break;
            case 'nuke': 
                this.gameState.enemies.forEach((e, i) => { if(e.active) { e.hp = 0; this.handleEnemyKill(e, i); } }); 
                break;
        }
        this.spawnFloatingText(this.player.x, this.player.y - 40, type.toUpperCase(), '#00ff00');
        this.notifyUi();
    }

    private notifyUi() {
        this.events.emit<GameUiData>('ui_update', {
            score: this.gameState.gameScore,
            wave: this.gameState.waveCount,
            hearts: this.hearts,
            energy: this.player.energy,
            bossHp: this.gameState.boss.active ? this.gameState.boss.hp : 0,
            bossMax: this.gameState.boss.active ? this.gameState.boss.maxHp : 1
        });
    }

    private draw(timestamp: number) {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const state = this.gameState;

        // Shake Effect
        let dx = 0, dy = 0;
        if (state.shake > 0) {
            dx = (Math.random() - 0.5) * state.shake;
            dy = (Math.random() - 0.5) * state.shake;
        }

        ctx.save();
        ctx.translate(dx, dy);

        // Background
        let gridOffset = (timestamp / 1000 * 60) % 60;
        drawGrid(ctx, width, height, gridOffset, state.currentSector);
        drawStars(ctx, state.stars, state.currentSector);

        // Objects
        state.scraps.forEach(s => { if(s.active) drawScrap(ctx, s); });
        state.powerups.forEach(p => { if(p.active) drawPowerUp(ctx, p, this.scale, timestamp); });
        
        state.bullets.forEach(b => { if(b.active) drawBullet(ctx, b); });
        state.enemyBullets.forEach(b => { if(b.active) drawEnemyBullet(ctx, b, this.scale); });

        state.enemies.forEach(e => drawEnemy(ctx, e, this.scale, timestamp));
        drawBoss(ctx, state.boss, this.scale, timestamp);

        if (!this.isDead) drawPlayer(ctx, this.player, this.scale, timestamp);

        drawParticles(ctx, state.particles);
        drawFloatingTexts(ctx, state.floatingTexts);

        // Warning Overlay (Solar Flare)
        if (state.currentSector === 'solar_storm' && state.isSolarFlaring) {
             ctx.fillStyle = `rgba(255, 50, 0, ${0.1 + Math.sin(timestamp/100)*0.05})`;
             ctx.fillRect(0,0,width,height);
        }

        ctx.restore();
    }
}
