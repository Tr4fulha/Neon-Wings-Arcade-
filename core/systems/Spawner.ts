
import { Enemy, EnemyType } from '../../types';
import { SeededRNG } from '../../utils/rng';

const getRand = (rng: SeededRNG | null) => {
    return rng ? rng.next() : Math.random();
};

export const resetEnemy = (
    enemy: Enemy,
    waveNum: number,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    rng: SeededRNG | null,
    overrideX?: number,
    overrideType?: EnemyType,
    overrideTargetY?: number
) => {
    const randType = getRand(rng);
    
    let type: EnemyType = overrideType || 'scout';
    
    // Se não for override, usa lógica normal de spawn
    if (!overrideType) {
        if (randType > 0.8) type = 'fighter';
        else if (randType > 0.6) type = 'kamikaze';
        
        if (waveNum >= 5 && getRand(rng) > 0.7) type = 'asteroid';
        if (waveNum >= 8 && getRand(rng) > 0.85) type = 'sniper';
        if (waveNum >= 10 && getRand(rng) > 0.92) type = 'tank';
    }

    let w = 44 * scale;
    let h = 44 * scale;
    let hp = 2 + (waveNum * 0.3);
    let color = '#00f3ff';
    let speed = 100 + (waveNum * 5);
    let pattern = 'sine';
    let isEntering = true;

    // Reset properties on existing object first (defaults)
    enemy.active = true;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.hitFlash = 0;
    enemy.element = 'none';

    switch (type) {
        case 'asteroid':
            // Lógica de Asteroide Melhorada: Tamanho variável afeta HP e Velocidade
            const sizeMult = 1.0 + getRand(rng) * 1.5; // 1x a 2.5x
            w = 50 * scale * sizeMult; 
            h = 50 * scale * sizeMult; 
            
            // Vida escala exponencialmente com o tamanho (Dobro da base + bônus de tamanho)
            hp = (15 + (waveNum * 2)) * sizeMult; 
            
            color = '#777'; 
            // Quanto maior, mais lento
            speed = (speed * 0.7) / sizeMult; 
            
            pattern = 'linear';
            isEntering = false;
            break;

        case 'kamikaze':
            color = '#ef4444'; 
            speed = (250 + (waveNum * 10)) * scale; 
            hp = 1 + (waveNum * 0.1); 
            isEntering = false;
            break;

        case 'fighter':
            w = 50 * scale; h = 50 * scale; hp = 4 + (waveNum * 0.4); color = '#a855f7'; 
            break;

        case 'sniper':
            // Nave amarela
            w = 40 * scale; h = 50 * scale;
            color = '#facc15'; speed *= 0.8; hp = 3 + (waveNum * 0.2); 
            break;

        case 'tank':
            w = 70 * scale; h = 70 * scale; hp = 25 + (waveNum * 1.5); color = '#22c55e'; speed *= 0.3; 
            break;
    }

    const spawnX = overrideX !== undefined ? overrideX : getRand(rng) * (canvasWidth - w);
    
    enemy.x = spawnX;
    enemy.y = -300 * scale;
    enemy.width = w;
    enemy.height = h;
    enemy.hp = Math.ceil(hp);
    
    // Velocidade inicial (ajustada pelo Physics depois)
    enemy.vx = (getRand(rng) - 0.5) * speed; 
    enemy.vy = speed * 0.8; 
    
    enemy.type = type;
    enemy.color = color;
    enemy.shootTimer = 2.0 + getRand(rng) * 3.0;
    enemy.pattern = pattern;
    enemy.baseX = spawnX;
    enemy.isEntering = isEntering;
    
    // Target Y: Posição de combate
    enemy.targetY = overrideTargetY || ((80 * scale) + getRand(rng) * (canvasHeight / 2.5));

    if (type === 'asteroid') {
        enemy.targetY = canvasHeight + 500; // Vai até o fim da tela
        enemy.vy = speed;
        enemy.vx = (getRand(rng) - 0.5) * speed * 0.5; // Drift lateral leve
    }
    
    if (type === 'kamikaze') {
        enemy.targetY = canvasHeight + 200;
        enemy.vy = speed;
        enemy.vx = (getRand(rng) - 0.5) * (speed * 0.2);
    }
};
