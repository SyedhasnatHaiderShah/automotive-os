import React from 'react';
import { Metadata } from 'next';
import { BuyerProfileView } from '../../../components/buyer-profile-view';
import { fetchBuyerProfileData } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Buyer Profile & Privacy Protocols | Automotive OS',
  description:
    'Sovereign collector identity, verified credentials, regional preferences, and zero-knowledge dealer data disclosure matrix under UAE Personal Data Protection Law (Federal Decree-Law No. 45/2021).',
};

export const dynamic = 'force-dynamic';

export default async function BuyerProfilePage() {
  const profileData = await withBuyerSession('/account/profile', fetchBuyerProfileData);

  return <BuyerProfileView initialProfile={profileData} />;
}
