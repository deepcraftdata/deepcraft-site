import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#0a0e1a',
        bg2:    '#0d1120',
        blue:   '#3b82f6',
        purple: '#8b5cf6',
        green:  '#22c55e',
        text:   '#e2e8f0',
        muted:  '#94a3b8',
        dim:    '#64748b',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body':          '#94a3b8',
            '--tw-prose-headings':      '#e2e8f0',
            '--tw-prose-lead':          '#94a3b8',
            '--tw-prose-links':         '#3b82f6',
            '--tw-prose-bold':          '#e2e8f0',
            '--tw-prose-counters':      '#64748b',
            '--tw-prose-bullets':       '#64748b',
            '--tw-prose-hr':            'rgba(255,255,255,0.07)',
            '--tw-prose-quotes':        '#e2e8f0',
            '--tw-prose-quote-borders': '#3b82f6',
            '--tw-prose-captions':      '#64748b',
            '--tw-prose-code':          '#e2e8f0',
            '--tw-prose-pre-code':      '#e2e8f0',
            '--tw-prose-pre-bg':        'rgba(255,255,255,0.04)',
            '--tw-prose-th-borders':    'rgba(255,255,255,0.07)',
            '--tw-prose-td-borders':    'rgba(255,255,255,0.07)',
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [typography],
};
