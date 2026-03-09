/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0F14',
        surface: '#161A23',
        cyan: '#00D4FF',
        amber: '#FFB347',
        gold: '#F4C542',
        text: '#F0F2F5',
        muted: '#6B7280',
        error: '#FF4D4F',
      },
      fontFamily: {
        heading: ['"Clash Display"', 'Sora', 'system-ui', 'sans-serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
      },
      boxShadow: {
        glow: '0 14px 36px rgba(0,212,255,0.22)',
      },
    },
  },
  plugins: [],
}
