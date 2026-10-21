/**
 * Obsidian & Studio Glass Design System Color Tokens
 * Source: docs/design/DESIGN_HANDOFF.md & Stitch Project 4467699827252507387
 */

export const colors = {
  // Obsidian Dark Mode (Consumer Marketplace)
  surface: {
    DEFAULT: '#101419',
    dim: '#101419',
    bright: '#36393f',
    lowest: '#0a0e13',
    low: '#181c21',
    container: '#1c2025',
    high: '#262a30',
    highest: '#31353b',
    variant: '#31353b',
  },
  onSurface: {
    DEFAULT: '#e0e2ea',
    variant: '#d0c5af',
  },
  outline: {
    DEFAULT: '#99907c',
    variant: '#4d4635',
  },

  // Primary: Metallic Gold
  primary: {
    DEFAULT: '#f2ca50',
    container: '#d4af37',
    fixed: '#ffe088',
    fixedDim: '#e9c349',
    onPrimary: '#3c2f00',
    onContainer: '#554300',
  },

  // Secondary: Telemetry Azure
  secondary: {
    DEFAULT: '#7bd0ff',
    container: '#00a6e0',
    fixed: '#c4e7ff',
    fixedDim: '#7bd0ff',
    onSecondary: '#00354a',
    onContainer: '#00374d',
  },

  // Tertiary: Verified Emerald
  tertiary: {
    DEFAULT: '#58e7aa',
    container: '#33ca90',
    fixed: '#6ffbbe',
    fixedDim: '#4edea3',
    onTertiary: '#003824',
    onContainer: '#005035',
  },

  // Error / Blocked
  error: {
    DEFAULT: '#ffb4ab',
    container: '#93000a',
    onError: '#690005',
    onContainer: '#ffdad6',
  },

  // Light Studio Glass (DMS & Platform Admin)
  studioGlass: {
    canvas: '#f8fafc',
    surface: 'rgba(255, 255, 255, 0.85)',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
  },
} as const;
