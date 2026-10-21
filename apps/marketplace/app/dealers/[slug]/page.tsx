import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPublicDealerBySlug } from '../../../lib/api';
import { DealerStorefrontView } from '../../../components/dealer-storefront-view';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await fetchPublicDealerBySlug(slug);

  if (!dealer) {
    return {
      title: 'Dealership Storefront | Automotive OS',
      description: 'Verified UAE luxury automotive dealership exchange.',
    };
  }

  const liveStock = dealer.stats.liveGroundedStock;
  const emirate = dealer.branches[0]?.emirate || 'Dubai';

  return {
    title: `${dealer.displayName} — Verified Dealership Storefront (${emirate}, UAE) | Automotive OS`,
    description:
      dealer.description ||
      `Official verified dealership profile for ${dealer.displayName}. Browse ${liveStock} grounded luxury and collector vehicles with RTA Tasjeel and Escrow protection.`,
    openGraph: {
      title: `${dealer.displayName} | Automotive OS`,
      description: `Verified showroom in ${emirate}, UAE. ${dealer.tagline || ''}`,
    },
  };
}

export default async function DealerStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const dealer = await fetchPublicDealerBySlug(slug);

  if (!dealer) {
    notFound();
  }

  return <DealerStorefrontView dealer={dealer} />;
}
