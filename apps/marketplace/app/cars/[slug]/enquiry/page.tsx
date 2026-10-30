import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicListingBySlug } from '../../../../lib/api';
import { EnquiryView } from './enquiry-view';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await fetchPublicListingBySlug(slug);

  if (!vehicle) {
    return {
      title: 'Enquire about a vehicle | Automotive OS',
      description: 'Send an enquiry or request a viewing with the listing dealer.',
    };
  }

  return {
    title: `Enquire — ${vehicle.title} | Automotive OS`,
    description: `Send an enquiry or request a viewing for ${vehicle.title} with ${vehicle.seller.displayName}.`,
  };
}

export default async function VehicleEnquiryPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await fetchPublicListingBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  return <EnquiryView vehicle={vehicle} />;
}
