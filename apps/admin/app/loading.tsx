import React from 'react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar shimmer */}
      <div className="hidden lg:flex w-64 border-r border-outline-variant/30 bg-surface-container-lowest/60 p-6 flex-col gap-6 animate-pulse">
        <div className="h-8 w-40 bg-surface-container-high rounded" />
        <div className="space-y-3 pt-6">
          <div className="h-10 w-full bg-surface-container-high rounded-xl" />
          <div className="h-10 w-full bg-surface-container rounded-xl" />
          <div className="h-10 w-full bg-surface-container rounded-xl" />
          <div className="h-10 w-full bg-surface-container rounded-xl" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header shimmer */}
        <div className="h-16 border-b border-outline-variant/30 bg-surface-container-lowest/40 px-6 flex items-center justify-between animate-pulse">
          <div className="h-6 w-48 bg-surface-container-high rounded" />
          <div className="flex gap-3">
            <div className="h-8 w-24 bg-surface-container-high rounded-full" />
            <div className="h-8 w-8 bg-surface-container-high rounded-full" />
          </div>
        </div>

        <main className="flex-1 p-6 sm:p-8 flex flex-col gap-6 animate-pulse">
          {/* Top Banner shimmer */}
          <div className="h-28 bg-surface-container border border-outline-variant/30 rounded-2xl p-6" />

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container border border-outline-variant/30 rounded-xl p-4" />
            ))}
          </div>

          {/* Triage / Verification Queue Shimmer */}
          <div className="h-64 bg-surface-container border border-outline-variant/30 rounded-2xl p-6" />
        </main>
      </div>
    </div>
  );
}
