import React from 'react';

export default function ListingDetailLoading() {
  return (
    <div className="flex-1 bg-background text-on-surface">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 animate-pulse">
        {/* Breadcrumb shimmer */}
        <div className="h-4 w-48 bg-surface-container-high rounded" />

        {/* Top Hero and Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Main 16:10 Image */}
            <div className="aspect-[16/10] w-full bg-surface-container-high rounded-2xl overflow-hidden" />
            {/* Thumbnail Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-[16/10] bg-surface-container rounded-lg" />
              <div className="aspect-[16/10] bg-surface-container rounded-lg" />
              <div className="aspect-[16/10] bg-surface-container rounded-lg" />
              <div className="aspect-[16/10] bg-surface-container rounded-lg" />
            </div>
          </div>

          {/* Pricing & Acquisition Card Skeleton */}
          <div className="flex flex-col gap-6 bg-surface-container border border-outline-variant/30 rounded-2xl p-6 h-fit">
            <div className="flex justify-between items-start">
              <div className="h-6 w-24 bg-surface-container-highest rounded-full" />
              <div className="h-6 w-20 bg-surface-container-highest rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-3/4 bg-surface-container-highest rounded-lg" />
              <div className="h-4 w-1/2 bg-surface-container-high rounded" />
            </div>
            <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
              <div className="h-4 w-20 bg-surface-container-high rounded" />
              <div className="h-10 w-44 bg-primary-container/40 rounded-lg" />
            </div>
            <div className="h-12 w-full bg-surface-container-highest rounded-xl mt-4" />
          </div>
        </div>

        {/* Spec Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="h-20 bg-surface-container rounded-xl" />
          <div className="h-20 bg-surface-container rounded-xl" />
          <div className="h-20 bg-surface-container rounded-xl" />
          <div className="h-20 bg-surface-container rounded-xl" />
        </div>
      </main>
    </div>
  );
}
