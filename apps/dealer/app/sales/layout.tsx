import React from 'react';
import { notFound } from 'next/navigation';
import { PreviewBanner } from '../../components/preview-banner';
import { PREVIEW_MODULES_ENABLED } from '../../lib/preview';

/**
 * Sample-data preview module: every route here carries the preview banner.
 * Builds without NEXT_PUBLIC_ENABLE_PREVIEW_MODULES=true return 404 (DL-07).
 */
export default function PreviewModuleLayout({ children }: { children: React.ReactNode }) {
  if (!PREVIEW_MODULES_ENABLED) notFound();
  return <PreviewBanner>{children}</PreviewBanner>;
}
