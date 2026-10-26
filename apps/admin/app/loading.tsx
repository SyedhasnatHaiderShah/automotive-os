export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" className="min-h-screen bg-background text-on-surface p-4 sm:p-6 lg:p-10">
      <span className="sr-only">Loading application content</span>
      <div className="mx-auto max-w-[1440px] space-y-6 animate-pulse">
        <div className="h-9 max-w-md rounded-lg bg-surface-container-high" />
        <div className="h-4 max-w-xl rounded bg-surface-container" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-52 rounded-lg border border-outline-variant/30 bg-surface-container" />
          ))}
        </div>
      </div>
    </main>
  );
}
