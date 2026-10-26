import React from 'react';

export default function AccountLoading() {
  return (
    <div className="flex-1 bg-background text-on-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 animate-pulse">
        {/* Account header shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high" />
            <div className="flex flex-col gap-2">
              <div className="h-6 w-48 bg-surface-container-highest rounded" />
              <div className="h-4 w-32 bg-surface-container-high rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
            <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
          </div>
        </div>

        {/* Account tab content shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="h-28 bg-surface-container rounded-xl p-4" />
            <div className="h-28 bg-surface-container rounded-xl p-4" />
            <div className="h-28 bg-surface-container rounded-xl p-4" />
          </div>
          <div className="h-64 bg-surface-container rounded-xl p-4" />
        </div>
      </main>
    </div>
  );
}
