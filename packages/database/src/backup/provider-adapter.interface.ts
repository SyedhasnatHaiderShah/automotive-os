export interface BackupVerifyOptions {
  targetDatabase: string;
  expectedInstanceId?: string;
  expectedRegion?: string;
  maxAgeHours?: number; // default: 24.0
}

export interface VerifiedBackupSnapshot {
  provider: 'aws-rds' | 'postgresql-pitr' | 'gcp-cloudsql' | 'azure-postgres' | 'mock';
  snapshotIdentifier: string;
  dbInstanceIdentifier: string;
  status: string; // must be 'available'
  snapshotCreateTime: Date;
  ageHours: number;
  engine: string;
  engineVersion: string;
  allocatedStorageGb?: number;
  encrypted: boolean;
  kmsKeyId?: string;
  region: string;
  restoreEligible: boolean;
}

export interface VerifiedPitr {
  provider: 'aws-rds' | 'postgresql-pitr' | 'mock';
  dbInstanceIdentifier: string;
  status: string; // 'available'
  earliestRestorableTime: Date;
  latestRestorableTime: Date;
  targetRestoreTime: Date;
  restoreEligible: boolean;
  region: string;
}

export interface BackupProviderAdapter {
  readonly providerName: string;
  describeSnapshot(snapshotIdentifier: string, options: BackupVerifyOptions): Promise<VerifiedBackupSnapshot>;
  describePitr(targetRestoreTime: Date, options: BackupVerifyOptions): Promise<VerifiedPitr>;
}
