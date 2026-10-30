import React from 'react';
import type { Metadata } from 'next';
import { fetchBuyerEnquiries, fetchBuyerMe } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';
import { BuyerEnquiriesView } from '../../../components/buyer-enquiries-view';

export const metadata: Metadata = {
  title: 'My Enquiries | Automotive OS',
  description: 'Track the status of your vehicle enquiries and the contact details you shared with dealers.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerEnquiriesPage() {
  const [enquiries, me] = await withBuyerSession('/account/enquiries', (token) =>
    Promise.all([fetchBuyerEnquiries(token), fetchBuyerMe(token)])
  );

  return <BuyerEnquiriesView initialEnquiries={enquiries} displayName={me.displayName} />;
}
