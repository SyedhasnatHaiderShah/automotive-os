import React from 'react';

export const VehicleCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[16/10] w-full bg-surface-container-high" />
      <div className="p-4 flex flex-col justify-between gap-4 flex-1">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-surface-container-highest rounded" />
          <div className="h-5 w-3/4 bg-surface-container-highest rounded" />
        </div>
        <div className="pt-2 border-t border-outline-variant/20 flex items-end justify-between">
          <div className="h-6 w-24 bg-surface-container-highest rounded" />
          <div className="h-4 w-28 bg-surface-container-highest rounded" />
        </div>
      </div>
    </div>
  );
};

export const VehicleGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
};
