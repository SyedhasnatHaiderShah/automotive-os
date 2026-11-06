'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DataRecordPage } from '../../../../components/DataRecordPage';

export default function DataEditRecordPage() {
  const params = useParams<{ model: string; id: string }>();
  return <DataRecordPage model={String(params?.model ?? '')} id={String(params?.id ?? '')} />;
}
