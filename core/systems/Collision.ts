
import { GameState, PlayerState, PowerUpType } from '../../types';

const isColliding = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, width:number, height:number}) => {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.h > r2.y;
};

const isClose = (x1: number, y1: number, x2: number, y2: number, dist: number) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx*dx + dy*dy) < dist;
};

interface CollisionCallbacks {
    onBossHit: (damage: number) => void;
    onPlayerHit: (damage: number) => void;
    onEnemyHit: (enemyIndex: number, damage: number) => void;
    onScrapCollect: (scrapIndex: number, value: number) => void;
    onPowerUpCollect: (powerUpIndex: number, type: PowerUpType) => void;
    onExplosion?: (x: number, y: number, radius: number, damage: number) => void;
}

export const checkCollisions = (
    state: GameState, 
    player: PlayerState, 
    scale: number, 
    callbacks: CollisionCallbacks
) => {
    // Boss Collision
    if (state.boss.active) {
        for (let i = 0; i < state.bullets.length; i++) {
            const b = state.bullets[i];
            if (!b.active) continue;

            if (b.x > state.boss.x && b.x < state.boss.x + state.boss.width && 
                b.y > state.boss.y && b.y < state.boss.y + state.boss.height) {
                state.boss.hitFlash = 0.05;
                callbacks.onBossHit(b.damage * 0.8); // Boss tem resistência natural
                
                if (b.isExplosive && callbacks.onExplosion) {
                    callbacks.onExplosion(b.x, b.y, 80 * scale, b.damage * 0.5); // Dano reduzido no AOE secundário
                }
                
                b.active = false;
            }
        }
    }

    // Enemies Collision
    for (let j = 0; j < state.bullets.length; j++) {
        const b = state.bullets[j];
        if (!b.active) continue;

        let hit = false;
        // Optimization: Iterar apenas inimigos próximos poderia ser melhor, mas em array pequeno é ok
        for (let i = 0; i < state.enemies.length; i++) {
            const e = state.enemies[i];
            if (!e.active) continue;

            if (isColliding(b, e)) {
                e.hitFlash = 0.05;
                callbacks.onEnemyHit(i, b.damage);
                
                if (b.isExplosive && callbacks.onExplosion) {
                    callbacks.onExplosion(b.x, b.y, 100 * scale, b.damage * 0.8);
                }

                b.active = false;
                hit = true;
                break;
            }
        }
        if (hit) continue;
    }

    // Player Collision
    if (player.invulnerable <= 0) {
        // Enemy Bullets
        for (let i = 0; i < state.enemyBullets.length; i++) {
            const eb = state.enemyBullets[i];
            if (!eb.active) continue;

            if (eb.x > player.x && eb.x < player.x + player.width && 
                eb.y > player.y && eb.y < player.y + player.height) {
                player.hitFlash = 0.15;
                
                if (eb.element === 'ice') player.status.frozen = 3.0;
                if (eb.element === 'fire') player.status.burn = 3.0;

                callbacks.onPlayerHit(1);
                eb.active = false;
            }
        }
        
        // Enemy Bodies
        for (let i = 0; i < state.enemies.length; i++) {
            const e = state.enemies[i];
            if (!e.active) continue;

            if (isColliding({x:player.x, y:player.y, w:player.width, h:player.height}, e)) {
                player.hitFlash = 0.15;
                callbacks.onPlayerHit(1);
                
                if (e.element === 'ice') player.status.frozen = 3.0;
                if (e.element === 'fire') player.status.burn = 3.0;

                // Inimigos menores morrem ao colidir (Kamikaze style)
                if (e.type !== 'asteroid') {
                    callbacks.onEnemyHit(i, 999);
                    e.active = false;
                }
            }
        }
    }

    // Scraps
    for (let i = 0; i < state.scraps.length; i++) {
        const s = state.scraps[i];
        if (!s.active) continue;
        if (isClose(player.x + player.width/2, player.y + player.height/2, s.x, s.y, 50 * scale)) {
            callbacks.onScrapCollect(i, s.value);
        }
    }

    // Powerups
    for (let i = 0; i < state.powerups.length; i++) {
        const p = state.powerups[i];
        if (!p.active) continue;
        if (p.x < player.x + player.width && p.x + p.size > player.x && 
            p.y < player.y + player.height && p.y + p.size > player.y) {
            callbacks.onPowerUpCollect(i, p.type);
        }
    }
};
