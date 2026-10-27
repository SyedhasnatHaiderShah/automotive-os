'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(
    token ? 'loading' : 'idle'
  );
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('idle');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully. You may now log in.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid or expired verification token.');
        }
      } catch {
        if (!isMounted) return;
        setStatus('error');
        setMessage('Network error communicating with the verification service.');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendStatus('loading');
    setResendMessage('');

    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();
      setResendStatus('success');
      setResendMessage(
        data.message ||
          'If an unverified account exists for this email, a verification link has been sent.'
      );
    } catch {
      setResendStatus('error');
      setResendMessage('Failed to resend verification email. Please check your network.');
    }
  };

  return (
    <div className="w-full max-w-md bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 shadow-2xl shadow-black/60 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
          {status === 'loading' && (
            <svg
              className="animate-spin w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          {status === 'success' && (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {(status === 'error' || status === 'idle') && (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
        {status === 'loading' && 'Verifying Your Email'}
        {status === 'success' && 'Email Verified!'}
        {status === 'error' && 'Verification Unsuccessful'}
        {status === 'idle' && 'Email Verification'}
      </h1>

      <p className="text-sm text-stone-400 mb-6">
        {status === 'loading' && 'Please wait while we validate your cryptographic verification token...'}
        {status === 'success' && message}
        {status === 'error' && message}
        {status === 'idle' && 'Please open the verification link sent to your registered email address.'}
      </p>

      {status === 'success' && (
        <Link
          href="/auth?tab=login"
          className="w-full inline-flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-black bg-[#d4af37] hover:bg-[#c29e2e] transition shadow-lg shadow-[#d4af37]/20"
        >
          Proceed to Login
        </Link>
      )}

      {(status === 'error' || status === 'idle') && (
        <div className="mt-6 border-t border-stone-800 pt-6 text-left">
          <h2 className="text-sm font-medium text-stone-300 mb-2">Request a New Verification Link</h2>
          <form onSubmit={handleResend} className="space-y-3">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={resendStatus === 'loading'}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 transition"
            >
              {resendStatus === 'loading' ? 'Sending...' : 'Send Verification Link'}
            </button>
            {resendMessage && (
              <p className="text-xs text-stone-400 mt-2 text-center">{resendMessage}</p>
            )}
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth?tab=login" className="text-xs text-[#d4af37] hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#070707] flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 text-center text-stone-400">
            Loading verification...
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
