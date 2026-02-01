
import { Bullet, Scrap, PowerUp, Particle, PowerUpType, FloatingText } from '../types';

export const drawBullet = (ctx: CanvasRenderingContext2D, b: Bullet) => {
    ctx.save();
    // Glow core
    ctx.shadowBlur = 5;
    ctx.shadowColor = b.color;
    ctx.fillStyle = '#fff'; 
    
    // Ensure min width/height even if scaled down
    const w = Math.max(3, b.w);
    const h = Math.max(8, b.h);
    
    // Draw white center
    ctx.fillRect(b.x + (w/4), b.y, w/2, h);
    
    // Draw colored outer
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, w, h);
    
    ctx.restore();
};

export const drawEnemyBullet = (ctx: CanvasRenderingContext2D, eb: Bullet, scale: number) => {
    const radius = Math.max(4, 7 * scale); // Tamanho mínimo de segurança
    ctx.save();
    ctx.beginPath(); 
    ctx.arc(eb.x, eb.y, radius, 0, Math.PI*2); 
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, radius * 1.5, 0, Math.PI*2);
    ctx.fillStyle = eb.color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();
};

export const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
};

export const drawFloatingTexts = (ctx: CanvasRenderingContext2D, texts: FloatingText[]) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    texts.forEach(ft => {
        const opacity = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = opacity;
        
        ctx.font = `bold ${ft.size}px "Rajdhani"`;
        
        // Outline para legibilidade
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.strokeText(ft.text, ft.x, ft.y);
        
        // Texto principal
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
};

export const drawScrap = (ctx: CanvasRenderingContext2D, s: Scrap) => {
    ctx.fillStyle = '#00f3ff'; 
    ctx.fillRect(s.x, s.y, s.size, s.size);
};

const getPowerUpLabel = (type: PowerUpType) => {
    switch(type) {
        case 'health': return 'H';
        case 'triple_shot': return 'T';
        case 'rapid_fire': return 'R';
        case 'shield': return 'S';
        case 'battery': return 'B';
        case 'nuke': return 'N';
        case 'damage': return 'D';
        default: return 'P';
    }
};

export const drawPowerUp = (ctx: CanvasRenderingContext2D, p: PowerUp, scale: number, timestamp: number) => {
    ctx.save();
    ctx.translate(p.x + p.size/2, p.y + p.size/2);
    ctx.scale(scale, scale);
    const radius = (p.size / scale) / 2;
    
    // Aura circular pulsante
    const pulse = Math.sin(timestamp / 200) * 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath(); 
    ctx.arc(0, 0, radius, 0, Math.PI*2); 
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#fff'; 
    ctx.lineWidth = 2; 
    ctx.stroke();
    
    ctx.fillStyle = p.color; 
    ctx.font = "bold 14px Orbitron"; 
    ctx.textAlign = "center"; 
    ctx.fillText(getPowerUpLabel(p.type), 0, 5);
    
    ctx.restore();
};
