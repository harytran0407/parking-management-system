/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // set theme by class
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
<<<<<<< HEAD
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
=======
      
>>>>>>> origin/main
      colors: {
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      
      keyframes: {
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(10000%)' }, // Điều chỉnh 10000% tùy độ cao luồng video
          '100%': { transform: 'translateY(0%)' },
        },
      },
      animation: {
        'wobble-slow': 'wobble 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}