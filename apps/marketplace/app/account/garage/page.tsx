import React from 'react';
import { Metadata } from 'next';
import { BuyerGarageView } from '../../../components/buyer-garage-view';
import { fetchBuyerAppointments, DEFAULT_BUYER_GARAGE_VEHICLES } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Appointments, Test Drives & Virtual Garage | Automotive OS',
  description:
    'Coordinate private showroom viewings, Dubai Autodrome track runs, and manage your authenticated digital collection under direct RTA title synchronization.',
};

export const dynamic = 'force-dynamic';

export default async function BuyerGaragePage() {
  const appointments = await fetchBuyerAppointments();

  return (
    <BuyerGarageView
      initialAppointments={appointments}
      initialGarageVehicles={DEFAULT_BUYER_GARAGE_VEHICLES}
    />
  );
}
