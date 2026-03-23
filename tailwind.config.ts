import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "C:/Users/user/Desktop/홍성준/academy-crm/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          hover: '#F0F0F2',
          dark: '#1D1D1F',
          text: '#1D1D1F',
          sub: '#6E6E73',
          hint: '#AEAEB2',
          accent: '#0071E3',
          'accent-hover': '#0077ED',
          'accent-light': '#E8F2FF',
          danger: '#FF3B30',
          border: 'rgba(0,0,0,0.08)',
        },
        status: {
          new: '#FF9F0A',
          'new-bg': 'rgba(255,159,10,0.15)',
          called: '#0071E3',
          'called-bg': 'rgba(0,113,227,0.15)',
          booked: '#30D158',
          'booked-bg': 'rgba(48,209,88,0.15)',
          done: '#636366',
          'done-bg': 'rgba(99,99,102,0.15)',
          registered: '#BF5AF2',
          'registered-bg': 'rgba(191,90,242,0.15)',
          hold: '#AEAEB2',
          'hold-bg': 'rgba(174,174,178,0.15)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'SF Pro Display', 'sans-serif'],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '18px',
        'apple-xl': '24px',
        'pill': '999px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.06)',
        'elevated': '0 8px 30px rgba(0,0,0,0.10)',
        'modal': '0 20px 60px rgba(0,0,0,0.18)',
      },
      fontSize: {
        'hero': ['56px', { fontWeight: '700', letterSpacing: '-0.03em' }],
        'title': ['28px', { fontWeight: '600', letterSpacing: '-0.02em' }],
        'headline': ['20px', { fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-text': ['15px', { fontWeight: '400', lineHeight: '1.6' }],
        'caption-text': ['13px', { fontWeight: '400' }],
        'label-text': ['12px', { fontWeight: '500', letterSpacing: '0.03em' }],
      },
    },
  },
  plugins: [],
};
export default config;
