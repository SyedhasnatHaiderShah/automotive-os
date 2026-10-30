'use client';
import React, { useEffect, useState } from 'react';
import { Badge } from './badge';
import { Card } from './card';

export interface VehicleCardProps {
  id: string;
  slug: string;
  title: string;
  priceFils: string | number;
  currency?: string;
  year: number;
  mileageKm?: number | null;
  condition: string;
  gccSpec?: boolean | null;
  emirate: string;
  seller: {
    displayName: string;
    verified: boolean;
  };
  mediaUrl?: string | null;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  href?: string;
  locale?: 'en' | 'ar';
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  id,
  slug,
  title,
  priceFils,
  currency = 'AED',
  year,
  mileageKm,
  condition,
  gccSpec = false,
  emirate,
  seller,
  mediaUrl,
  isFavorite = false,
  onFavoriteToggle,
  href,
  locale = 'en',
}) => {
  const isArabic = locale === 'ar';
  const numericPrice = typeof priceFils === 'string' ? Number(priceFils) : priceFils;
  const majorAmount = Math.round(numericPrice / 100).toLocaleString('en-US');
  const formattedPrice = isArabic
    ? `${majorAmount} د.إ`
    : `${currency} ${majorAmount}`;

  const formattedMileage =
    mileageKm !== null && mileageKm !== undefined
      ? isArabic
        ? `${mileageKm.toLocaleString('en-US')} كم`
        : `${mileageKm.toLocaleString('en-US')} km`
      : isArabic
      ? 'جديدة كلياً'
      : 'Brand New';

  const [imageFailed, setImageFailed] = useState(!mediaUrl);
  useEffect(() => { setImageFailed(!mediaUrl); }, [mediaUrl]);

  const linkHref = href || `/cars/${slug}`;

  return (
    <Card
      variant="interactive"
      className="group flex flex-col h-full bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all rounded-lg overflow-hidden"
    >
      {/* Image Container with Badge Overlays */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-low">
        <a href={linkHref} className="block w-full h-full focus:outline-none">
          {imageFailed ? (
            <div role="img" aria-label={`Image unavailable for ${title}`} className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-container-high to-surface-container-lowest text-on-surface-variant">
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M5 17h14l-1.5-5h-11L5 17Z" /><path d="M8 12l2-4h4l2 4M7 17v2m10-2v2M8 15h.01M16 15h.01" />
              </svg>
              <span className="text-xs">Vehicle image not available</span>
            </div>
          ) : (
            <img
              src={mediaUrl || ''}
              onError={() => setImageFailed(true)}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
        </a>

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {seller.verified && (
              <Badge variant="verified">
                {isArabic ? 'وكيل معتمد' : 'Verified Dealer'}
              </Badge>
            )}
            {gccSpec && (
              <Badge variant="gcc">
                {isArabic ? 'خليجي' : 'GCC Spec'}
              </Badge>
            )}
          </div>

          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteToggle(id);
              }}
              aria-label={isFavorite ? 'Remove session favorite' : 'Save for this session'}
              title="Favorites are saved for this browser session until buyer sign-in is connected"
              className="pointer-events-auto w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 flex items-center justify-center text-on-surface hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              <svg
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isFavorite
                    ? 'fill-primary text-primary'
                    : 'fill-none stroke-current'
                }`}
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom Metadata Ribbon */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-on-surface/90 font-data-mono-num pointer-events-none drop-shadow-md">
          <span className="bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur-sm">
            {year}
          </span>
          <span className="bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur-sm">
            {formattedMileage}
          </span>
        </div>
      </div>

      {/* Body Dossier */}
      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-outline font-label-caps uppercase tracking-wider mb-1">
            <span>{emirate}</span>
            <span>•</span>
            <span className="text-secondary">{condition}</span>
          </div>

          <a href={linkHref} className="block group-hover:text-primary transition-colors">
            <h3 className="font-headline-sm text-base font-semibold text-on-surface line-clamp-1">
              {title}
            </h3>
          </a>
        </div>

        {/* Price & Dealership Provenance */}
        <div className="pt-2 border-t border-outline-variant/20 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-label-caps text-outline">
              {isArabic ? 'السعر النقدي' : 'Asking Price'}
            </span>
            <span className="font-data-currency-lg text-xl font-bold text-primary tracking-tight">
              {formattedPrice}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-xs font-medium text-on-surface line-clamp-1">
              {seller.displayName}
            </span>
            <span className="text-[11px] text-outline font-data-mono-num">
              {emirate}, UAE
            </span>
          </div>
        </div>

        {/* Card Footer Action */}
        <div className="pt-2">
          <a
            href={linkHref}
            className="w-full py-2 px-3 rounded bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>{isArabic ? 'عرض الملف ورقم الهيكل' : 'View Dossier & VIN'}</span>
            <svg
              className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 rtl:group-hover/btn:-translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </Card>
  );
};
