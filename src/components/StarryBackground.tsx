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
        let stars: { x: number; y: number; radius: number; opacity: number; twinkleSpeed: number; decreasing: boolean }[] = [];

        const initStars = () => {
            stars = [];
            // Quantidade sutil de estrelas (um pouco mais concentrado para um céu noturno)
            const numStars = Math.floor((canvas.width * canvas.height) / 9000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.2 + 0.3, // tamanhos variados
                    opacity: Math.random() * 0.5 + 0.1, // estado inicial do brilho
                    twinkleSpeed: Math.random() * 0.01 + 0.003, // velocidade em que a estrela pisca
                    decreasing: Math.random() > 0.5, // define se a estrela começa acendendo ou apagando
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
                // A sombra cria um leve efeito de neon/brilho ao redor de cada pontinho
                ctx.shadowBlur = Math.random() * 3 + 1;
                ctx.shadowColor = `rgba(255, 255, 255, ${star.opacity})`;

                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                // Lógica do Twinkle (Piscar)
                if (star.decreasing) {
                    star.opacity -= star.twinkleSpeed;
                    if (star.opacity <= 0.1) {
                        star.decreasing = false; // Começa a acender
                    }
                } else {
                    star.opacity += star.twinkleSpeed;
                    if (star.opacity >= 0.7) {
                        star.decreasing = true; // Começa a apagar
                    }
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
