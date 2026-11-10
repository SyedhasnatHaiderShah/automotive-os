import { test, expect, type Locator, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Keyboard-focus regressions from the 2026-11-06 design audit (S3, S4, S5):
 *  - modal surfaces take focus, keep Tab inside, close on Escape and hand focus back;
 *  - the off-canvas sidebars are out of the tab order while closed;
 *  - controls that reset the outline still show a focus indicator.
 *
 * Public checks run anywhere. Signed-in checks need the local QA data set
 * (`.qa-credentials.local.json`) and are skipped without it.
 */
const credentialsPath = resolve(__dirname, '../../.qa-credentials.local.json');
const creds = existsSync(credentialsPath) ? JSON.parse(readFileSync(credentialsPath, 'utf8')) : null;
const PASSWORD: string = creds?.sharedPassword ?? '';
const accounts: Array<{ email: string; memberships?: string[] }> = creds?.accounts ?? [];
const OWNER = accounts.find((a) => a.memberships?.includes('falcon-ridge-motors:OWNER'))?.email ?? '';
const ADMIN = 'ops.admin@automotive-os.example';

const MOBILE = { width: 390, height: 844 };

async function signIn(page: Page, email: string) {
  await page.goto('/auth?tab=login', { waitUntil: 'networkidle' });
  const emailInput = page.getByPlaceholder('user@autonexa.ae');
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email);
  await page.locator('form input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /Sign In to Dashboard/i }).click();
}

const focusInside = (surface: Locator) =>
  surface.evaluate((el) => el.contains(document.activeElement) && document.activeElement !== document.body);

/** Short description of the focused element, for failure messages. */
const describeFocus = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return 'nothing';
    const label = el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 40);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + label + '" body.class=' + document.body.className;
  });

/** Focus is inside the surface now and after every Tab / Shift+Tab press. */
async function expectFocusTrapped(page: Page, surface: Locator, presses = 12) {
  await expect.poll(() => focusInside(surface), { message: 'focus moves into the surface' }).toBe(true);
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    expect(await focusInside(surface), `focus stays inside after Tab ${i + 1} (focused: ${await describeFocus(page)})`).toBe(true);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    expect(await focusInside(surface), `focus stays inside after Shift+Tab ${i + 1}`).toBe(true);
  }
}

const isFocused = (target: Locator) => target.evaluate((el) => el === document.activeElement);

/** The focused element draws an outline or a ring. */
const hasFocusIndicator = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 && style.outlineColor !== 'rgba(0, 0, 0, 0)';
    return outline || style.boxShadow !== 'none';
  });

test.describe('Keyboard focus — public marketplace', () => {
  test('compare picker traps focus, closes on Escape and returns focus to its opener', async ({ page }) => {
    await page.goto('/compare', { waitUntil: 'networkidle' });
    const opener = page.getByRole('button', { name: /Add Vehicle to Compare/i }).first();
    await expect(opener).toBeVisible({ timeout: 15000 });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: /Select Vehicle to Compare/i });
    await expect(dialog).toBeVisible();
    await expectFocusTrapped(page, dialog);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect.poll(() => isFocused(opener)).toBe(true);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test('mobile filter sheet traps focus, closes on Escape and returns focus to its opener', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/cars', { waitUntil: 'networkidle' });
    const opener = page.getByRole('button', { name: /Filters & Refine/i });
    await expect(opener).toBeVisible({ timeout: 15000 });
    await opener.click();

    const sheet = page.getByRole('dialog', { name: /Filters & Sort/i });
    await expect(sheet).toBeVisible();
    await expectFocusTrapped(page, sheet);

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect.poll(() => isFocused(opener)).toBe(true);
  });

  test('enquiry modal traps focus, closes on Escape and returns focus to its opener', async ({ page }) => {
    await page.goto('/cars', { waitUntil: 'domcontentloaded' });
    await page.locator('a[href^="/cars/"]').first().click();
    await page.waitForURL(/\/cars\/[^/?]+/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    const opener = page.getByRole('button', { name: /Request viewing/i }).first();
    await expect(opener).toBeVisible({ timeout: 15000 });
    await opener.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expectFocusTrapped(page, dialog);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect.poll(() => isFocused(opener)).toBe(true);
  });

  test('header logo, emirate select and vehicle card links show a focus indicator', async ({ page }) => {
    await page.goto('/cars', { waitUntil: 'networkidle' });
    await expect(page.locator('a[href^="/cars/"]').first()).toBeVisible({ timeout: 15000 });

    const seen = { logo: false, select: false, card: false };
    for (let i = 0; i < 60 && !(seen.logo && seen.select && seen.card); i += 1) {
      await page.keyboard.press('Tab');
      const kind = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        if (el.matches('header a[href="/"]')) return 'logo';
        if (el.matches('header select')) return 'select';
        if (el.matches('a[href^="/cars/"]') && el.querySelector('img, [role="img"]')) return 'card';
        return null;
      });
      if (!kind) continue;
      expect(await hasFocusIndicator(page), `${kind} shows a focus indicator`).toBe(true);
      seen[kind as keyof typeof seen] = true;
    }
    expect(seen).toEqual({ logo: true, select: true, card: true });
  });
});

test.describe('Keyboard focus — dealer and admin consoles', () => {
  test.skip(!creds, 'local QA data set not seeded (.qa-credentials.local.json missing)');

  for (const consoleApp of [
    { name: 'dealer', email: OWNER, landing: /\/dealer/, sidebar: '#dealer-app-sidebar', toggle: /Toggle dealer navigation/i },
    { name: 'admin', email: ADMIN, landing: /\/admin/, sidebar: '#admin-app-sidebar', toggle: /Toggle admin navigation/i },
  ]) {
    test(`${consoleApp.name}: closed mobile sidebar is out of the tab order; open it is a modal drawer`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await signIn(page, consoleApp.email);
      await page.waitForURL(consoleApp.landing, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator(consoleApp.sidebar);
      const toggle = page.getByRole('button', { name: consoleApp.toggle });
      await expect(toggle).toBeVisible({ timeout: 15000 });

      // Closed: hidden from the accessibility tree and unreachable with Tab.
      await expect(sidebar).toBeHidden();
      for (let i = 0; i < 25; i += 1) {
        await page.keyboard.press('Tab');
        expect(await focusInside(sidebar), `Tab ${i + 1} does not land in the closed sidebar`).toBe(false);
      }

      // Open: focus moves in and stays in; the page behind does not scroll.
      await toggle.click();
      await expect(sidebar).toBeVisible();
      await expectFocusTrapped(page, sidebar, 20);
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

      // Escape closes it and focus returns to the toggle.
      await page.keyboard.press('Escape');
      await expect(sidebar).toBeHidden();
      await expect.poll(() => isFocused(toggle)).toBe(true);

      // A tap on the backdrop closes it too.
      await toggle.click();
      await expect(sidebar).toBeVisible();
      await page.mouse.click(MOBILE.width - 10, MOBILE.height - 10);
      await expect(sidebar).toBeHidden();
    });
  }

  test('admin: identity drawer traps focus and a confirmation dialog stacks on top of it', async ({ page }) => {
    await signIn(page, ADMIN);
    await page.waitForURL(/\/admin/, { timeout: 30000 });
    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.click();

    const drawer = page.getByRole('dialog', { name: /Identity dossier/i });
    await expect(drawer).toBeVisible();
    await expectFocusTrapped(page, drawer);

    // A destructive action opens a second dialog; only the top one handles Tab and Escape.
    const action = drawer.getByRole('button', { name: /Suspend|Reactivate|Revoke|Disable/i }).first();
    if (await action.isVisible().catch(() => false)) {
      await action.click();
      const confirm = page.getByRole('dialog').last();
      await expect(confirm).toBeVisible();
      await expectFocusTrapped(page, confirm, 6);
      await page.keyboard.press('Escape');
      await expect(drawer).toBeVisible();
      await expect.poll(() => focusInside(drawer)).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });
});
