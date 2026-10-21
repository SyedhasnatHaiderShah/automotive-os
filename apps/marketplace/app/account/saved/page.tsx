import React from 'react';
import { Metadata } from 'next';
import { BuyerSavedView } from '../../../components/buyer-saved-view';
import { fetchSavedRadars, fetchSavedFavorites } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Saved Searches & Vehicle Favorites | Automotive OS',
  description:
    'Real-time surveillance of certified UAE dealership allocations, GCC price shifts, and instant WhatsApp/SMS match notifications.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerSavedPage() {
  const [radars, favorites] = await Promise.all([
    fetchSavedRadars(),
    fetchSavedFavorites(),
  ]);

  return (
    <BuyerSavedView
      initialRadars={radars}
      initialFavorites={favorites}
    />
  );
}
