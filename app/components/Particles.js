'use client';

import { useEffect, useRef } from 'react';

export default function Particles({ mousePosition }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, radius: 150 });

  useEffect(() => {
    mouseRef.current = { ...mousePosition, radius: 150 };
  }, [mousePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles.length = 0;
      const count = Math.min(Math.floor(canvas.width * canvas.height / 9000), 100);
      for (let i = 0; i < count; i++) {
        const radius = 2 * Math.random() + 1;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0.2 * Math.random() - 0.1,
          vy: 0.2 * Math.random() - 0.1,
          radius,
        });
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > canvas.width) particle.vx = -particle.vx;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy = -particle.vy;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fill();

        const dx = particle.x - mouseRef.current.x;
        const dy = particle.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseRef.current.radius) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(59, 130, 246, ${(1 - distance / mouseRef.current.radius) * 0.8})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
          particle.x += 0.01 * dx;
          particle.y += 0.01 * dy;
        }

        particles.forEach((other) => {
          if (particle === other) return;
          const dx2 = particle.x - other.x;
          const dy2 = particle.y - other.y;
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (distance2 < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 * (1 - distance2 / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });
      requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
