'use client';
import { useEffect } from 'react';
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Automotive OS route failure', error); }, [error]);
  return (
    <main role="alert" className="flex min-h-screen items-center justify-center bg-background p-5 text-on-surface">
      <section className="w-full max-w-lg rounded-lg border border-outline-variant/50 bg-surface-container p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">Unable to load this page</h1>
        <p className="mt-3 text-on-surface-variant">Please check your connection or try again.</p>
        <button type="button" onClick={reset} className="mt-6 min-h-11 rounded-lg bg-primary px-5 font-semibold text-on-primary">Retry</button>
      </section>
    </main>
  );
}
