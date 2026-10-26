import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 text-on-surface">
      <section className="w-full max-w-lg rounded-lg border border-outline-variant/50 bg-surface-container p-6 sm:p-8">
        <p className="font-mono text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-on-surface-variant">This route or record is not available.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary" href="/">Go to home</Link>
      </section>
    </main>
  );
}
