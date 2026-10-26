import React from 'react';

export default function DealerLoading() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Top Navigation Shimmer */}
      <div className="h-16 border-b border-outline-variant/30 bg-surface-container/60 backdrop-blur-md px-6 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-6 w-36 bg-surface-container-high rounded" />
          <div className="h-5 w-20 bg-surface-container-highest rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-surface-container-high" />
          <div className="h-8 w-28 bg-surface-container-high rounded-lg" />
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 animate-pulse">
        {/* Cockpit Headline Shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-surface-container-highest rounded-lg" />
            <div className="h-4 w-48 bg-surface-container-high rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-surface-container-high rounded-xl" />
            <div className="h-10 w-28 bg-primary/30 rounded-xl" />
          </div>
        </div>

        {/* 4 KPI Cards Shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container border border-outline-variant/30 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-surface-container-high rounded" />
                <div className="h-6 w-6 bg-surface-container-highest rounded" />
              </div>
              <div className="h-8 w-32 bg-surface-container-highest rounded-lg" />
              <div className="h-3 w-20 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>

        {/* Data Table Shimmer */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
            <div className="h-6 w-40 bg-surface-container-highest rounded" />
            <div className="h-8 w-36 bg-surface-container-high rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-surface-container-high/60 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
