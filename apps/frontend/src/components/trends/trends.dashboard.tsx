'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';

type OverviewTopic = {
  id: string;
  label: string;
  count: number;
};

type OverviewResponse = {
  publishedCount: number;
  queuedCount: number;
  draftCount: number;
  totalPosts: number;
  activeChannels: number;
  topics: OverviewTopic[];
};

const useAnalyticsOverview = () => {
  const fetch = useFetch();
  return useSWR<OverviewResponse>('/analytics/overview', async (url: string) => {
    const res = await fetch(url);
    return res.json();
  });
};

export const TrendsDashboard = () => {
  const { data, isLoading } = useAnalyticsOverview();
  const router = useRouter();

  const nodes = useMemo(() => {
    const topics = data?.topics || [];
    const maxCount = Math.max(1, ...topics.map((t) => t.count));
    return topics.map((topic, index) => {
      const angle = (index / Math.max(1, topics.length)) * Math.PI * 2;
      const radius = 28;
      return {
        id: topic.id,
        label: topic.label,
        count: topic.count,
        size: 52 + Math.round((topic.count / maxCount) * 44),
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        share: Math.round((topic.count / Math.max(1, data?.totalPosts || 1)) * 100),
      };
    });
  }, [data]);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-[#050505] overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] z-0" />

      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
          TREND SPHERE
        </h1>
        <p className="text-gray-400 font-mono text-sm tracking-widest mt-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" /> WORKSPACE TOPIC FREQUENCY
        </p>
      </div>

      <div className="absolute inset-0 z-20 pr-80 flex items-center justify-center">
        {isLoading ? (
          <p className="text-gray-400 font-mono text-sm">Loading workspace topics...</p>
        ) : nodes.length === 0 ? (
          <div className="text-center max-w-md px-6">
            <p className="text-white text-lg font-semibold mb-2">No topic tags recorded yet</p>
            <p className="text-gray-400 text-sm">
              Tag posts in your workspace calendar to visualize your top performing themes here.
            </p>
          </div>
        ) : (
          <>
            <svg className="w-full h-full opacity-30">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#e879f9" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {nodes.map((n1, i) =>
                nodes.slice(i + 1).map((n2) => {
                  const distance = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                  if (distance > 45) return null;
                  return (
                    <line
                      key={`${n1.id}-${n2.id}`}
                      x1={`${n1.x}%`}
                      y1={`${n1.y}%`}
                      x2={`${n2.x}%`}
                      y2={`${n2.y}%`}
                      stroke="url(#lineGrad)"
                      strokeWidth={Math.max(0.5, 3 - distance / 15)}
                    />
                  );
                })
              )}
            </svg>
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute rounded-full flex flex-col items-center justify-center font-bold transition-transform hover:scale-110 group border bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(34,211,238,0.4)] border-cyan-300 text-white"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: `${node.size}px`,
                  height: `${node.size}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-center px-2 truncate w-full text-xs">{node.label}</span>
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-black/90 border border-gray-700 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 text-xs">
                  {node.count} posts ({node.share}%)
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="absolute right-8 top-8 bottom-8 w-80 bg-[#111]/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 z-30 flex flex-col shadow-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-800 pb-4 text-white">
          <span className="text-cyan-400">⚡</span> Top Workspace Topics
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-mono">
          {nodes.map((node, i) => (
            <div key={node.id} className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-200">{node.label}</span>
                <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
                  {node.count} posts
                </span>
              </div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Share: {node.share}%</span>
                <span>#{i + 1} Tag</span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.push('/launches')}
          aria-label="Open Launches Calendar"
          className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl border border-gray-700 transition-all font-mono text-sm"
        >
          Schedule Post in Launches
        </button>
      </div>
    </div>
  );
};
