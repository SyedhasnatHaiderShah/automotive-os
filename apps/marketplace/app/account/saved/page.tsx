import React from 'react';
import type { Metadata } from 'next';
import { BuyerSavedView } from '../../../components/buyer-saved-view';
import { fetchSavedSearches, fetchFavorites, fetchBuyerMe } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Saved Searches & Favorites | Automotive OS',
  description: 'Your saved vehicle searches and favorite listings.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerSavedPage() {
  const [searches, favorites, me] = await withBuyerSession('/account/saved', (token) =>
    Promise.all([fetchSavedSearches(token), fetchFavorites(token), fetchBuyerMe(token)])
  );

  return (
    <BuyerSavedView
      initialSearches={searches}
      initialFavorites={favorites}
      displayName={me.displayName}
    />
  );
}
