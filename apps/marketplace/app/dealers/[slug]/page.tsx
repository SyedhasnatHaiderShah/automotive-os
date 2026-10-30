import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { fetchPublicDealerBySlug } from '../../../lib/api';

// PF-04: generateMetadata and the page share one fetch per request.
const load = cache(fetchPublicDealerBySlug);
import { DealerStorefrontView } from '../../../components/dealer-storefront-view';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await load(slug);

  if (!dealer) {
    return {
      title: 'Dealership not found | Automotive OS',
      description: 'This dealership storefront is not available.',
    };
  }

  const liveStock = dealer.stats.liveGroundedStock;
  const emirate = dealer.branches[0]?.emirate || 'Dubai';

  return {
    title: `${dealer.displayName} — Dealership Storefront (${emirate}, UAE) | Automotive OS`,
    description:
      dealer.description ||
      `Dealership profile for ${dealer.displayName} in ${emirate}. Browse ${liveStock} published vehicle listings.`,
    openGraph: {
      title: `${dealer.displayName} | Automotive OS`,
      description: `Showroom in ${emirate}, UAE. ${dealer.tagline || ''}`.trim(),
    },
  };
}

export default async function DealerStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const dealer = await load(slug);

  if (!dealer) {
    notFound();
  }

  return <DealerStorefrontView dealer={dealer} />;
}
