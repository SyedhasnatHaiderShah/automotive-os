import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { fetchPublicListingBySlug } from '../../../lib/api';

// PF-04: generateMetadata and the page share one fetch per request.
const load = cache(fetchPublicListingBySlug);
import { VehicleDetailView } from '../../../components/vehicle-detail-view';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await load(slug);

  if (!vehicle) {
    return {
      title: 'Vehicle not found | Automotive OS',
      description: 'This vehicle listing is not available.',
    };
  }

  const priceAed = (Number(vehicle.price.amountFils) / 100).toLocaleString('en-US');

  const summary =
    vehicle.description ||
    `${vehicle.year} ${vehicle.makeName} ${vehicle.modelName} in ${vehicle.emirate}, listed by ${vehicle.seller.displayName}.`;

  return {
    title: `${vehicle.title} — AED ${priceAed} | Automotive OS`,
    description: summary,
    openGraph: {
      title: `${vehicle.title} — AED ${priceAed}`,
      description: `${vehicle.gccSpec ? 'GCC specification. ' : ''}Located in ${vehicle.emirate}. Listed by ${vehicle.seller.displayName}.`,
      images: vehicle.media[0]?.url ? [vehicle.media[0].url] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await load(slug);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailView vehicle={vehicle} />;
}
