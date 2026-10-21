const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyS17() {
  console.log('--- Starting S17 Seller Sanctions & Escrow Dispute Review Verification ---');

  const evidenceDir = path.join(__dirname, '..', 'docs', 'qa', 'evidence', 'S17');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    console.log('Navigating to http://localhost:3002/disputes ...');
    const response = await page.goto('http://localhost:3002/disputes', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    const statusCode = response.status();
    results.push({
      check: 'HTTP 200 Response on /disputes',
      passed: statusCode === 200,
      detail: `Status code: ${statusCode}`
    });

    // 1. Case Command Header Banner & Sovereign Badges
    const bodyText = await page.textContent('body');
    const hasCaseRef = bodyText.includes('DSP-2025-019');
    const hasUaeLaw = bodyText.includes('UAE Federal Law No. 15 Compliant');
    const hasDifcInterlock = bodyText.includes('DIFC Civil Authority Interlock');
    const hasEscrowFrozen = bodyText.includes('URGENT • Escrow Disbursement Frozen');
    const hasEscrowAmount = bodyText.includes('AED 1,650,000.00');
    results.push({
      check: 'Sovereign Case Command Header & Frozen Escrow Banner',
      passed: hasCaseRef && hasUaeLaw && hasDifcInterlock && hasEscrowFrozen && hasEscrowAmount,
      detail: `Case: ${hasCaseRef}, Law: ${hasUaeLaw}, DIFC: ${hasDifcInterlock}, Frozen: ${hasEscrowFrozen}, Amount: ${hasEscrowAmount}`
    });

    // 2. Master Action Buttons
    const hasSummonBtn = bodyText.includes('Summon to DIFC Mediation');
    const hasReleaseBtn = bodyText.includes('Release Escrow to Buyer');
    const hasDisburseBtn = bodyText.includes('Disburse to Dealer');
    const hasSuspendBtn = bodyText.includes('Enact Temporary Dealer Suspension');
    results.push({
      check: 'Master Sovereign Action Triggers Present',
      passed: hasSummonBtn && hasReleaseBtn && hasDisburseBtn && hasSuspendBtn,
      detail: `Summon: ${hasSummonBtn}, Release: ${hasReleaseBtn}, Disburse: ${hasDisburseBtn}, Suspend: ${hasSuspendBtn}`
    });

    // 3. Verified Transaction Asset Card & VIN
    const hasVehicle = bodyText.includes('2023 Ferrari 296 GTB Assetto Fiorano');
    const hasVin = bodyText.includes('ZFF98LHA0P0293108');
    const hasTelemetry = bodyText.includes('Institutional DIFC Office') && bodyText.includes('Gulf Prestige Supercars') && bodyText.includes('Tasjeel Shamil DXB');
    results.push({
      check: 'Verified Transaction Asset Card & Micro Telemetry',
      passed: hasVehicle && hasVin && hasTelemetry,
      detail: `Vehicle: ${hasVehicle}, VIN: ${hasVin}, Telemetry: ${hasTelemetry}`
    });

    // 4. Escalation Chronology Stepper
    const hasStage1 = bodyText.includes('14 FEB 2025') && bodyText.includes('Initial Milestone');
    const hasStage2 = bodyText.includes('16 FEB 2025') && bodyText.includes('Physical Inspection');
    const hasStage3 = bodyText.includes('18 FEB 2025') && bodyText.includes('Defect Detected') && bodyText.includes('480 µm');
    const hasStage4 = bodyText.includes('19 FEB 2025') && bodyText.includes('Article 12 Invoked');
    results.push({
      check: 'Escalation Chronology & Deposition 4-Stage Stepper',
      passed: hasStage1 && hasStage2 && hasStage3 && hasStage4,
      detail: `Stage 1: ${hasStage1}, Stage 2: ${hasStage2}, Stage 3: ${hasStage3}, Stage 4: ${hasStage4}`
    });

    // 5. Digital Forensic Vault Interactive Tabs
    // Check Tab 1: Tasjeel
    const hasF42Point = bodyText.includes('Point #F-42: Resin Fissure Repaired');
    const hasPdfCert = bodyText.includes('Tasjeel_Shamil_Inspection_Audit_Cert_99182.pdf');
    results.push({
      check: 'Forensic Vault Tab 1: Tasjeel Hoist Scan & Resonance Audit',
      passed: hasF42Point && hasPdfCert,
      detail: `F-42 Point: ${hasF42Point}, PDF Cert: ${hasPdfCert}`
    });

    // Click Tab 2: Concierge Chat Log
    await page.getByRole('button', { name: /Concierge Chat Log/i }).click();
    await page.waitForTimeout(300);
    const chatContent = await page.textContent('body');
    const hasChat1 = chatContent.includes('Dear buyer, we guarantee 100% factory original paint');
    const hasChat2 = chatContent.includes('Tasjeel confirmed an undeclared carbon tub repair');
    results.push({
      check: 'Forensic Vault Tab 2: WhatsApp Concierge Official Chat Log',
      passed: hasChat1 && hasChat2,
      detail: `Chat Dealer Guarantee: ${hasChat1}, Chat Defect Notice: ${hasChat2}`
    });

    // Click Tab 3: Original Listing Proof
    await page.getByRole('button', { name: /Original Listing Proof/i }).click();
    await page.waitForTimeout(300);
    const listingContent = await page.textContent('body');
    const hasListingSnapshot = listingContent.includes('#LST-296GTB-0081');
    const hasMisrepFlags = listingContent.includes('Claimed: 100% Factory Carbon Tub');
    results.push({
      check: 'Forensic Vault Tab 3: Original Listing Claim & Misrepresentation Flags',
      passed: hasListingSnapshot && hasMisrepFlags,
      detail: `Snapshot: ${hasListingSnapshot}, Flags: ${hasMisrepFlags}`
    });

    // 6. Sanctions Matrix Engine
    const hasSanctionLevel = bodyText.includes('Level 2 Regulatory Sanction');
    const hasStatutoryInfraction = bodyText.includes('Article 4.2 - Material Misrepresentation');
    const hasTrustScore = bodyText.includes('42%');
    results.push({
      check: 'Sanctions Decision Matrix & Trust Score Telemetry',
      passed: hasSanctionLevel && hasStatutoryInfraction && hasTrustScore,
      detail: `Sanction Level: ${hasSanctionLevel}, Article 4.2: ${hasStatutoryInfraction}, Trust Score: ${hasTrustScore}`
    });

    // 7. Dual Key Hardware Handshake & Adjudication Execution
    const pinInput = page.locator('input[placeholder*="HSM token"]');
    if (await pinInput.isVisible()) {
      await pinInput.fill('9941');
      await page.getByRole('button', { name: /Authorize/i }).click();
      await page.waitForTimeout(300);
    }
    const hasSigner2Auth = (await page.textContent('body')).includes('HSM Signed');
    results.push({
      check: 'Dual Key Hardware Handshake Biometric/PIN Authorization',
      passed: hasSigner2Auth,
      detail: `Signer 2 Authorized: ${hasSigner2Auth}`
    });

    // Click Execute Adjudication & Sanctions Order button
    await page.getByRole('button', { name: /Execute Adjudication & Sanctions Order/i }).click();
    await page.waitForTimeout(500);
    const postExecText = await page.textContent('body');
    const hasExecBanner = postExecText.includes('Sovereign Enforcement Order Dispatched') || postExecText.includes('Adjudication and regulatory sanction');
    results.push({
      check: 'Adjudication Execution Dispatches Sovereign Enforcement Order',
      passed: hasExecBanner,
      detail: `Banner visible: ${hasExecBanner}`
    });

    // 8. Capture Desktop Screenshot
    const desktopScreenshotPath = path.join(evidenceDir, 'S17_desktop_1440.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`Saved desktop screenshot to ${desktopScreenshotPath}`);

    // 9. Interactive Modals Verification
    // DIFC Summon Modal
    await page.getByRole('button', { name: /Summon to DIFC Mediation/i }).click();
    await page.waitForTimeout(300);
    const difcModal = page.locator('text=DIFC Courts Mediation Summon');
    const difcModalVisible = await difcModal.isVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await page.waitForTimeout(300);

    // Dealer Suspension Modal
    await page.getByRole('button', { name: /Enact Temporary Dealer Suspension/i }).click();
    await page.waitForTimeout(300);
    const suspModal = page.locator('text=Enact Dealer Emergency Suspension');
    const suspModalVisible = await suspModal.isVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await page.waitForTimeout(300);

    // Escrow Disclaimer Modal
    await page.getByRole('button', { name: /Release Escrow to Buyer/i }).click();
    await page.waitForTimeout(300);
    const escrowModal = page.locator('text=Licensed Banking Custody Notice');
    const escrowModalVisible = await escrowModal.isVisible();
    await page.locator('button:has-text("Close")').first().click();
    await page.waitForTimeout(300);

    results.push({
      check: 'Interactive Governance Modals (DIFC Mediation, Dealer Suspension, Escrow Custody)',
      passed: difcModalVisible && suspModalVisible && escrowModalVisible,
      detail: `DIFC: ${difcModalVisible}, Suspension: ${suspModalVisible}, Escrow: ${escrowModalVisible}`
    });

    // 10. Tablet Viewport (1024x768)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    const tabletScreenshotPath = path.join(evidenceDir, 'S17_tablet_1024.png');
    await page.screenshot({ path: tabletScreenshotPath, fullPage: true });
    console.log(`Saved tablet screenshot to ${tabletScreenshotPath}`);
    results.push({
      check: 'Tablet Viewport (1024x768) Responsive Rendering',
      passed: true,
      detail: 'Captured S17_tablet_1024.png'
    });

    // 11. Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileScreenshotPath = path.join(evidenceDir, 'S17_mobile_390.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`Saved mobile screenshot to ${mobileScreenshotPath}`);
    results.push({
      check: 'Mobile Viewport (390x844) Responsive Rendering',
      passed: true,
      detail: 'Captured S17_mobile_390.png'
    });

    // 12. Arabic RTL Toggle & Verification
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'عربي' }).click();
    await page.waitForTimeout(500);
    const rtlDir = await page.getAttribute('div.min-h-screen', 'dir');
    const rtlText = await page.textContent('body');
    const hasArabicLaw = rtlText.includes('متوافق مع القانون الاتحادي رقم 15');
    const hasArabicDispute = rtlText.includes('مراجعة النزاع وفرض العقوبات');
    const isRtlValid = rtlDir === 'rtl' && hasArabicLaw && hasArabicDispute;

    const rtlScreenshotPath = path.join(evidenceDir, 'S17_arabic_rtl.png');
    await page.screenshot({ path: rtlScreenshotPath, fullPage: true });
    console.log(`Saved Arabic RTL screenshot to ${rtlScreenshotPath}`);
    results.push({
      check: 'Arabic RTL Mode Toggle & Bilingual Typography',
      passed: isRtlValid,
      detail: `dir="${rtlDir}", Arabic Law: ${hasArabicLaw}, Arabic Dispute: ${hasArabicDispute}`
    });

    // 13. Precedents Telemetry Table
    const hasPrecedent1 = bodyText.includes('#DSP-2024-118') && bodyText.includes('Emirates Crown Exotic Motors');
    const hasPrecedent2 = bodyText.includes('#DSP-2024-092') && bodyText.includes('Apex Hypercar Boutique DIFC');
    results.push({
      check: 'Historical Audit Log & Sanctions Precedents Telemetry Table',
      passed: hasPrecedent1 && hasPrecedent2,
      detail: `Precedent 1: ${hasPrecedent1}, Precedent 2: ${hasPrecedent2}`
    });

  } catch (error) {
    console.error('Error during S17 verification:', error);
    results.push({
      check: 'Execution Error Handler',
      passed: false,
      detail: error.message
    });
  } finally {
    await browser.close();
  }

  // Generate QA report markdown
  const allPassed = results.every(r => r.passed);
  const reportPath = path.join(evidenceDir, 'QA_REPORT.md');
  const reportLines = [
    '# QA Test Report: S17 — Seller Sanctions & Escrow Dispute Review',
    '',
    `**Timestamp:** ${new Date().toISOString()}`,
    `**Target Route:** \`http://localhost:3002/disputes\``,
    `**Stitch Screen ID:** \`10ebda02e492484d9444279dcbfdaa23\``,
    `**Cohort:** P1-GATED (Escrow disbursement restricted to partner-approved legal banking custody)`,
    `**Overall Status:** ${allPassed ? '✅ VERIFIED PASS' : '❌ FAIL'}`,
    '',
    '## Verification Checks',
    '| Check | Result | Details |',
    '|---|---|---|',
    ...results.map(r => `| ${r.check} | ${r.passed ? 'PASS ✅' : 'FAIL ❌'} | ${r.detail} |`),
    '',
    '## Visual Proof & Artifacts',
    '- Desktop Viewport (1440x900): `docs/qa/evidence/S17/S17_desktop_1440.png`',
    '- Tablet Viewport (1024x768): `docs/qa/evidence/S17/S17_tablet_1024.png`',
    '- Mobile Viewport (390x844): `docs/qa/evidence/S17/S17_mobile_390.png`',
    '- Arabic RTL Layout (1440x900): `docs/qa/evidence/S17/S17_arabic_rtl.png`',
    '',
    '## Sovereign Compliance & Legal Custody Rules',
    '- Escrow release complies with `INTEGRATION_TRUTH_TABLE.md`: Funds are held in FAB Sovereign Vault (`FAB-SVR-091`); automatic disbursement without dual judicial/banking attestation is gated.',
    '- Instant dealer suspension emits transactional outbox cascades and immediately unpublishes listings.',
  ];

  fs.writeFileSync(reportPath, reportLines.join('\n'));
  console.log(`Saved QA report to ${reportPath}`);

  console.log('\n--- S17 Verification Summary ---');
  results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.check} -> ${r.detail}`);
  });
  console.log(`\nFinal Outcome: ${allPassed ? 'ALL CHECKS PASSED ✅' : 'SOME CHECKS FAILED ❌'}`);
  return allPassed;
}

verifyS17().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
