import React from 'react';
import { VehicleGridSkeleton } from '@automotive-os/ui';

export default function CarsLoading() {
  return (
    <div className="flex-1 bg-background text-on-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Breadcrumb / Title shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-28 bg-surface-container-high rounded" />
            <div className="h-8 w-64 bg-surface-container-highest rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-surface-container-high rounded-lg" />
            <div className="h-10 w-28 bg-surface-container-high rounded-lg" />
          </div>
        </div>

        {/* Layout with sidebar and vehicle grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Facet filter rail skeleton */}
          <div className="hidden lg:flex flex-col gap-6 bg-surface-container border border-outline-variant/30 rounded-xl p-6 h-fit animate-pulse">
            <div className="h-5 w-32 bg-surface-container-highest rounded" />
            <div className="space-y-4 pt-2">
              <div className="h-10 w-full bg-surface-container-highest rounded-md" />
              <div className="h-10 w-full bg-surface-container-highest rounded-md" />
              <div className="h-10 w-full bg-surface-container-highest rounded-md" />
              <div className="h-10 w-full bg-surface-container-highest rounded-md" />
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="lg:col-span-3">
            <VehicleGridSkeleton count={6} />
          </div>
        </div>
      </main>
    </div>
  );
}
