
import { Star, SectorType } from '../types';

export const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridOffset: number, sector: SectorType = 'void') => {
    // Fundo sólido
    if (sector === 'solar_storm') {
        ctx.fillStyle = '#1a0505'; // Dark Reddish
    } else if (sector === 'nebula') {
        ctx.fillStyle = '#0a0a1a'; // Dark Bluish
    } else {
        ctx.fillStyle = '#050014'; 
    }
    ctx.fillRect(0, 0, width, height);
    
    // Grid Retro
    ctx.beginPath(); 
    if (sector === 'solar_storm') ctx.strokeStyle = 'rgba(255, 100, 50, 0.08)';
    else if (sector === 'nebula') ctx.strokeStyle = 'rgba(100, 100, 255, 0.05)';
    else ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)'; 
    
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += 60) { 
        ctx.moveTo(x, 0); 
        ctx.lineTo(x, height); 
    }
    for (let y = gridOffset; y <= height; y += 60) { 
        ctx.moveTo(0, y); 
        ctx.lineTo(width, y); 
    }
    ctx.stroke();

    // Sector Visuals
    if (sector === 'nebula') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, 'rgba(100,0,200,0.1)');
        grad.addColorStop(0.5, 'transparent');
        grad.addColorStop(1, 'rgba(0,100,200,0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,width,height);
    }
};

export const drawSolarFlare = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    // Warning Pulse
    ctx.fillStyle = `rgba(255, 50, 0, ${0.1 + (Math.sin(intensity * 10) * 0.05)})`;
    ctx.fillRect(0, 0, width, height);

    // Heat waves
    if (Math.random() > 0.7) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.1)';
        const w = Math.random() * width;
        ctx.fillRect(w, 0, Math.random() * 50, height);
    }
};

export const drawStars = (ctx: CanvasRenderingContext2D, stars: Star[], sector: SectorType = 'void') => {
    ctx.fillStyle = sector === 'solar_storm' ? '#ffaa88' : '#fff';
    stars.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;
};
