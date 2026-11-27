
'use client';

import React, { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  type: 'square' | 'circle' | 'line';
}

export const MilestoneExplosion: React.FC<{
  onComplete: () => void;
  x: number;
  y: number;
}> = ({ onComplete, x, y }) => {
  const [particles, setParticles] = useState<Confetti[]>([]);

  useEffect(() => {
    const colors = ['#fde047', '#38bdf8', '#a855f7', '#ec4899', '#4ade80'];
    const newParticles: Confetti[] = Array.from({ length: 150 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 200;

      return {
        id: i,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 10,
        rotation: Math.random() * 720,
        delay: Math.random() * 0.2,
        duration: 1 + Math.random() * 1.5,
        type: ['square', 'circle', 'line'][Math.floor(Math.random() * 3)] as any,
      };
    });

    setParticles(newParticles);
    const timer = setTimeout(() => onComplete(), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute origin-center"
          style={{
            left: x,
            top: y,
            width: p.size,
            height: p.type === 'line' ? p.size * 3 : p.size,
            backgroundColor: p.color,
            borderRadius: p.type === 'circle' ? '50%' : '2px',
            opacity: 0,
            animation: `explode ${p.duration}s cubic-bezier(0.25, 1, 0.5, 1) ${p.delay}s forwards`,
            '--tx': `${p.x}px`,
            '--ty': `${p.y + 100}px`,
            '--rot': `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes explode {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
