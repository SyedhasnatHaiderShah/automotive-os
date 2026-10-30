import React from 'react';
import { PreviewBanner } from '../../components/preview-banner';

/** Sample-data preview module: every route here carries the preview banner. */
export default function PreviewModuleLayout({ children }: { children: React.ReactNode }) {
  return <PreviewBanner>{children}</PreviewBanner>;
}
