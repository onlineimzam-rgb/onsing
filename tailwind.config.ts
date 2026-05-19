import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        // Koyu lacivert / siyah ana zemin
        navy: {
          50: '#f1f4f9',
          100: '#dde4ee',
          200: '#b9c6d8',
          300: '#8ea0bb',
          400: '#637b9c',
          500: '#475e80',
          600: '#374a66',
          700: '#293a53',
          800: '#1c2a40',
          900: '#121d31',
          950: '#0a1224',
        },
        // Altın sarısı (logodaki sarı)
        gold: {
          50: '#fffbe8',
          100: '#fff5c2',
          200: '#ffe988',
          300: '#ffd844',
          400: '#ffc814',
          500: '#f5b800',
          600: '#d49100',
          700: '#a96903',
          800: '#8c530a',
          900: '#76450f',
          950: '#452404',
        },
        // Yardımcı gri
        slate: {
          850: '#172033',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #ffd844 0%, #f5b800 50%, #d49100 100%)',
        'navy-gradient': 'linear-gradient(135deg, #0a1224 0%, #1c2a40 100%)',
        'hero-overlay':
          'linear-gradient(to bottom, rgba(10,18,36,0.55) 0%, rgba(10,18,36,0.85) 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        gold: '0 10px 30px -10px rgba(245, 184, 0, 0.4)',
        card: '0 4px 20px -4px rgba(10, 18, 36, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
