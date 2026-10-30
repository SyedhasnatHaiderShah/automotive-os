import React from 'react';

/**
 * Persistent banner for sample-data preview modules. Rendered from each
 * preview module's layout so nested routes inherit it.
 */
export function PreviewBanner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-14">{children}</div>
      <div
        role="status"
        data-preview-banner
        className="fixed bottom-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 border-t-2 border-primary bg-surface-container-lowest/95 px-4 py-3 text-center text-sm font-bold text-primary shadow-[0_-4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">science</span>
        <span>Preview — sample data, no actions are sent</span>
      </div>
    </>
  );
}
