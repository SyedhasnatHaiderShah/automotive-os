import { BackupProviderAdapter } from './provider-adapter.interface';
import { AwsRdsBackupAdapter } from './aws-rds.adapter';
import { MockBackupAdapter } from './mock.adapter';

export * from './provider-adapter.interface';
export * from './aws-rds.adapter';
export * from './mock.adapter';

let globalMockAdapter: MockBackupAdapter | null = null;

export function getMockBackupAdapter(): MockBackupAdapter {
  if (!globalMockAdapter) {
    globalMockAdapter = new MockBackupAdapter();
  }
  return globalMockAdapter;
}

export function getBackupProviderAdapter(targetEnv: string): BackupProviderAdapter {
  const env = (targetEnv || 'staging').toLowerCase();
  const configuredAdapter = (process.env.BACKUP_PROVIDER_ADAPTER || '').toLowerCase();

  // Strict Sovereign Security Rule:
  // Mock adapter is STRICTLY PROHIBITED in production and live staging deployments.
  if (configuredAdapter === 'mock') {
    if (env === 'production') {
      throw new Error(`SECURITY FATAL: Mock backup provider adapter is strictly prohibited in 'production' environment! Real cloud provider verification is mandatory.`);
    }
    return getMockBackupAdapter();
  }

  // If running in automated tests or local dev without AWS credentials, permit mock adapter explicitly
  if (process.env.NODE_ENV === 'test' && !process.env.AWS_ACCESS_KEY_ID && configuredAdapter !== 'aws-rds') {
    return getMockBackupAdapter();
  }

  // Default to real AWS RDS adapter for cloud environments
  return new AwsRdsBackupAdapter();
}
