// Colours, type scale, radii and spacing come from the shared Stitch preset.
// App-specific tokens go in `theme.extend` below; do not copy preset values here.
const { automotiveTailwindPreset } = require('../../packages/ui/src/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [automotiveTailwindPreset],
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface-tint': '#e9c349',
      },
      spacing: {
        'gutter-desktop-wide': '2rem',
        'gutter-mobile': '0.75rem',
      },
    },
  },
  plugins: [],
};
