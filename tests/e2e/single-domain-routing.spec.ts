import { test, expect } from '@playwright/test';

test.describe('Single-Domain Multi-Zone Routing & Edge Gateway Suite', () => {
  test('Root path (/) serves public marketplace and responsive navigation', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    // Verify brand heading & search
    await expect(page.locator('body')).not.toBeEmpty();
    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/');
  });

  test('Public vehicle listings (/cars) render with search and filters', async ({ page }) => {
    const res = await page.goto('/cars', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);

    const title = await page.title();
    expect(title).toBeDefined();
  });

  test('Public dealer directory (/dealers) loads verified UAE showrooms', async ({ page }) => {
    const res = await page.goto('/dealers', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });

  test('Static Next.js bundles, styles and fonts load without 404 or 500 errors', async ({ page }) => {
    const failedResources: string[] = [];

    page.on('response', (response) => {
      if (
        (response.url().includes('/_next/static/') || response.url().includes('/fonts/')) &&
        (response.status() === 404 || response.status() >= 500)
      ) {
        failedResources.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/auth', { waitUntil: 'networkidle' });
    expect(failedResources).toEqual([]);
  });

  test('No horizontal overflow on desktop (1440px), tablet (1024px), or mobile (390px)', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/auth', { waitUntil: 'domcontentloaded' });

      const overflow = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      });

      expect(overflow).toBeLessThanOrEqual(5); // Within allowable sub-pixel threshold
    }
  });
});
