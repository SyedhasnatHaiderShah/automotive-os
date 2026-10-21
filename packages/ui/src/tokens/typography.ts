/**
 * Automotive OS Semantic Typography Tokens
 * Source: docs/design/DESIGN_HANDOFF.md & Stitch Theme
 * Bilingual: Outfit / Inter (Latin) + IBM Plex Sans Arabic / Noto Sans Arabic (Arabic RTL) + JetBrains Mono (Telemetry/VIN/Pricing)
 */

export const typography = {
  fontFamilies: {
    display: ['Outfit', 'IBM Plex Sans Arabic', 'sans-serif'],
    body: ['Inter', 'Noto Sans Arabic', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  sizes: {
    displayHero: {
      fontSize: '56px',
      lineHeight: '64px',
      letterSpacing: '-0.02em',
      fontWeight: '600',
    },
    displayHeroMobile: {
      fontSize: '36px',
      lineHeight: '44px',
      letterSpacing: '-0.01em',
      fontWeight: '600',
    },
    headlineXl: {
      fontSize: '40px',
      lineHeight: '48px',
      letterSpacing: '-0.02em',
      fontWeight: '600',
    },
    headlineLg: {
      fontSize: '28px',
      lineHeight: '36px',
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
    headlineMd: {
      fontSize: '22px',
      lineHeight: '28px',
      letterSpacing: '-0.005em',
      fontWeight: '500',
    },
    headlineSm: {
      fontSize: '18px',
      lineHeight: '24px',
      letterSpacing: '0em',
      fontWeight: '500',
    },
    bodyLg: {
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: '-0.005em',
      fontWeight: '400',
    },
    bodyMd: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0em',
      fontWeight: '400',
    },
    bodySm: {
      fontSize: '12px',
      lineHeight: '16px',
      letterSpacing: '0em',
      fontWeight: '400',
    },
    dataCurrencyLg: {
      fontSize: '32px',
      lineHeight: '36px',
      letterSpacing: '-0.02em',
      fontWeight: '700',
    },
    dataMonoNum: {
      fontSize: '13px',
      lineHeight: '18px',
      letterSpacing: '-0.01em',
      fontWeight: '500',
    },
    labelCaps: {
      fontSize: '11px',
      lineHeight: '14px',
      letterSpacing: '0.08em',
      fontWeight: '600',
    },
  },
} as const;
