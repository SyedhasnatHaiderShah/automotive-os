import React from 'react';
import type { Metadata } from 'next';
import { fetchBuyerEnquiries } from '../../../lib/api';
import { BuyerEnquiriesView } from '../../../components/buyer-enquiries-view';

export const metadata: Metadata = {
  title: 'Institutional Enquiry Timeline & Allocation Tracking | Automotive OS',
  description:
    'Monitor live dealership responses, Tasjeel inspection booking milestones, escrow deposits, and immutable RTA title release records with shielded buyer privacy.',
};

export default async function BuyerEnquiriesPage() {
  const enquiries = await fetchBuyerEnquiries();

  return <BuyerEnquiriesView initialEnquiries={enquiries} />;
}
