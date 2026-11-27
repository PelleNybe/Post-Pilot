
'use client';

import React, { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

interface RollingCounterProps {
  value: number;
  label: string;
  color: string;
}

export const RollingCounter: React.FC<RollingCounterProps> = ({ value, label, color }) => {
  const digits = value.toString().padStart(5, '0').split('');
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#111] border border-[#222] rounded-2xl shadow-2xl relative overflow-hidden group">
      <div
        className="absolute w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-3xl rounded-full mix-blend-screen"
        style={{ backgroundColor: color }}
      />

      <div className="text-gray-400 uppercase tracking-[0.3em] text-xs mb-6 font-semibold z-10">
        {label}
      </div>

      <div className="flex gap-2 z-10">
        {digits.map((digit, index) => (
          <DigitColumn key={index} digit={digit} color={color} />
        ))}
      </div>
    </div>
  );
};

const DigitColumn: React.FC<{ digit: string; color: string }> = ({ digit, color }) => {
  return (
    <div
      className="h-[120px] w-[80px] bg-black border border-[#333] rounded-lg overflow-hidden relative"
      style={{ boxShadow: `0 0 15px ${color}33 inset` }}
    >
      <div className="absolute w-full h-[30%] top-0 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute w-full h-[30%] bottom-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

      <div
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform font-mono text-[90px] font-bold text-center leading-[120px]"
        style={{
          transform: `translateY(-${parseInt(digit) * 120}px)`,
          textShadow: `0 0 20px ${color}`
        }}
      >
        {['0','1','2','3','4','5','6','7','8','9'].map((num) => (
          <div key={num} className="h-[120px] flex items-center justify-center text-white">
            {num}
          </div>
        ))}
      </div>
    </div>
  );
};
