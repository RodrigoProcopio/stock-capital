export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#1e2241",
        "brand-navy": "#1c2846",
        "brand-100": "#d6d6d6",
        "ink": "#1a1a1a",
        "slate-ink": "#333846",
      },
      boxShadow: {
        subtle: "0 6px 20px rgba(0,0,0,0.08)",
      },
      fontSize: {
        sm: ["1rem", "1.6rem"],       // ~16px
        base: ["1.25rem", "1.9rem"],  // ~20px
        lg: ["1.5rem", "2.1rem"],     // ~24px
        xl: ["1.75rem", "2.4rem"],    // ~28px
        "2xl": ["2rem", "2.6rem"],    // ~32px
        "3xl": ["2.5rem", "3rem"],    // ~40px
        "4xl": ["3rem", "3.4rem"],    // ~48px
      },
        keyframes: {
          shake: {
            '0%, 100%': { transform: 'translateX(0)' },
            '20%': { transform: 'translateX(-3px)' },
            '40%': { transform: 'translateX(3px)' },
            '60%': { transform: 'translateX(-3px)' },
            '80%': { transform: 'translateX(3px)' },
          },
        },
        animation: {
          shake: 'shake 0.6s ease-in-out',
      }      
    },
  },
  plugins: [],
};


