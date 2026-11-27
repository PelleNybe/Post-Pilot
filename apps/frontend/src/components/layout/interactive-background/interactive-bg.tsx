'use client';

import React, { useEffect, useState, useRef } from 'react';
import './interactive-bg.scss';

export const InteractiveBackground = () => {
  const [isClient, setIsClient] = useState(false);
  const [particles, setParticles] = useState<{left: string, top: string, duration: string, delay: string, opacity: number}[]>([]);
  const [initialWindow, setInitialWindow] = useState({width: 1024, height: 768});
  const containerRef = useRef<HTMLDivElement>(null);
  const glowOrbRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    setInitialWindow({width: window.innerWidth, height: window.innerHeight});
    setParticles(
      Array.from({ length: 15 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: `${Math.random() * 10 + 10}s`,
        delay: `${Math.random() * -20}s`,
        opacity: Math.random() * 0.5 + 0.1,
      }))
    );
    let animationFrameId: number;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    // Use a small easing factor for smoothness
    const easing = 0.15;

    const animate = () => {
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;

      if (glowOrbRef.current) {
        glowOrbRef.current.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
      }

      if (particlesRef.current) {
        // Subtle parallax effect based on mouse position from center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = (currentX - centerX) * -0.05;
        const offsetY = (currentY - centerY) * -0.05;

        particlesRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const updateMousePosition = (ev: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        targetX = ev.clientX - rect.left;
        targetY = ev.clientY - rect.top;
      }
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isClient) return <div className="interactive-bg-container pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"></div>;

  return (
    <div
      ref={containerRef}
      className="interactive-bg-container pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={glowOrbRef}
        className="glow-orb"
        style={{
          transform: isClient ? `translate(${initialWindow.width / 2 - 300}px, ${initialWindow.height / 2 - 300}px)` : 'translate(-300px, -300px)',
        }}
      />
      <div className="mesh-overlay" />

      {/* Small floating particles */}
      <div className="particles-container" ref={particlesRef}>
         {particles.map((p, i) => (
           <div
             key={i}
             className="particle"
             style={{
               left: p.left,
               top: p.top,
               animationDuration: p.duration,
               animationDelay: p.delay,
               opacity: p.opacity
             }}
           />
         ))}
      </div>
    </div>
  );
};
