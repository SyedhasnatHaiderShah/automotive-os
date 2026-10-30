'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, Mail, ArrowLeft, Building2 } from 'lucide-react';

/** Configured support address; the contact link is hidden when it is not set (MK-14). */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || '';

export default function AccessSuspendedPage() {
  const searchParams = useSearchParams();
  const isTenantSuspended = searchParams.get('reason') === 'tenant_suspended';

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg bg-[#121824] border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-lg shadow-amber-500/10">
          {isTenantSuspended ? (
            <Building2 className="w-8 h-8" />
          ) : (
            <ShieldAlert className="w-8 h-8" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mb-3">
          {isTenantSuspended ? 'Dealership Account Suspended' : 'Access Privileges Suspended'}
        </h1>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          {isTenantSuspended ? (
            <>
              Your affiliated dealership franchise has been placed into administrative suspension by platform governance. 
              All published vehicle listings are unlisted and dealer operations are paused pending compliance review.
            </>
          ) : (
            <>
              Your user account has been placed into administrative suspension. 
              Active sessions have been terminated and access to protected dealer and admin consoles is restricted.
            </>
          )}
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-gray-300 text-left mb-8 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Status Code:</span>
            <span className="text-amber-400 font-bold">{isTenantSuspended ? 'TENANT_INACTIVE' : 'ACCOUNT_SUSPENDED'}</span>
          </div>
          {SUPPORT_EMAIL && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Support Inquiries:</span>
              <span className="text-gray-300 break-all">{SUPPORT_EMAIL}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth?tab=login"
            className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
          {SUPPORT_EMAIL && (
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Account Suspension Inquiry')}`}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>Contact Support</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
