/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors (light mode)
        'bg-dark': '#ffffff',
        'bg-panel': '#f8fafc',
        'bg-card': '#f1f5f9',
        'bg-hover': '#e2e8f0',
        'bg-input': '#ffffff',
        'bg-primary': '#ffffff',
        'bg-secondary': '#f8fafc',

        // Text colors (dark on light)
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-muted': '#94a3b8',

        // Border colors
        'border-color': '#e2e8f0',

        // Accent colors
        'accent-primary': '#8b5cf6',
        'accent-secondary': '#a78bfa',

        // Hierarchy level colors
        'campaign': '#8b5cf6',
        'segment': '#06b6d4',
        'channel': '#10b981',
        'asset': '#f59e0b',
        'version': '#ec4899',

        // Status colors
        'success': '#22c55e',
        'warning': '#eab308',
        'error': '#ef4444',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
      },
    },
  },
  plugins: [],
}
