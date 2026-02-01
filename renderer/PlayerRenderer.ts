
import { PlayerState } from '../types';

export const drawPlayer = (ctx: CanvasRenderingContext2D, p: PlayerState, scale: number, timestamp: number) => {
    ctx.save();
    ctx.translate(p.x + p.width/2, p.y + p.height/2);
    ctx.rotate(p.lean);
    ctx.scale(scale, scale); 

    ctx.globalCompositeOperation = 'lighter';

    // Se estiver usando habilidade (Phantom Phase Shift)
    if (p.timers.skill_active > 0 && p.invulnerable > 0) {
        ctx.globalAlpha = 0.4 + Math.sin(timestamp / 50) * 0.2;
    }

    // Propulsores
    const flameH = 20 + Math.sin(timestamp/40)*12;
    const grad = ctx.createLinearGradient(0, 22, 0, 22 + flameH);
    grad.addColorStop(0, 'rgba(0, 243, 255, 0.8)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-12, 22); ctx.lineTo(0, 22 + flameH); ctx.lineTo(12, 22);
    ctx.fill();
    
    // Hit Flash
    const isFlashing = p.hitFlash > 0;

    // Nave - Camada de Brilho
    ctx.strokeStyle = isFlashing ? '#fff' : 'rgba(0, 243, 255, 0.3)'; 
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -27); ctx.lineTo(27, 22); ctx.lineTo(0, 8); ctx.lineTo(-27, 22); 
    ctx.closePath();
    ctx.stroke();

    // Nave - Núcleo
    ctx.strokeStyle = isFlashing ? '#fff' : '#00f3ff'; 
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Cockpit
    ctx.fillStyle = isFlashing ? '#fff' : (p.timers.skill_active > 0 ? '#ff00ff' : '#fff');
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 12, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
};
