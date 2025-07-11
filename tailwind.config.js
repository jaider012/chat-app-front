/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#253659',
        secondary: '#03A696',
        accent: '#F27457',
        tertiary: '#04BF9D',
        error: '#BF665E',
        background: {
          light: '#F7F9FB',
          dark: '#1A2238'
        },
        text: {
          'primary-light': '#253659',
          'primary-dark': '#FFFFFF',
          'secondary-light': '#6B7280',
          'secondary-dark': '#A0AEC0'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'header': ['Lexend', 'sans-serif']
      },
      fontWeight: {
        'header': '700'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-down': 'scaleDown 0.1s ease-in-out',
        'pulse-accent': 'pulseAccent 1s ease-in-out infinite',
        'typing-dots': 'typingDots 1.5s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleDown: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        },
        pulseAccent: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' }
        },
        typingDots: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}