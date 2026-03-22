'use client';

import { useEffect, useRef } from 'react';

export default function StarryBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { 
            x: number; 
            y: number; 
            originX: number;
            originY: number;
            vx: number; 
            vy: number; 
            radius: number; 
            opacity: number; 
            twinkleSpeed: number; 
            decreasing: boolean 
        }[] = [];
        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const initStars = () => {
            stars = [];
            // Densidade equilibrada (1 estrela a cada 5000 pixels)
            const numStars = Math.floor((canvas.width * canvas.height) / 5000);
            for (let i = 0; i < numStars; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                stars.push({
                    x: x,
                    y: y,
                    originX: x,
                    originY: y,
                    vx: 0,
                    vy: 0,
                    radius: Math.random() * 1.8 + 0.4, 
                    opacity: Math.random() * 0.6 + 0.2, // Um pouco mais visível como no início
                    twinkleSpeed: Math.random() * 0.01 + 0.005, 
                    decreasing: Math.random() > 0.5, 
                });
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const drawStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach((star) => {
                const dx = mouseX - star.x;
                const dy = mouseY - star.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 300) {
                    // Seguir o cursor
                    const force = (300 - distance) / 300;
                    star.vx += (dx / distance) * force * 0.4;
                    star.vy += (dy / distance) * force * 0.4;
                    
                    star.opacity = Math.min(1, star.opacity + 0.05);
                } else {
                    // Voltar para a posição original (Ficar "parado no fundo")
                    const dOriginX = star.originX - star.x;
                    const dOriginY = star.originY - star.y;
                    const distOrigin = Math.sqrt(dOriginX * dOriginX + dOriginY * dOriginY);
                    
                    if (distOrigin > 1) {
                        star.vx += (dOriginX / distOrigin) * 0.05;
                        star.vy += (dOriginY / distOrigin) * 0.05;
                    }
                    
                    star.opacity = Math.max(0.3, star.opacity - 0.01);
                }

                // Inércia para movimento suave
                star.vx *= 0.94;
                star.vy *= 0.94;
                star.x += star.vx;
                star.y += star.vy;

                ctx.beginPath();
                const isNear = distance < 150;
                ctx.shadowBlur = isNear ? 8 : 4;
                ctx.shadowColor = `rgba(255, 255, 255, ${star.opacity})`;

                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                if (star.decreasing) {
                    star.opacity -= star.twinkleSpeed;
                    if (star.opacity <= 0.2) star.decreasing = false; 
                } else {
                    star.opacity += star.twinkleSpeed;
                    if (star.opacity >= 0.7) star.decreasing = true; 
                }
            });

            animationFrameId = requestAnimationFrame(drawStars);
        };

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        resizeCanvas();
        drawStars();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-1] pointer-events-none opacity-40 mix-blend-screen"
            aria-hidden="true"
        />
    );
}
