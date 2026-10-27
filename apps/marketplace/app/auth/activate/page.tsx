'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface InvitationDetails {
  valid: boolean;
  email: string;
  isPlatformAdmin: boolean;
  requiresMfa: boolean;
  role?: string | null;
  tenantName?: string | null;
  mfaSecret?: string;
  otpauthUrl?: string;
}

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('Missing activation token. Please verify your invitation link.');
      return;
    }

    let isMounted = true;

    async function verifyToken() {
      try {
        const res = await fetch(`/api/v1/auth/activate/verify?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setInvitation(data);
        } else {
          setErrorMessage(data.message || 'Invalid or expired activation token.');
        }
      } catch {
        if (!isMounted) return;
        setErrorMessage('Failed to connect to the activation service.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 10) {
      setFormError('Password must be at least 10 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const res = await fetch('/api/v1/auth/activate/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/auth?tab=login');
        }, 3000);
      } else {
        setFormError(data.message || 'Failed to complete activation.');
      }
    } catch {
      setFormError('Network error while completing account activation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 text-center text-stone-400">
        <svg
          className="animate-spin w-8 h-8 mx-auto mb-4 text-[#d4af37]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p>Verifying secure activation token...</p>
      </div>
    );
  }

  if (errorMessage || !invitation) {
    return (
      <div className="w-full max-w-lg bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Activation Link Invalid</h1>
        <p className="text-sm text-stone-400 mb-6">{errorMessage}</p>
        <Link
          href="/auth?tab=login"
          className="inline-flex justify-center py-2.5 px-5 rounded-xl text-sm font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 transition"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="w-full max-w-lg bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Account Successfully Activated</h1>
        <p className="text-sm text-stone-400 mb-6">
          Your credentials and security settings have been established. Redirecting to login...
        </p>
        <Link
          href="/auth?tab=login"
          className="inline-flex justify-center py-2.5 px-5 rounded-xl text-sm font-semibold text-black bg-[#d4af37] hover:bg-[#c29e2e] transition shadow-lg shadow-[#d4af37]/20"
        >
          Proceed to Login Now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 shadow-2xl shadow-black/60">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-xs font-semibold uppercase tracking-wider mb-3">
          {invitation.isPlatformAdmin ? 'Platform Administrator Setup' : 'Staff Account Activation'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Set Up Your Account</h1>
        <p className="text-sm text-stone-400">
          Target Identity: <span className="text-stone-200 font-medium">{invitation.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-300 mb-1.5">Create Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            placeholder="Min. 10 characters with symbols & numbers"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-300 mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={10}
            placeholder="Confirm password"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-black bg-[#d4af37] hover:bg-[#c29e2e] transition shadow-lg shadow-[#d4af37]/20 disabled:opacity-50"
        >
          {submitting ? 'Activating Account...' : 'Activate Account & Enforce Security'}
        </button>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#070707] flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-lg bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 text-center text-stone-400">
            Loading activation...
          </div>
        }
      >
        <ActivateAccountContent />
      </Suspense>
    </div>
  );
}
