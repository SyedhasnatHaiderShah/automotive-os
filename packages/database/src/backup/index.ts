import { BackupProviderAdapter } from './provider-adapter.interface';
import { AwsRdsBackupAdapter } from './aws-rds.adapter';
import { MockBackupAdapter } from './mock.adapter';
import { SelfHostedPostgresBackupAdapter } from './self-hosted.adapter';

export * from './provider-adapter.interface';
export * from './aws-rds.adapter';
export * from './mock.adapter';
export * from './self-hosted.adapter';

let globalMockAdapter: MockBackupAdapter | null = null;
let globalSelfHostedAdapter: SelfHostedPostgresBackupAdapter | null = null;

export function getMockBackupAdapter(): MockBackupAdapter {
  if (!globalMockAdapter) {
    globalMockAdapter = new MockBackupAdapter();
  }
  return globalMockAdapter;
}

export function getSelfHostedBackupAdapter(): SelfHostedPostgresBackupAdapter {
  if (!globalSelfHostedAdapter) {
    globalSelfHostedAdapter = new SelfHostedPostgresBackupAdapter();
  }
  return globalSelfHostedAdapter;
}

export function getBackupProviderAdapter(targetEnv: string): BackupProviderAdapter {
  const env = (targetEnv || 'staging').toLowerCase();
  const configuredAdapter = (process.env.BACKUP_PROVIDER_ADAPTER || '').toLowerCase();

  // Strict Sovereign Security Rule:
  // Mock adapter is STRICTLY PROHIBITED in production and live staging deployments.
  if (configuredAdapter === 'mock') {
    if (env === 'production') {
      throw new Error(
        `SECURITY FATAL: Mock backup provider adapter is strictly prohibited in 'production' environment! Real cloud provider verification is mandatory.`
      );
    }
    return getMockBackupAdapter();
  }

  // Self-hosted containerized PostgreSQL on VPS origin
  if (
    configuredAdapter === 'self-hosted' ||
    configuredAdapter === 'self-hosted-postgres' ||
    (env === 'staging' && !process.env.AWS_ACCESS_KEY_ID && configuredAdapter !== 'aws-rds' && process.env.NODE_ENV !== 'test')
  ) {
    return getSelfHostedBackupAdapter();
  }

  // If running in automated tests or local dev without AWS credentials, permit mock adapter explicitly
  if (
    process.env.NODE_ENV === 'test' &&
    !process.env.AWS_ACCESS_KEY_ID &&
    configuredAdapter !== 'aws-rds' &&
    configuredAdapter !== 'self-hosted'
  ) {
    return getMockBackupAdapter();
  }

  // Default to real AWS RDS adapter for cloud environments
  return new AwsRdsBackupAdapter();
}
