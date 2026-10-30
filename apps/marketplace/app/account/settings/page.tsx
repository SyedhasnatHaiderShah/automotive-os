import React from 'react';
import type { Metadata } from 'next';
import { AccountSettingsView } from '../../../components/account-settings-view';
import { fetchAccountSettings } from '../../../lib/api';
import { withBuyerSession } from '../../../lib/server-session';

export const metadata: Metadata = {
  title: 'Account Settings | Automotive OS',
  description: 'Manage your display name, communication preferences and active session.',
};

export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const settings = await withBuyerSession('/account/settings', fetchAccountSettings);

  return <AccountSettingsView initialSettings={settings} />;
}
