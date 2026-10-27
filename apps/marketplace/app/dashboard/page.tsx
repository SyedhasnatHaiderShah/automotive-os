'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardResolverPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Resolving session and access privileges...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolvePostAuthDestination() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ao_token') : null;

        const headers: HeadersInit = {
          Accept: 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/v1/auth/me', {
          method: 'GET',
          headers,
          credentials: 'include', // Sends ao_session HTTP-only cookie
        });

        if (res.status === 401 || res.status === 403) {
          // Check if disabled
          const data = await res.json().catch(() => ({}));
          if (data?.message?.includes('ACCOUNT_DISABLED') || data?.error?.message?.includes('ACCOUNT_DISABLED')) {
            router.replace('/access-denied?reason=disabled');
            return;
          }
          // Not logged in
          router.replace('/auth?tab=login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to resolve session: HTTP ${res.status}`);
        }

        const user = await res.json();

        // 1. Check account suspension
        if (user.status === 'SUSPENDED') {
          router.replace('/access-suspended');
          return;
        }

        // 2. Check account disablement
        if (user.status === 'DISABLED') {
          router.replace('/access-denied?reason=disabled');
          return;
        }

        // 3. Platform Administrator
        if (user.isPlatformAdmin) {
          setStatusText('Authorizing Platform Administrator Console...');
          router.replace('/admin');
          return;
        }

        // 4. Dealership Staff
        const activeMembership = user.memberships?.find((m: any) => m.active);
        if (activeMembership) {
          if (activeMembership.tenantStatus !== 'ACTIVE') {
            router.replace('/access-suspended?reason=tenant_suspended');
            return;
          }
          setStatusText(`Loading Dealership Console (${activeMembership.tenantName || 'Dealer Desk'})...`);
          router.replace('/dealer');
          return;
        }

        // 5. Retail Buyer / Private Collector
        setStatusText('Loading Private Garage & Dossier...');
        router.replace('/account/garage');
      } catch (err: any) {
        console.error('Session resolution failed:', err);
        setError(err.message || 'Session resolution error');
        setTimeout(() => {
          router.replace('/auth?tab=login');
        }, 2000);
      }
    }

    resolvePostAuthDestination();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-[#121824] border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#997d25] flex items-center justify-center mx-auto mb-6 text-black shadow-lg shadow-[#d4af37]/20 animate-pulse">
          <Shield className="w-8 h-8 fill-current" />
        </div>

        <h1 className="text-xl font-heading font-bold text-white mb-2">
          Automotive OS
        </h1>

        {error ? (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
            <p className="text-sm font-mono text-gray-400">{statusText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
