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

  // Throwing here (before the page streams) lets Next send a real 404 status
  // instead of a 200 with not-found UI (QA-POST-02).
  if (!dealer) notFound();

  const liveStock = dealer.stats.liveGroundedStock;
  // No branch on file means no known location; never guess one (QA-POST-03).
  const emirate = dealer.branches[0]?.emirate;
  const location = emirate ? `${emirate}, UAE` : 'UAE';

  return {
    title: `${dealer.displayName} — Dealership Storefront (${location}) | Automotive OS`,
    description:
      dealer.description ||
      `Dealership profile for ${dealer.displayName} in ${location}. Browse ${liveStock} published vehicle listings.`,
    openGraph: {
      title: `${dealer.displayName} | Automotive OS`,
      description: `Showroom in ${location}. ${dealer.tagline || ''}`.trim(),
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
