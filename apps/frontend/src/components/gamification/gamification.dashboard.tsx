'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';

type OverviewResponse = {
  publishedCount: number;
  queuedCount: number;
  draftCount: number;
  totalPosts: number;
  activeChannels: number;
  topics: { id: string; label: string; count: number }[];
};

const useGamificationOverview = () => {
  const fetch = useFetch();
  return useSWR<OverviewResponse>('/analytics/overview', async (url: string) => {
    const res = await fetch(url);
    return res.json();
  });
};

export const GamificationDashboard = () => {
  const { data } = useGamificationOverview();

  const stats = useMemo(() => {
    const published = data?.publishedCount || 0;
    const queued = data?.queuedCount || 0;
    const channels = data?.activeChannels || 0;
    const totalXp = published * 100 + queued * 25 + channels * 50;
    const level = Math.floor(totalXp / 500) + 1;
    const xpProgress = Math.round(((totalXp % 500) / 500) * 100);
    return { published, queued, channels, totalXp, level, xpProgress };
  }, [data]);

  const achievements = useMemo(
    () => [
      { icon: '🚀', title: 'First Launch', desc: '1+ Published Post', unlocked: stats.published >= 1 },
      { icon: '🔥', title: 'Consistent Creator', desc: '10+ Published Posts', unlocked: stats.published >= 10 },
      { icon: '📡', title: 'Omnichannel', desc: '3+ Active Channels', unlocked: stats.channels >= 3 },
      { icon: '🏷️', title: 'Topic Strategist', desc: '5+ Post Tags', unlocked: (data?.topics?.length || 0) >= 5 },
    ],
    [stats, data]
  );

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] bg-[#0A0A0A] p-8 font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase">
            Creator Arena
          </h1>
          <p className="text-gray-400 font-mono tracking-widest mt-2 uppercase text-sm">
            Level {stats.level} Workspace
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gradient-to-b from-[#1a1a1a] to-[#111] border-2 border-orange-500/30 rounded-3xl p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-orange-500 p-1 mb-6 relative">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-red-600 flex items-center justify-center text-4xl">
                  👑
                </div>
                <div className="absolute -bottom-2 -right-2 bg-black text-white font-black px-3 py-1 rounded-full border-2 border-orange-500 font-mono">
                  Lvl {stats.level}
                </div>
              </div>

              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                {stats.totalXp.toLocaleString()} XP
              </h2>
              <p className="text-orange-400 font-mono text-xs uppercase tracking-widest mb-8">
                Publishing Activity Score
              </p>

              <div className="w-full">
                <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                  <span>PROGRESS TO LVL {stats.level + 1}</span>
                  <span>{stats.xpProgress}%</span>
                </div>
                <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/20 border-orange-500/50'
                      : 'bg-[#111] border-gray-800 opacity-50 grayscale'
                  } flex flex-col items-center text-center`}
                >
                  <span className="text-3xl mb-2">{ach.icon}</span>
                  <h3 className="text-white font-bold text-sm">{ach.title}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">{ach.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#151515] border border-gray-800 rounded-3xl p-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-500">🏆</span> Workspace Breakdown
                </h3>
                <span className="text-xs font-mono bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                  {stats.channels} ACTIVE CHANNELS
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Published Posts (+100 XP each)', count: stats.published, xp: stats.published * 100 },
                  { label: 'Queued Posts (+25 XP each)', count: stats.queued, xp: stats.queued * 25 },
                  { label: 'Active Channels (+50 XP each)', count: stats.channels, xp: stats.channels * 50 },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a]"
                  >
                    <span className="font-bold text-gray-200">{row.label}</span>
                    <div className="flex items-center gap-6 font-mono">
                      <span className="text-gray-400">{row.count}</span>
                      <span className="text-orange-400">+{row.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
