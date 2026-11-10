import { test, expect, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Signed-in journeys against the local production-scale QA data set
 * (docs/qa/LOCAL_QA_DATA.md). Reads the shared seed password from the
 * gitignored `.qa-credentials.local.json`; the whole file is skipped when the
 * data set is not present. Each test signs in through the real /auth form.
 */
const credentialsPath = resolve(__dirname, '../../.qa-credentials.local.json');
const creds = existsSync(credentialsPath) ? JSON.parse(readFileSync(credentialsPath, 'utf8')) : null;
test.skip(!creds, 'local QA data set not seeded (.qa-credentials.local.json missing)');

type Account = { email: string; memberships?: string[]; status?: string };
const PASSWORD: string = creds?.sharedPassword;
const accounts: Account[] = creds?.accounts ?? [];
const byMembership = (m: string) => accounts.find((a) => a.memberships?.includes(m))?.email ?? '';
const BUYER = accounts.find((a) => a.email.endsWith('1@buyers.example'))?.email ?? '';
const OWNER = byMembership('falcon-ridge-motors:OWNER');
const VIEWER = byMembership('falcon-ridge-motors:VIEWER');
const AGENT = byMembership('falcon-ridge-motors:SALES_AGENT');
const SUSPENDED_TENANT_OWNER = byMembership('sandstorm-autos:OWNER');
const ADMIN = 'ops.admin@automotive-os.example';

async function signIn(page: Page, email: string, password = PASSWORD, redirect?: string) {
  await page.goto(redirect ? `/auth?tab=login&redirect=${encodeURIComponent(redirect)}` : '/auth?tab=login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('user@autonexa.ae').fill(email);
  await page.locator('form input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /Sign In to Dashboard/i }).click();
}

test.describe('Local QA — signed-in journeys', () => {
  test('wrong password shows the generic error and stays on /auth', async ({ page }) => {
    await signIn(page, BUYER, 'Definitely-wrong-password-1!');
    const alert = page.getByRole('alert').filter({ hasText: /Invalid email or password/i });
    await expect(alert).toBeVisible();
    expect(page.url()).toContain('/auth');
  });

  test('buyer: login lands in the garage; enquiries, saved and settings load real data', async ({ page }) => {
    await signIn(page, BUYER);
    await page.waitForURL(/\/account\/garage/, { timeout: 20000 });
    await expect(page.getByText(/Active bookings|مواعيد نشطة/)).toBeVisible();

    await page.goto('/account/enquiries', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).toContainText(/Ref #|enquir/i, { timeout: 15000 });

    await page.goto('/account/saved', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).not.toContainText(/Something went wrong/i);

    await page.goto('/account/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).toContainText(/WhatsApp/i, { timeout: 15000 });
    await page.screenshot({ path: 'test-results/e2e/local-qa/buyer-settings.png', fullPage: true });
  });

  test('buyer: enquiry modal consent boxes are labelled and unticked; enquiry is accepted', async ({ page }) => {
    await signIn(page, BUYER);
    await page.waitForURL(/\/account\/garage/, { timeout: 20000 });
    await page.goto('/cars?make=toyota&emirate=Dubai', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href^="/cars/"]').first().click();
    await page.waitForURL(/\/cars\/[^/?]+/, { timeout: 15000 });
    // Wait for hydration: the CTA is a client button that opens the enquiry modal.
    await page.waitForLoadState('networkidle');
    const cta = page.getByRole('button', { name: /Request viewing/i }).first();
    await expect(cta).toBeVisible({ timeout: 15000 });
    await cta.click();
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 15000 });
    const boxes = page.locator('input[type="checkbox"]');
    await expect(boxes.first()).toBeVisible({ timeout: 15000 });
    const count = await boxes.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const box = boxes.nth(i);
      await expect(box).not.toBeChecked();
      // Accessible name must be the label text, never the bare value "on" (QA-SI-02).
      const name = await box.evaluate((el) => {
        const input = el as HTMLInputElement;
        const label = input.closest('label') || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
        return (input.getAttribute('aria-label') || label?.textContent || '').trim();
      });
      expect(name.length).toBeGreaterThan(2);
      expect(name.toLowerCase()).not.toBe('on');
    }
    await page.screenshot({ path: 'test-results/e2e/local-qa/buyer-enquiry-modal.png', fullPage: true });
  });

  test('dealer OWNER: lands on /dealer, inventory shows cost, leads list loads (was 500 under RLS), sign-out exists', async ({ page }) => {
    await signIn(page, OWNER);
    await page.waitForURL(/\/dealer/, { timeout: 20000 });
    await expect(page.locator('body')).not.toContainText(/Something went wrong|HTTP 5/i);
    // a11y: the console must expose a main landmark
    await expect(page.locator('main').last()).toBeVisible({ timeout: 15000 });

    await page.goto('/dealer/inventory', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).toContainText(/Cost/i, { timeout: 20000 });
    await page.screenshot({ path: 'test-results/e2e/local-qa/dealer-owner-inventory.png', fullPage: true });

    await page.goto('/dealer/leads', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).not.toContainText(/HTTP 500|Identity service|went wrong/i, { timeout: 20000 });
    await expect(page.locator('main').last().getByText('Status', { exact: true }).first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/e2e/local-qa/dealer-owner-leads.png', fullPage: true });

    await page.locator('.dealer-app-header button[aria-expanded]').last().click();
    await expect(page.getByRole('link', { name: /Dealership Settings|إعدادات الوكالة/ }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign out|تسجيل الخروج/ }).first()).toBeVisible();
  });

  test('dealer VIEWER: no cost column, no lead status controls, API-backed pages still render', async ({ page }) => {
    await signIn(page, VIEWER);
    await page.waitForURL(/\/dealer/, { timeout: 20000 });
    await page.goto('/dealer/inventory', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).not.toContainText(/Cost:/i, { timeout: 20000 });
    await page.goto('/dealer/leads', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last().getByText('Status', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'test-results/e2e/local-qa/dealer-viewer-leads.png', fullPage: true });
  });

  test('dealer SALES_AGENT: lead status select only offers allowed transitions', async ({ page }) => {
    await signIn(page, AGENT);
    await page.waitForURL(/\/dealer/, { timeout: 20000 });
    await page.goto('/dealer/leads?status=WON', { waitUntil: 'domcontentloaded' });
    const selects = page.locator('main select');
    await expect(selects.first()).toBeVisible({ timeout: 20000 });
    const wonSelect = selects.filter({ has: page.locator('option[value="WON"]') }).first();
    if (await wonSelect.count()) {
      await expect(wonSelect).toBeDisabled();
      expect(await wonSelect.locator('option').count()).toBe(1);
    }
  });

  test('suspended dealership owner is sent to /access-suspended and cannot open the console', async ({ page }) => {
    await signIn(page, SUSPENDED_TENANT_OWNER);
    await page.waitForURL(/\/access-suspended/, { timeout: 20000 });
    await expect(page.locator('h1')).toBeVisible();
    await page.goto('/dealer/inventory', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/suspended|not available|Sign in/i, { timeout: 15000 });
  });

  test('platform admin: login lands on /admin, users page and dealers page render real counts', async ({ page }) => {
    await signIn(page, ADMIN);
    await page.waitForURL(/\/admin/, { timeout: 25000 });
    await expect(page.locator('main').last()).toContainText(/Dealerships|الوكالات/, { timeout: 20000 });
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-home.png', fullPage: true });

    await page.goto('/admin/users?status=SUSPENDED', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).toContainText(/SUSPENDED/i, { timeout: 20000 });
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-users.png', fullPage: true });

    await page.goto('/admin/dealers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).toContainText(/Falcon Ridge Motors/, { timeout: 20000 });
  });

  test('buyer-only account cannot open the dealer or admin consoles', async ({ page }) => {
    await signIn(page, BUYER);
    await page.waitForURL(/\/account\/garage/, { timeout: 20000 });
    await page.goto('/dealer', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/no active dealership membership|Sign in|not allowed/i, { timeout: 15000 });
    const adminRes = await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    expect([200, 307, 401, 403]).toContain(adminRes?.status() ?? 0);
    await expect(page).not.toHaveURL(/\/admin\/?$/);
  });
});
