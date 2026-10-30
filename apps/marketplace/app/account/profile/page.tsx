import React from 'react';
import type { Metadata } from 'next';
import { BuyerProfileView } from '../../../components/buyer-profile-view';
import { fetchBuyerProfileData } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Buyer Profile & Privacy | Automotive OS',
  description: 'Manage your buying preferences and the contact details you have shared with dealers.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerProfilePage() {
  const profileData = await withBuyerSession('/account/profile', fetchBuyerProfileData);

  return <BuyerProfileView initialProfile={profileData} />;
}
