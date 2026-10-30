'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicListingDetail } from '../../../../lib/api';
import { VipEnquiryModal } from '../../../../components/vip-enquiry-modal';

export interface EnquiryViewProps {
  vehicle: PublicListingDetail;
}

export const EnquiryView: React.FC<EnquiryViewProps> = ({ vehicle }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = `/cars/${vehicle.slug}`;
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-on-surface flex flex-col justify-center items-center overflow-x-hidden">
      {/* Vehicle Context Canvas Behind the Scrim */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: vehicle.media[0]?.url ? `url('${vehicle.media[0].url}')` : undefined,
          }}
        />
        <div className="absolute inset-0 bg-surface-container-lowest/85 backdrop-blur-2xl" />
        <div className="absolute -top-40 right-1/4 w-96 h-96 rounded-full bg-primary-container/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-secondary-container/10 blur-[120px] pointer-events-none" />
      </div>

      {/* Top Context Navigation */}
      <div className="relative z-10 w-full max-w-4xl px-4 pt-6 pb-2 flex items-center justify-between text-on-surface-variant">
        <Link
          href={`/cars/${vehicle.slug}`}
          className="flex items-center gap-1.5 font-body-sm text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to {vehicle.title}</span>
        </Link>
      </div>

      {/* Main VIP Flow */}
      <div className="relative z-10 w-full flex justify-center p-3 sm:p-4">
        <VipEnquiryModal
          vehicle={vehicle}
          isOpen={isOpen}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};
