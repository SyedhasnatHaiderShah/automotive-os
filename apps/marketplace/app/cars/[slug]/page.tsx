import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicListingBySlug } from '../../../lib/api';
import { VehicleDetailView } from '../../../components/vehicle-detail-view';

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
      title: 'Vehicle Dossier | Automotive OS',
      description: 'Verified dealership automotive exchange.',
    };
  }

  const priceAed = (Number(vehicle.price.amountFils) / 100).toLocaleString('en-US');

  return {
    title: `${vehicle.title} — AED ${priceAed} | Automotive OS`,
    description:
      vehicle.description ||
      `Certified ${vehicle.year} ${vehicle.makeName} ${vehicle.modelName} in ${vehicle.emirate}, UAE. Inspected and verified by ${vehicle.seller.displayName}.`,
    openGraph: {
      title: `${vehicle.title} — AED ${priceAed}`,
      description: `GCC official spec with Tasjeel certification. Located in ${vehicle.emirate}.`,
      images: vehicle.media[0]?.url ? [vehicle.media[0].url] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await fetchPublicListingBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailView vehicle={vehicle} />;
}
