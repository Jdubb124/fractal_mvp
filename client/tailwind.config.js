/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}",
    ],
    theme: {
      extend: {
        colors: {
          // Fractal dark theme colors
          'bg-dark': '#0a0a0f',
          'bg-panel': '#12121a',
          'bg-card': '#1a1a24',
          'bg-hover': '#22222e',
          'accent-primary': '#6366f1',
          'accent-secondary': '#8b5cf6',
          'text-primary': '#f8fafc',
          'text-secondary': '#94a3b8',
          'text-muted': '#64748b',
          'border-color': '#2a2a3a',
          'success': '#10b981',
          'warning': '#f59e0b',
          'error': '#ef4444',
          // Hierarchy colors
          'campaign': '#6366f1',
          'segment': '#8b5cf6',
          'channel': '#a855f7',
          'asset': '#d946ef',
          'version': '#f472b6',
        },
        fontFamily: {
          'sans': ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          'mono': ['Space Mono', 'Monaco', 'Menlo', 'monospace'],
        },
        borderRadius: {
          'sm': '6px',
          'md': '10px',
          'lg': '16px',
        },
        boxShadow: {
          'glow': '0 0 40px rgba(99, 102, 241, 0.15)',
          'glow-sm': '0 0 20px rgba(99, 102, 241, 0.1)',
        },
        backgroundImage: {
          'accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        },
      },
    },
    plugins: [],
  }