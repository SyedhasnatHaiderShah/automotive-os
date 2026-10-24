import { RDSClient, DescribeDBSnapshotsCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { BackupProviderAdapter, BackupVerifyOptions, VerifiedBackupSnapshot, VerifiedPitr } from './provider-adapter.interface';

export class AwsRdsBackupAdapter implements BackupProviderAdapter {
  readonly providerName = 'aws-rds';
  private client: RDSClient;
  private region: string;

  constructor(region?: string) {
    this.region = region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'me-central-1';
    this.client = new RDSClient({
      region: this.region,
    });
  }

  async describeSnapshot(snapshotIdentifier: string, options: BackupVerifyOptions): Promise<VerifiedBackupSnapshot> {
    const maxAgeHours = options.maxAgeHours ?? 24.0;
    
    let response;
    try {
      const command = new DescribeDBSnapshotsCommand({
        DBSnapshotIdentifier: snapshotIdentifier,
      });
      response = await this.client.send(command);
    } catch (err: any) {
      throw new Error(`AWS RDS DescribeDBSnapshots failed for '${snapshotIdentifier}': ${err?.message || err}`);
    }

    const snapshots = response.DBSnapshots;
    if (!snapshots || snapshots.length === 0 || !snapshots[0]) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' not found in region '${this.region}'.`);
    }

    const snap = snapshots[0];

    // Status check directly from AWS provider response
    const status = snap.Status?.toLowerCase() || 'unknown';
    if (status !== 'available') {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' status is '${snap.Status}', expected 'available'.`);
    }

    // Timestamp & freshness check directly from AWS provider response
    if (!snap.SnapshotCreateTime) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' has no SnapshotCreateTime returned by AWS.`);
    }

    const createTime = new Date(snap.SnapshotCreateTime);
    const now = Date.now();
    const ageHours = (now - createTime.getTime()) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' is stale: age is ${ageHours.toFixed(2)} hours (max allowed: ${maxAgeHours} hours).`);
    }

    // Database instance matching
    const expectedInstance = options.expectedInstanceId || options.targetDatabase;
    if (snap.DBInstanceIdentifier && expectedInstance && snap.DBInstanceIdentifier !== expectedInstance && !expectedInstance.includes(snap.DBInstanceIdentifier)) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' belongs to instance '${snap.DBInstanceIdentifier}', which does not match expected target '${expectedInstance}'.`);
    }

    // Region verification
    if (options.expectedRegion && this.region !== options.expectedRegion) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' is in region '${this.region}', expected '${options.expectedRegion}'.`);
    }

    // Restore eligibility check
    const isEncrypted = snap.Encrypted === true;
    const isPostgres = (snap.Engine || '').toLowerCase().includes('postgres');
    if (!isPostgres) {
      throw new Error(`AWS RDS Snapshot '${snapshotIdentifier}' engine is '${snap.Engine}', expected PostgreSQL.`);
    }

    return {
      provider: 'aws-rds',
      snapshotIdentifier,
      dbInstanceIdentifier: snap.DBInstanceIdentifier || expectedInstance,
      status: 'available',
      snapshotCreateTime: createTime,
      ageHours,
      engine: snap.Engine || 'postgres',
      engineVersion: snap.EngineVersion || '16',
      allocatedStorageGb: snap.AllocatedStorage,
      encrypted: isEncrypted,
      kmsKeyId: snap.KmsKeyId,
      region: this.region,
      restoreEligible: true,
    };
  }

  async describePitr(targetRestoreTime: Date, options: BackupVerifyOptions): Promise<VerifiedPitr> {
    const instanceId = options.expectedInstanceId || options.targetDatabase;
    let response;
    try {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceId,
      });
      response = await this.client.send(command);
    } catch (err: any) {
      throw new Error(`AWS RDS DescribeDBInstances failed for '${instanceId}': ${err?.message || err}`);
    }

    const instances = response.DBInstances;
    if (!instances || instances.length === 0 || !instances[0]) {
      throw new Error(`AWS RDS DB Instance '${instanceId}' not found in region '${this.region}'.`);
    }

    const inst = instances[0];
    const status = inst.DBInstanceStatus?.toLowerCase() || 'unknown';
    if (status !== 'available') {
      throw new Error(`AWS RDS DB Instance '${instanceId}' status is '${inst.DBInstanceStatus}', expected 'available'.`);
    }

    if (!inst.BackupRetentionPeriod || inst.BackupRetentionPeriod <= 0) {
      throw new Error(`AWS RDS DB Instance '${instanceId}' has automated backups / PITR disabled (BackupRetentionPeriod = ${inst.BackupRetentionPeriod}).`);
    }

    if (!inst.LatestRestorableTime) {
      throw new Error(`AWS RDS DB Instance '${instanceId}' has no LatestRestorableTime reported by provider.`);
    }

    const latestRestorable = new Date(inst.LatestRestorableTime);
    // In AWS RDS, restorable window begins at (LatestRestorableTime - BackupRetentionPeriod days) or InstanceCreateTime
    const retentionMs = (inst.BackupRetentionPeriod || 1) * 24 * 60 * 60 * 1000;
    const earliestRestorable = inst.InstanceCreateTime 
      ? new Date(Math.max(new Date(inst.InstanceCreateTime).getTime(), latestRestorable.getTime() - retentionMs))
      : new Date(latestRestorable.getTime() - retentionMs);

    if (targetRestoreTime < earliestRestorable || targetRestoreTime > latestRestorable) {
      throw new Error(`Target restore time ${targetRestoreTime.toISOString()} is outside restorable window (${earliestRestorable.toISOString()} to ${latestRestorable.toISOString()}).`);
    }

    return {
      provider: 'aws-rds',
      dbInstanceIdentifier: instanceId,
      status: 'available',
      earliestRestorableTime: earliestRestorable,
      latestRestorableTime: latestRestorable,
      targetRestoreTime,
      restoreEligible: true,
      region: this.region,
    };
  }
}
