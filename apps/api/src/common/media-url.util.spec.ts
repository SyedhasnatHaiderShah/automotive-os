import { buildPublicMediaUrl } from './media-url.util';

describe('buildPublicMediaUrl', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns absolute URLs unchanged', () => {
    process.env.S3_PUBLIC_CDN_URL = 'https://media.example.test';
    expect(buildPublicMediaUrl('https://images.example.test/a.jpg')).toBe(
      'https://images.example.test/a.jpg'
    );
  });

  it('uses the configured CDN when S3_PUBLIC_CDN_URL is set', () => {
    process.env.S3_PUBLIC_CDN_URL = 'https://media.example.test/';
    expect(buildPublicMediaUrl('/tenants/t1/vehicles/v1/front.jpg')).toBe(
      'https://media.example.test/tenants/t1/vehicles/v1/front.jpg'
    );
  });

  it('falls back to the DB-gated API media proxy instead of a hardcoded CDN', () => {
    delete process.env.S3_PUBLIC_CDN_URL;
    delete process.env.PUBLIC_API_URL;
    expect(buildPublicMediaUrl('vehicles/dealer a/front 1.jpg')).toBe(
      '/api/v1/public/media/vehicles/dealer%20a/front%201.jpg'
    );
  });

  it('prefixes the proxy path with PUBLIC_API_URL when configured', () => {
    delete process.env.S3_PUBLIC_CDN_URL;
    process.env.PUBLIC_API_URL = 'https://api.example.test/';
    expect(buildPublicMediaUrl('vehicles/v1/front.jpg')).toBe(
      'https://api.example.test/api/v1/public/media/vehicles/v1/front.jpg'
    );
  });
});
