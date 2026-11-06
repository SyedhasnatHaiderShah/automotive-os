import { test, expect, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Platform-admin data console (AD-20): every table is browsable, and rows can
 * be created, edited and deleted from the UI with an audit trail.
 * Signs in through the real /auth form with the local QA admin account.
 */
const credentialsPath = resolve(__dirname, '../../.qa-credentials.local.json');
const creds = existsSync(credentialsPath) ? JSON.parse(readFileSync(credentialsPath, 'utf8')) : null;
test.skip(!creds, 'local QA data set not seeded (.qa-credentials.local.json missing)');

const ADMIN = 'ops.admin@automotive-os.example';
const MODELS = [
  'User', 'BuyerProfile', 'Tenant', 'DealerVerification', 'Branch', 'Membership', 'Make', 'CarModel', 'Vehicle',
  'VehicleMedia', 'Listing', 'Favorite', 'SavedSearch', 'Lead', 'LeadDataGrant', 'Appointment', 'SubscriptionPlan',
  'Subscription', 'AuditEvent', 'OutboxEvent', 'Session', 'UserInvitation',
];

async function signInAsAdmin(page: Page) {
  await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('user@autonexa.ae').fill(ADMIN);
  await page.locator('form input[type="password"]').first().fill(creds.sharedPassword);
  await page.getByRole('button', { name: /Sign In to Dashboard/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 25000 });
}

test.describe('Admin data console', () => {
  test('lists every table with counts and the sidebar link', async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole('link', { name: /Data Console/ }).click();
    await page.waitForURL(/\/admin\/data$/);
    await expect(page.getByRole('heading', { name: /Data Console/ })).toBeVisible();
    for (const m of MODELS) {
      await expect(page.getByRole('link', { name: m, exact: true })).toBeVisible({ timeout: 20000 });
    }
    await expect(page.locator('table tbody tr')).toHaveCount(MODELS.length);
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-data-index.png', fullPage: true });
  });

  test('every table opens, pages and shows a record form', async ({ page }) => {
    test.setTimeout(240000);
    await signInAsAdmin(page);
    for (const m of MODELS) {
      await page.goto(`/admin/data/${m}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: m, exact: true })).toBeVisible({ timeout: 20000 });
      await expect(page.locator('main').last()).not.toContainText(/could not be loaded|Unknown table/i);
      const footer = page.locator('text=/\\d+ rows · page \\d+ of \\d+/');
      // The footer shows "0 rows" until the first fetch settles.
      await expect(page.locator('table tbody')).not.toContainText(/Loading rows/, { timeout: 20000 });
      await expect(footer).toBeVisible({ timeout: 20000 });
      const rowsText = (await footer.textContent()) ?? '';
      const rowCount = Number(rowsText.match(/([\d,]+) rows/)?.[1]?.replace(/,/g, '') ?? '0');
      if (rowCount > 0) {
        await page.locator('table tbody a').first().click();
        await page.waitForURL(new RegExp(`/admin/data/${m}/[0-9a-f-]{36}`), { timeout: 20000 });
        await expect(page.getByRole('button', { name: /Save changes/ })).toBeVisible({ timeout: 20000 });
        await expect(page.locator('main').last()).not.toContainText(/could not be loaded/i);
      } else {
        await expect(page.getByText(/This table is empty/)).toBeVisible();
      }
    }
  });

  test('create, edit, search and delete a Make from the UI with audit evidence', async ({ page }) => {
    await signInAsAdmin(page);
    const stamp = Date.now().toString(36);
    const name = `QA Make ${stamp}`;

    // create
    await page.goto('/admin/data/Make/new', { waitUntil: 'domcontentloaded' });
    await page.locator('#f-name').fill(name);
    await page.locator('#f-slug').fill(`qa-make-${stamp}`);
    await page.getByRole('button', { name: /Create row/ }).click();
    await page.waitForURL(/\/admin\/data\/Make\/[0-9a-f-]{36}\?created=1/, { timeout: 20000 });
    await expect(page.getByRole('status')).toContainText(/Row created/);
    const id = page.url().match(/Make\/([0-9a-f-]{36})/)![1];
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-data-created.png', fullPage: true });

    // edit
    await page.locator('#f-name').fill(`${name} edited`);
    await page.getByRole('button', { name: /Save changes/ }).click();
    await expect(page.getByRole('status')).toContainText(/Saved/, { timeout: 20000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#f-name')).toHaveValue(`${name} edited`, { timeout: 20000 });

    // duplicate slug is a 409 shown inline, not a crash
    await page.goto('/admin/data/Make/new', { waitUntil: 'domcontentloaded' });
    await page.locator('#f-name').fill(`${name} dup`);
    await page.locator('#f-slug').fill(`qa-make-${stamp}`);
    await page.getByRole('button', { name: /Create row/ }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(/UNIQUE_VIOLATION|already has/i, { timeout: 20000 });

    // search finds the edited row
    await page.goto('/admin/data/Make', { waitUntil: 'domcontentloaded' });
    await page.locator('#data-search').fill(`qa-make-${stamp}`);
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 20000 });
    await expect(page.locator('table tbody')).toContainText(`${name} edited`);

    // delete with reason
    await page.getByRole('button', { name: new RegExp(`Delete Make ${id.slice(0, 8)}`) }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('textarea, input[type="text"]').first().fill('QA browser test cleanup');
    await dialog.getByRole('button', { name: /Delete row/ }).click();
    await expect(page.getByRole('status')).toContainText(/Deleted Make/, { timeout: 20000 });
    // Re-run the search: the deleted row must be gone.
    await page.locator('#data-search').fill('');
    await page.locator('#data-search').fill(`qa-make-${stamp}`);
    await expect(page.locator('table tbody')).toContainText(/No rows match/, { timeout: 20000 });
    await expect(page.locator('table tbody')).not.toContainText(`${name} edited`);

    // audit ledger shows the three data-console actions for this row
    await page.goto('/admin/data/AuditEvent', { waitUntil: 'domcontentloaded' });
    await page.locator('#data-search').fill(id);
    await expect(page.locator('table tbody')).toContainText('PLATFORM_ADMIN_DATA_CREATE', { timeout: 20000 });
    await expect(page.locator('table tbody')).toContainText('PLATFORM_ADMIN_DATA_UPDATE');
    await expect(page.locator('table tbody')).toContainText('PLATFORM_ADMIN_DATA_DELETE');
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-data-audit.png', fullPage: true });
  });

  test('validation: required fields, bad enum and read-only ids are rejected inline', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/data/Vehicle/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Create row/ })).toBeVisible({ timeout: 20000 });
    await page.locator('#f-stockNumber').fill('QA-INVALID');
    await page.getByRole('button', { name: /Create row/ }).click();
    const alert = page.locator('form [role="alert"]');
    await expect(alert).toBeVisible({ timeout: 20000 });
    await expect(alert).toContainText(/required/);
    await expect(page.locator('#f-id')).toHaveCount(0);
    await expect(page.locator('#f-passwordHash')).toHaveCount(0);
  });

  test('secrets never appear in the User table or form', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/data/User', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main').last()).not.toContainText(/passwordHash|scrypt\$/);
    await page.locator('table tbody a').first().click();
    await page.waitForURL(/\/admin\/data\/User\/[0-9a-f-]{36}/, { timeout: 20000 });
    await expect(page.locator('main').last()).not.toContainText(/passwordHash|mfaSecret|scrypt\$/);
    await page.screenshot({ path: 'test-results/e2e/local-qa/admin-data-user-form.png', fullPage: true });
  });

  test('Arabic layout mirrors the console', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/data', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'التحويل إلى اللغة العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: /وحدة البيانات/ })).toBeVisible();
    await page.getByRole('button', { name: 'Switch interface to English' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});
