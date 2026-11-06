'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DataRecordPage } from '../../../../components/DataRecordPage';

export default function DataNewRecordPage() {
  const params = useParams<{ model: string }>();
  return <DataRecordPage model={String(params?.model ?? '')} />;
}
