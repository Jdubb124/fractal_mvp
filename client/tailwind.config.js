/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-dark': '#0a0a0a',
        'bg-panel': '#111111',
        'bg-card': '#1a1a1a',
        'bg-hover': '#252525',
        'bg-input': '#1e1e1e',

        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#a1a1aa',
        'text-muted': '#52525b',

        // Border colors
        'border-color': '#27272a',

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
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
}
