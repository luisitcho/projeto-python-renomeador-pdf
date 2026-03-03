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
        let stars: { x: number; y: number; radius: number; speed: number; opacity: number }[] = [];

        const initStars = () => {
            stars = [];
            // Quantidade sutil de estrelas (1 estrela para cada 12000px de área)
            const numStars = Math.floor((canvas.width * canvas.height) / 12000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.2 + 0.2, // pontos muito pequenos
                    speed: Math.random() * 0.3 + 0.05, // queda super suave
                    opacity: Math.random() * 0.4 + 0.1, // brilho sutil
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
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Movimentação para baixo
                star.y += star.speed;

                // Se passar do fundo, volta para o topo em uma posição X aleatória
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }
            });

            animationFrameId = requestAnimationFrame(drawStars);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        drawStars();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
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
