const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const screens = JSON.parse(fs.readFileSync('tests/stitch-parity/screens.json', 'utf8'));

const BASE_URLS = {
  marketplace: 'https://automotive-marketplace-staging.up.railway.app',
  dealer: 'https://automotive-dealer-staging.up.railway.app',
  admin: 'https://admin-staging.syedhasnat.com'
};

const VIEWPORTS = [
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'tablet_1024', width: 1024, height: 768 },
  { name: 'mobile_390', width: 390, height: 844 }
];

async function main() {
  const impDir = path.join(__dirname, '../docs/qa/cf06/implemented');
  fs.mkdirSync(impDir, { recursive: true });

  console.log('Launching headless browser (Fast Mode)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const outPath = path.join(__dirname, '../docs/qa/cf06/staging-capture-results.json');
  let results = [];
  if (fs.existsSync(outPath)) {
    try {
      results = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    } catch (e) {
      results = [];
    }
  }

  for (const screen of screens) {
    const s1440 = path.join(impDir, `${screen.id}-desktop_1440.png`);
    const s1024 = path.join(impDir, `${screen.id}-tablet_1024.png`);
    const s390 = path.join(impDir, `${screen.id}-mobile_390.png`);
    const sRtl = path.join(impDir, `${screen.id}-arabic_rtl.png`);

    if (fs.existsSync(s1440) && fs.existsSync(s1024) && fs.existsSync(s390) && fs.existsSync(sRtl)) {
      console.log(`Screen ${screen.id} already fully captured. Skipping.`);
      continue;
    }

    console.log(`\n========================================`);
    console.log(`Auditing Screen ${screen.id} (${screen.app}): ${screen.path}`);
    console.log(`========================================`);

    let resolvedPath = screen.path
      .replace('{DEALER_SLUG}', 'gargash-autos')
      .replace('{KYB_ID}', 'kyb-req-001')
      .replace('{MODERATION_ID}', 'mod-lst-001');

    const baseUrl = BASE_URLS[screen.app];
    const targetUrl = baseUrl + resolvedPath;

    const screenResult = {
      screen_id: screen.id,
      app: screen.app,
      raw_path: screen.path,
      target_url: targetUrl,
      viewports: {},
      status: 'AUDITED',
      errors: [],
      controls: {
        buttons_total: 0,
        buttons_anonymous: 0,
        links_total: 0,
        inert_hash_links: 0,
        inputs_total: 0
      }
    };

    if (screen.app === 'admin') {
      console.log(`  -> Admin target is gated: ${targetUrl}`);
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        const res = await page.goto(targetUrl, { timeout: 8000, waitUntil: 'domcontentloaded' });
        const statusCode = res ? res.status() : 0;
        console.log(`  -> Admin HTTP Status: ${statusCode}`);
        if (statusCode === 401 || statusCode === 403) {
          screenResult.status = 'BLOCKED_ACCESS';
          screenResult.blocker = 'Cloudflare Zero Trust / HTTP Basic auth gate without provided credentials';
          results = results.filter(r => r.screen_id !== screen.id);
          results.push(screenResult);
          await context.close();
          continue;
        }
      } catch (err) {
        screenResult.status = 'BLOCKED_ACCESS';
        screenResult.blocker = err.message;
        results = results.filter(r => r.screen_id !== screen.id);
        results.push(screenResult);
        await context.close();
        continue;
      }
      await context.close();
    }

    for (const vp of VIEWPORTS) {
      console.log(`  -> Testing ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 AutomotiveOS-Auditor/1.0'
      });
      const page = await context.newPage();

      const pageErrors = [];
      const failedRequests = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      page.on('requestfailed', req => failedRequests.push({ url: req.url(), failure: req.failure() }));

      let httpStatus = 0;
      try {
        const response = await page.goto(targetUrl, {
          timeout: 15000,
          waitUntil: 'domcontentloaded'
        });

        if (response) {
          httpStatus = response.status();
        }

        await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
        await page.waitForTimeout(600);

        const screenshotFile = `${screen.id}-${vp.name}.png`;
        const screenshotPath = path.join(impDir, screenshotFile);
        await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
        console.log(`     Saved screenshot: ${screenshotFile}`);

        const domStats = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const overflow = Math.max(0, scrollWidth - clientWidth);

          const buttons = Array.from(document.querySelectorAll('button'));
          const anonButtons = buttons.filter(b => !(b.textContent || b.getAttribute('aria-label') || b.title || '').trim());

          const links = Array.from(document.querySelectorAll('a'));
          const hashLinks = links.filter(a => a.getAttribute('href') === '#');

          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));

          const headings = {
            h1: document.querySelectorAll('h1').length,
            h2: document.querySelectorAll('h2').length,
            h3: document.querySelectorAll('h3').length
          };

          return {
            overflow,
            scrollWidth,
            clientWidth,
            buttonsCount: buttons.length,
            anonButtonsCount: anonButtons.length,
            linksCount: links.length,
            hashLinksCount: hashLinks.length,
            inputsCount: inputs.length,
            headings
          };
        });

        screenResult.viewports[vp.name] = {
          httpStatus,
          screenshot: screenshotFile,
          overflow: domStats.overflow,
          errors: pageErrors,
          failedRequests: failedRequests.length,
          stats: domStats
        };

        if (vp.name === 'desktop_1440') {
          screenResult.controls.buttons_total = domStats.buttonsCount;
          screenResult.controls.buttons_anonymous = domStats.anonButtonsCount;
          screenResult.controls.links_total = domStats.linksCount;
          screenResult.controls.inert_hash_links = domStats.hashLinksCount;
          screenResult.controls.inputs_total = domStats.inputsCount;
        }

      } catch (err) {
        console.error(`     Error on ${screen.id} ${vp.name}:`, err.message);
        screenResult.viewports[vp.name] = { error: err.message };
      } finally {
        await context.close();
      }
    }

    try {
      console.log(`  -> Testing arabic_rtl (1440x900 dir=rtl)...`);
      const rtlContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: 'ar-AE'
      });
      const rtlPage = await rtlContext.newPage();
      await rtlPage.goto(targetUrl, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await rtlPage.evaluate(() => {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      });
      await rtlPage.waitForTimeout(400);
      const rtlFile = `${screen.id}-arabic_rtl.png`;
      await rtlPage.screenshot({ path: path.join(impDir, rtlFile), fullPage: true, animations: 'disabled' });
      console.log(`     Saved screenshot: ${rtlFile}`);
      screenResult.viewports['arabic_rtl'] = { screenshot: rtlFile };
      await rtlContext.close();
    } catch (err) {
      console.error(`     Error on ${screen.id} arabic_rtl:`, err.message);
      screenResult.viewports['arabic_rtl'] = { error: err.message };
    }

    results = results.filter(r => r.screen_id !== screen.id);
    results.push(screenResult);
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  }

  await browser.close();
  console.log(`\nBrowser capture finished! Results written to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
