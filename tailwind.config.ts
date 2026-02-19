import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        basalt: {
          DEFAULT: '#1a1a1a',
          50: '#2a2a2a',
          100: '#242424',
          200: '#1e1e1e',
          900: '#0d0d0d',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          50: '#faf8f4',
          100: '#f5f0e8',
          200: '#ebe3d6',
        },
        sandstone: {
          DEFAULT: '#c9a87c',
          light: '#d4bb96',
          dark: '#b08d5b',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
        'input': '10px',
      },
      animation: {
        'gradient-drift': 'gradient-drift 15s ease infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'stage-halo': 'stage-halo 2s ease-in-out infinite',
        'stage-enter': 'stage-enter 0.3s ease-out forwards',
      },
      keyframes: {
        'gradient-drift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stage-halo': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0.6' },
        },
        'stage-enter': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}

export default config
