'use client';

import React, { useRef, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';
import { RollingCounter } from './rolling.counter';
import { MilestoneExplosion } from './milestone.explosion';

type OverviewResponse = {
  publishedCount: number;
  queuedCount: number;
  activeChannels: number;
};

const useWarpDriveOverview = () => {
  const fetch = useFetch();
  return useSWR<OverviewResponse>(
    '/analytics/overview',
    async (url: string) => {
      const res = await fetch(url);
      return res.json();
    },
    { refreshInterval: 30000 }
  );
};

export const WarpDriveDashboard = () => {
  const { data } = useWarpDriveOverview();
  const [explosionActive, setExplosionActive] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const published = data?.publishedCount || 0;
  const queued = data?.queuedCount || 0;
  const channels = data?.activeChannels || 0;

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-br from-[#050505] to-[#1a1a1a] flex flex-col items-center justify-center font-sans overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

      {explosionActive && (
        <MilestoneExplosion x={0} y={0} onComplete={() => setExplosionActive(false)} />
      )}

      <div className="z-10 text-center mb-16">
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          WARP DRIVE
        </h1>
        <p className="text-gray-400 font-mono text-sm tracking-widest">
          WORKSPACE PUBLISHING METRICS • AUTO-REFRESHES EVERY 30S
        </p>
      </div>

      <div className="flex gap-12 z-10 scale-110" ref={targetRef}>
        <RollingCounter value={published} label="Published Posts" color="#38bdf8" />
        <RollingCounter value={queued} label="Queued Posts" color="#a855f7" />
        <RollingCounter value={channels} label="Active Channels" color="#ec4899" />
      </div>

      <div className="absolute bottom-8 left-8 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
        <span className="text-xs text-gray-500 font-mono tracking-wider">WORKSPACE ANALYTICS SYNCED</span>
      </div>
    </div>
  );
};
