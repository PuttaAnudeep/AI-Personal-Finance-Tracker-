/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC',
          400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA',
          800: '#3730A3', 900: '#312E81', DEFAULT: '#4F46E5',
        },
        accent: {
          50: '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9',
          400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2', 700: '#0E7490',
          800: '#155E75', 900: '#164E63', DEFAULT: '#06B6D4',
        },
        success: { 50: '#F0FDF4', 100: '#DCFCE7', 500: '#22C55E', 600: '#16A34A', 700: '#15803D', DEFAULT: '#22C55E' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', DEFAULT: '#F59E0B' },
        danger: { 50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', DEFAULT: '#EF4444' },
        ink: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { 'xl2': '1.25rem', 'xl3': '1.5rem', 'xl4': '2rem' },
      boxShadow: {
        'soft': '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.08)',
        'card': '0 1px 3px rgba(15,23,42,0.05), 0 12px 32px -12px rgba(15,23,42,0.12)',
        'glow': '0 0 0 1px rgba(79,70,229,0.12), 0 12px 40px -8px rgba(79,70,229,0.35)',
        'glow-danger': '0 0 0 1px rgba(239,68,68,0.18), 0 12px 40px -8px rgba(239,68,68,0.40)',
      },
      backgroundImage: {
        'grid-light': "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
        'mesh': "radial-gradient(at 0% 0%, rgba(79,70,229,0.18) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(6,182,212,0.16) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(34,197,94,0.12) 0px, transparent 50%)",
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-scale': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'slide-in-up': { '0%': { transform: 'translateY(24px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'shimmer': { '100%': { transform: 'translateX(100%)' } },
        'pulse-glow': { '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.45)' }, '50%': { boxShadow: '0 0 0 12px rgba(239,68,68,0)' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'spin-slow': { '100%': { transform: 'rotate(360deg)' } },
        'dash': { '0%': { strokeDashoffset: '1000' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-in-scale': 'fade-in-scale 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-up': 'slide-in-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer': 'shimmer 1.6s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [],
};
