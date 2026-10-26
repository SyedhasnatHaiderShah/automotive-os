import { test, expect } from '@playwright/test';
import screens from './screens.json';

// Run: pnpm exec playwright test -c tests/stitch-parity/playwright.config.ts
// Requires AUTHENTICATED_STAGING_ADMIN_URL for protected admin tests.
// This is a failure-seeking re-audit; it does not constitute pixel parity.
const domains: Record<string, string> = {
  marketplace: process.env.STAGING_MARKETPLACE_URL || 'https://automotive-marketplace-staging.up.railway.app',
  dealer: process.env.STAGING_DEALER_URL || 'https://automotive-dealer-staging.up.railway.app',
  admin: process.env.AUTHENTICATED_STAGING_ADMIN_URL || '',
};
for (const s of screens as Array<{id:string;app:string;path:string}>) {
  for (const [width,height] of [[1440,900],[1024,768],[390,844]]) {
    test(`${s.id} ${s.app} ${width}px route, overflow, focus and screenshot`, async ({page}, info) => {
      const base = domains[s.app];
      test.skip(!base, 'Protected app access not configured');
      let urlPath = s.path;
      for (const token of ['DEALER_SLUG','KYB_ID','MODERATION_ID']) {
        urlPath = urlPath.replace(`{${token}}`, process.env[token] || `{${token}}`);
      }
      test.skip(urlPath.includes('{'), 'Authorized synthetic dynamic fixture ID not supplied');
      await page.setViewportSize({width,height});
      await page.emulateMedia({reducedMotion:'reduce'});
      const errors:string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(base.replace(/\/$/,'') + urlPath,{waitUntil:'domcontentloaded',timeout:30000});
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(500);
      if ([401,403].includes(response!.status())) test.skip(true,'Protected screen requires auth');
      expect(response!.status()).not.toBe(404);
      await page.evaluate(() => document.fonts.ready);
      const observations = await page.evaluate(() => ({
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        inertLinks: Array.from(document.querySelectorAll('a[href="#"]')).map(x => x.textContent?.trim()),
        anonymousButtons: Array.from(document.querySelectorAll('button')).filter(x => !((x.textContent || x.getAttribute('aria-label') || x.title).trim())).length,
      }));
      await page.screenshot({path:info.outputPath(`${s.id}-${width}.png`),fullPage:true,animations:'disabled'});
      await info.attach('observations',{body:JSON.stringify({url:page.url(),...observations,errors},null,2),contentType:'application/json'});
      expect(errors).toEqual([]);
      expect(observations.overflow).toBeLessThanOrEqual(3);
      expect(observations.inertLinks).toEqual([]);
      expect(observations.anonymousButtons).toBe(0);
    });
  }
}
test('S02 paginated listing deep link', async ({page}) => {
  await page.goto(domains.marketplace+'/cars?page=1&sort=price-asc',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('navigation',{name:'Pagination'})).toBeVisible();
  await expect(page.getByText(/Page 1/)).toBeVisible();
});
test('S03 mobile filters close on Escape', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(domains.marketplace+'/cars',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Filters & Refine/i}).click();
  await expect(page.getByRole('heading',{name:'Filters & Sort'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading',{name:'Filters & Sort'})).toHaveCount(0);
});
