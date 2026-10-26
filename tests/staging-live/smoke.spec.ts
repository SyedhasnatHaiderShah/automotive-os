import { test, expect } from '@playwright/test';

/** LIVE STAGING READ-ONLY CHECKS. No POST, DELETE, secrets, or user mutations. */
const market = 'https://automotive-marketplace-staging.up.railway.app';
const dealer = 'https://automotive-dealer-staging.up.railway.app';
const admin = 'https://admin-staging.syedhasnat.com';
const api = 'https://api-staging.syedhasnat.com';

test('API readiness, public catalogue, and published vehicle detail', async ({ request }) => {
  const health = await request.get(api + '/health');
  expect(health.status(), 'API readiness').toBe(200);
  const listings = await request.get(api + '/api/v1/public/listings?page=1&limit=12');
  expect(listings.status(), 'Published listings endpoint').toBe(200);
  const data = await listings.json();
  expect(Array.isArray(data.items), 'Listings are a real JSON array').toBe(true);
  expect(typeof data.total, 'Response has an actual total').toBe('number');
  const detail = await request.get(api + '/api/v1/public/listings/2024-toyota-land-cruiser-gr-sport-dubai');
  expect(detail.status(), 'Synthetic staging vehicle detail').toBe(200);
});

test('all frontend health routes respond; admin denies anonymous access', async ({ request }) => {
  for (const url of [market + '/api/health', dealer + '/api/health', admin + '/api/health']) {
    const response = await request.get(url);
    expect(response.status(), 'Health route: ' + url).toBe(200);
  }
  const denied = await request.get(admin + '/', { failOnStatusCode: false, maxRedirects: 0 });
  expect([401, 403], 'Anonymous admin request must be rejected').toContain(denied.status());
});

const screens = [
  { name: 'buyer-home', base: market, route: '/' },
  { name: 'buyer-catalog', base: market, route: '/cars?page=1&sort=price-asc' },
  { name: 'buyer-vehicle', base: market, route: '/cars/2024-toyota-land-cruiser-gr-sport-dubai' },
  { name: 'dealer-dashboard', base: dealer, route: '/' },
  { name: 'dealer-inventory', base: dealer, route: '/inventory' },
];

for (const screen of screens) {
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    test(screen.name + ' live browser ' + width + 'px', async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const uncaught: string[] = [];
      page.on('pageerror', (error) => uncaught.push(error.message));
      const url = screen.base + screen.route;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      expect(response, 'Page must return an HTTP response: ' + url).not.toBeNull();
      expect(response!.status(), 'Page should be reachable: ' + url).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.waitForTimeout(850);
      const measurements = await page.evaluate(() => ({
        overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        invalidLinks: [...document.querySelectorAll('a[href="#"]')].map((node) => (node.textContent || '').trim()).filter(Boolean),
      }));
      await page.screenshot({ path: testInfo.outputPath(screen.name + '-' + width + '.png'), fullPage: true, animations: 'disabled' });
      await testInfo.attach('audit-observations', {
        body: Buffer.from(JSON.stringify({ url, status: response!.status(), viewport: width, ...measurements, uncaught }, null, 2)),
        contentType: 'application/json',
      });
      expect(uncaught, 'No uncaught JS errors: ' + url).toEqual([]);
      expect(measurements.overflowPx, 'No global viewport overflow: ' + url).toBeLessThanOrEqual(3);
      expect(measurements.invalidLinks, 'No inert placeholder anchors: ' + url).toEqual([]);
    });
  }
}
