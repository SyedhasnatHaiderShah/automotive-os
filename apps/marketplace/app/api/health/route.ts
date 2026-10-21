import { NextResponse } from 'next/server';
import { HealthStatusResponse } from '@automotive-os/contracts';

export async function GET(): Promise<NextResponse<HealthStatusResponse>> {
  return NextResponse.json({
    status: 'ok',
    service: 'marketplace',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}
