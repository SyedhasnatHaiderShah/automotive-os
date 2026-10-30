import React from 'react';
import type { Metadata } from 'next';
import { BuyerGarageView } from '../../../components/buyer-garage-view';
import { fetchBuyerAppointments, fetchBuyerMe } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Appointments & Test Drives | Automotive OS',
  description: 'View, reschedule or cancel your showroom appointments and test drives.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerGaragePage() {
  const [appointments, me] = await withBuyerSession('/account/garage', (token) =>
    Promise.all([fetchBuyerAppointments(token), fetchBuyerMe(token)])
  );

  return <BuyerGarageView initialAppointments={appointments} displayName={me.displayName} />;
}
