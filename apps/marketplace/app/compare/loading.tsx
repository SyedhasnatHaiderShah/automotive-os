import React from 'react';

export default function CompareLoading() {
  return (
    <div className="flex-1 bg-background text-on-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 animate-pulse">
        {/* Title and Controls shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 bg-surface-container-highest rounded-lg" />
            <div className="h-4 w-48 bg-surface-container-high rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-surface-container-high rounded-lg" />
            <div className="h-10 w-28 bg-surface-container-high rounded-lg" />
          </div>
        </div>

        {/* 4-Column Matrix Shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 bg-surface-container border border-outline-variant/30 rounded-xl p-4">
              <div className="aspect-[16/10] bg-surface-container-high rounded-lg" />
              <div className="h-5 w-3/4 bg-surface-container-highest rounded" />
              <div className="h-6 w-1/2 bg-primary-container/40 rounded" />
              <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                <div className="h-4 w-full bg-surface-container-high rounded" />
                <div className="h-4 w-5/6 bg-surface-container-high rounded" />
                <div className="h-4 w-2/3 bg-surface-container-high rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
