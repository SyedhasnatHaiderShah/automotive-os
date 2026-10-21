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
      title: 'VIP Viewing Allocation | Automotive OS',
      description: 'Book private viewing and test drive.',
    };
  }

  return {
    title: `VIP Allocation Protocol — ${vehicle.title} | Automotive OS`,
    description: `Schedule private viewing and dynamic track session for ${vehicle.title} at Dubai Autodrome or Apex Collector Vault.`,
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
