import React from 'react';
import { Metadata } from 'next';
import { BuyerGarageView } from '../../../components/buyer-garage-view';
import { fetchBuyerAppointments } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Appointments, Test Drives & Virtual Garage | Automotive OS',
  description:
    'Coordinate private showroom viewings, Dubai Autodrome track runs, and manage your authenticated digital collection under direct RTA title synchronization.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerGaragePage() {
  const appointments = await withBuyerSession('/account/garage', fetchBuyerAppointments);

  return (
    <BuyerGarageView
      initialAppointments={appointments}
      // No owned-vehicle (garage) API exists yet; show an empty garage, not demo cars.
      initialGarageVehicles={[]}
    />
  );
}
