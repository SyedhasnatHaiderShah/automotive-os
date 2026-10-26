import React from 'react';
import Link from 'next/link';

export default function DealerNotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
      <div className="bg-surface-container-high border border-outline-variant/40 rounded-2xl p-8 max-w-lg w-full text-center flex flex-col items-center gap-4 shadow-2xl">
        <span className="font-mono text-3xl font-bold text-primary">404</span>
        <h2 className="text-xl font-bold font-headline text-on-surface">
          DMS Module or Record Not Found
        </h2>
        <p className="text-sm text-on-surface-variant font-body-md">
          The requested dealership management module, vehicle inventory record, or order does not exist in this tenant partition.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity"
        >
          Return to Operations Cockpit
        </Link>
      </div>
    </div>
  );
}
