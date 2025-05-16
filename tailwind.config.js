/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './src/frontend/index.html', 
    './src/frontend/index.tsx',
    './src/frontend/App.tsx',
    './src/frontend/pages/**/*.tsx',
    './src/frontend/components/**/*.tsx',
    './src/frontend/features/**/*.tsx',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Map color names to CSS variables defined in globals.css
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", // Reverted to use variable
        foreground: "hsl(var(--foreground))", // Reverted to use variable
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Keep your custom YT colors if needed, but core should use variables
        yt: {
          red: "hsl(var(--yt-red))", // Use variable if defined
          almostBlack: "hsl(var(--yt-almost-black))", // Use variable if defined
          lightGray: "hsl(var(--yt-light-gray))",
          darkGray: "hsl(var(--yt-dark-gray))",
          textPrimaryDark: "hsl(var(--yt-text-primary-dark))",
          textSecondaryDark: "hsl(var(--yt-text-secondary-dark))",
          textPrimaryLight: "hsl(var(--yt-text-primary-light))",
          textSecondaryLight: "hsl(var(--yt-text-secondary-light))",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/line-clamp")
  ],
}; 