import React from 'react';
import { VehicleGridSkeleton } from '@automotive-os/ui';

export default function MarketplaceLoading() {
  return (
    <div className="flex-1 bg-background text-on-surface">
      {/* Header Bar shimmer */}
      <div className="h-16 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between animate-pulse">
        <div className="h-6 w-40 bg-surface-container-high rounded" />
        <div className="flex gap-4">
          <div className="h-8 w-24 bg-surface-container-high rounded-full" />
          <div className="h-8 w-20 bg-surface-container-high rounded-full" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Hero skeleton */}
        <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 p-8 sm:p-12 animate-pulse">
          <div className="max-w-2xl flex flex-col gap-4">
            <div className="h-4 w-32 bg-primary-container/40 rounded-full" />
            <div className="h-10 sm:h-12 w-3/4 bg-surface-container-highest rounded-lg" />
            <div className="h-4 w-5/6 bg-surface-container-high rounded" />
            <div className="h-14 w-full max-w-lg bg-surface-container-highest rounded-xl mt-4" />
          </div>
        </div>

        {/* Section title skeleton */}
        <div className="flex items-center justify-between pt-4">
          <div className="h-6 w-48 bg-surface-container-high rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
        </div>

        {/* Vehicle Grid Skeleton */}
        <VehicleGridSkeleton count={6} />
      </main>
    </div>
  );
}
