import { BackupProviderAdapter, BackupVerifyOptions, VerifiedBackupSnapshot, VerifiedPitr } from './provider-adapter.interface';

export interface MockSnapshotRecord {
  snapshotIdentifier: string;
  dbInstanceIdentifier: string;
  status: string;
  snapshotCreateTime: Date;
  region: string;
  engine?: string;
  encrypted?: boolean;
}

export class MockBackupAdapter implements BackupProviderAdapter {
  readonly providerName = 'mock';
  private snapshots: Map<string, MockSnapshotRecord> = new Map();
  private pitrRecords: Map<string, { earliest: Date; latest: Date; status: string; region: string }> = new Map();

  constructor() {
    this.seedDefaultMocks();
  }

  public registerSnapshot(record: MockSnapshotRecord) {
    this.snapshots.set(record.snapshotIdentifier, record);
  }

  public registerPitr(instanceId: string, earliest: Date, latest: Date, status = 'available', region = 'me-central-1') {
    this.pitrRecords.set(instanceId, { earliest, latest, status, region });
  }

  public clearMocks() {
    this.snapshots.clear();
    this.pitrRecords.clear();
  }

  public seedDefaultMocks() {
    const now = Date.now();
    
    // 1. Valid fresh staging snapshot (15 mins old)
    this.registerSnapshot({
      snapshotIdentifier: 'rds-automotive-os-staging-2026-10-23',
      dbInstanceIdentifier: 'automotive_os',
      status: 'available',
      snapshotCreateTime: new Date(now - 15 * 60 * 1000),
      region: 'me-central-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 2. Valid fresh production snapshot (30 mins old)
    this.registerSnapshot({
      snapshotIdentifier: 'rds-automotive-os-prod-valid',
      dbInstanceIdentifier: 'automotive_os_production',
      status: 'available',
      snapshotCreateTime: new Date(now - 30 * 60 * 1000),
      region: 'me-central-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 3. Stale snapshot (> 24 hours old: 28 hours)
    this.registerSnapshot({
      snapshotIdentifier: 'rds-automotive-os-stale',
      dbInstanceIdentifier: 'automotive_os',
      status: 'available',
      snapshotCreateTime: new Date(now - 28 * 60 * 60 * 1000),
      region: 'me-central-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 4. Pending / Creating snapshot (not available)
    this.registerSnapshot({
      snapshotIdentifier: 'rds-automotive-os-pending',
      dbInstanceIdentifier: 'automotive_os',
      status: 'creating',
      snapshotCreateTime: new Date(now - 5 * 60 * 1000),
      region: 'me-central-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 5. Wrong database snapshot
    this.registerSnapshot({
      snapshotIdentifier: 'rds-foreign-database-snapshot',
      dbInstanceIdentifier: 'foreign_customer_db',
      status: 'available',
      snapshotCreateTime: new Date(now - 10 * 60 * 1000),
      region: 'me-central-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 6. Wrong region snapshot (e.g. us-east-1 instead of sovereign me-central-1)
    this.registerSnapshot({
      snapshotIdentifier: 'rds-wrong-region-snapshot',
      dbInstanceIdentifier: 'automotive_os',
      status: 'available',
      snapshotCreateTime: new Date(now - 10 * 60 * 1000),
      region: 'us-east-1',
      engine: 'postgres',
      encrypted: true,
    });

    // 7. Seed PITR for automotive_os
    this.registerPitr(
      'automotive_os',
      new Date(now - 7 * 24 * 60 * 60 * 1000),
      new Date(now - 2 * 60 * 1000),
      'available',
      'me-central-1'
    );

    this.registerPitr(
      'automotive_os_production',
      new Date(now - 7 * 24 * 60 * 60 * 1000),
      new Date(now - 2 * 60 * 1000),
      'available',
      'me-central-1'
    );
  }

  async describeSnapshot(snapshotIdentifier: string, options: BackupVerifyOptions): Promise<VerifiedBackupSnapshot> {
    const snap = this.snapshots.get(snapshotIdentifier);
    if (!snap) {
      throw new Error(`MockProvider: Snapshot '${snapshotIdentifier}' not found in registry (unverified/forged token).`);
    }

    if (snap.status !== 'available') {
      throw new Error(`MockProvider: Snapshot '${snapshotIdentifier}' status is '${snap.status}', expected 'available'.`);
    }

    if (options.expectedRegion && snap.region !== options.expectedRegion) {
      throw new Error(`MockProvider: Snapshot '${snapshotIdentifier}' is in region '${snap.region}', expected '${options.expectedRegion}'.`);
    }

    const ageHours = (Date.now() - snap.snapshotCreateTime.getTime()) / (1000 * 60 * 60);
    const maxAge = options.maxAgeHours ?? 24.0;
    if (ageHours > maxAge) {
      throw new Error(`MockProvider: Snapshot '${snapshotIdentifier}' is stale: age is ${ageHours.toFixed(2)} hours (max allowed: ${maxAge} hours).`);
    }

    const expectedInstance = options.expectedInstanceId || options.targetDatabase;
    if (expectedInstance && snap.dbInstanceIdentifier !== expectedInstance && !expectedInstance.includes(snap.dbInstanceIdentifier)) {
      throw new Error(`MockProvider: Snapshot '${snapshotIdentifier}' belongs to instance '${snap.dbInstanceIdentifier}', which does not match expected target '${expectedInstance}'.`);
    }

    return {
      provider: 'mock',
      snapshotIdentifier,
      dbInstanceIdentifier: snap.dbInstanceIdentifier,
      status: snap.status,
      snapshotCreateTime: snap.snapshotCreateTime,
      ageHours,
      engine: snap.engine || 'postgres',
      engineVersion: '16',
      encrypted: snap.encrypted !== false,
      region: snap.region,
      restoreEligible: true,
    };
  }

  async describePitr(targetRestoreTime: Date, options: BackupVerifyOptions): Promise<VerifiedPitr> {
    const instanceId = options.expectedInstanceId || options.targetDatabase;
    const pitr = this.pitrRecords.get(instanceId);
    if (!pitr) {
      throw new Error(`MockProvider: No PITR capability found for instance '${instanceId}'.`);
    }

    if (pitr.status !== 'available') {
      throw new Error(`MockProvider: Instance '${instanceId}' status is '${pitr.status}', expected 'available'.`);
    }

    if (options.expectedRegion && pitr.region !== options.expectedRegion) {
      throw new Error(`MockProvider: Instance '${instanceId}' region '${pitr.region}' does not match expected '${options.expectedRegion}'.`);
    }

    if (targetRestoreTime < pitr.earliest || targetRestoreTime > pitr.latest) {
      throw new Error(`MockProvider: Target restore time ${targetRestoreTime.toISOString()} is outside window (${pitr.earliest.toISOString()} to ${pitr.latest.toISOString()}).`);
    }

    return {
      provider: 'mock',
      dbInstanceIdentifier: instanceId,
      status: pitr.status,
      earliestRestorableTime: pitr.earliest,
      latestRestorableTime: pitr.latest,
      targetRestoreTime,
      restoreEligible: true,
      region: pitr.region,
    };
  }
}
