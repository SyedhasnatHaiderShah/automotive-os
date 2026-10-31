'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldX, ArrowLeft } from 'lucide-react';

function AccessDeniedPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const isDisabled = reason === 'disabled';

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg bg-[#121824] border border-red-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 text-red-400 shadow-lg shadow-red-500/10">
          <ShieldX className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mb-3">
          {isDisabled ? 'Account Permanently Disabled' : '403 Forbidden Access'}
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          {isDisabled ? (
            <>
              This account has been permanently disabled by platform security administration. 
              All active sessions and tokens have been revoked.
            </>
          ) : (
            <>
              You do not have the required role privileges or active dealership membership 
              to access this protected resource.
            </>
          )}
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-gray-300 text-left mb-8 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Error:</span>
            <span className="text-red-400 font-bold">{isDisabled ? 'ACCOUNT_DISABLED' : 'INSUFFICIENT_ROLE_PERMISSIONS'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Security Gate:</span>
            <span>Defense-in-Depth RLS & RBAC</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth?tab=login"
            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b39129] text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <span>Marketplace Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary now that the route has no loading.tsx.
export default function AccessDeniedPage() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedPageContent />
    </Suspense>
  );
}
