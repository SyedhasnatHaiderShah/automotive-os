export interface HealthStatusResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptimeSeconds?: number;
  environment: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
  correlationId?: string;
}
