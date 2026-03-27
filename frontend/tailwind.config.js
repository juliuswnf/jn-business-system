const homeMonochromeScale = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b'
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: { ...homeMonochromeScale },
        cyan: { ...homeMonochromeScale },
        purple: { ...homeMonochromeScale },
        indigo: { ...homeMonochromeScale },
        green: { ...homeMonochromeScale },
        emerald: { ...homeMonochromeScale },
        teal: { ...homeMonochromeScale },
        sky: { ...homeMonochromeScale },
        violet: { ...homeMonochromeScale },
        fuchsia: { ...homeMonochromeScale },
        pink: { ...homeMonochromeScale },
        rose: { ...homeMonochromeScale },
        red: { ...homeMonochromeScale },
        orange: { ...homeMonochromeScale },
        amber: { ...homeMonochromeScale },
        yellow: { ...homeMonochromeScale },
        lime: { ...homeMonochromeScale },
        primary: '#0f172a',
        'primary-dark': '#0d1428',
        secondary: '#1a1f36',
        accent: '#52525b',
        'accent-light': '#71717a',
        slate: {
          350: '#64748b',
          450: '#54606d',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#0b1220',
        },
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          lg: '2rem',
          xl: '3rem',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px rgba(113, 113, 122, 0.25)',
        'glow-teal-lg': '0 0 40px rgba(113, 113, 122, 0.2)',
        'inner-glow': 'inset 0 1px 2px rgba(113, 113, 122, 0.15)',
      },
      borderColor: {
        'teal-glow': 'rgba(113, 113, 122, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(113, 113, 122, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(113, 113, 122, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(0px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
