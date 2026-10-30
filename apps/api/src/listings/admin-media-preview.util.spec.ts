import {
  resetAdminMediaPreviewClient,
  signAdminMediaPreviewUrl,
} from './admin-media-preview.util';

describe('signAdminMediaPreviewUrl (AD-08)', () => {
  const originalEnv = { ...process.env };
  const STORAGE_KEYS = [
    'R2_ACCESS_KEY_ID',
    'S3_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'S3_SECRET_ACCESS_KEY',
    'R2_ENDPOINT',
    'S3_ENDPOINT',
    'R2_BUCKET_NAME',
    'S3_BUCKET',
  ];

  beforeEach(() => {
    for (const k of STORAGE_KEYS) delete process.env[k];
    resetAdminMediaPreviewClient();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetAdminMediaPreviewClient();
  });

  it('fails closed (null) when object storage is not configured', async () => {
    await expect(signAdminMediaPreviewUrl('tenants/t1/vehicles/v1/a.jpg')).resolves.toBeNull();
  });

  it('returns legacy absolute URLs unchanged', async () => {
    await expect(signAdminMediaPreviewUrl('https://images.example.test/a.jpg')).resolves.toBe(
      'https://images.example.test/a.jpg',
    );
  });

  it('rejects traversal keys', async () => {
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_ENDPOINT = 'https://storage.example.test';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    await expect(signAdminMediaPreviewUrl('tenants/../secrets.txt')).resolves.toBeNull();
  });

  it('produces a short-lived SigV4 GET URL when storage is configured', async () => {
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_ENDPOINT = 'https://storage.example.test';
    process.env.R2_BUCKET_NAME = 'test-bucket';

    const url = await signAdminMediaPreviewUrl('/tenants/t1/vehicles/v1/front.jpg');
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe('https://storage.example.test');
    expect(parsed.pathname).toBe('/test-bucket/tenants/t1/vehicles/v1/front.jpg');
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(url).not.toContain('test-secret-key');
  });
});
