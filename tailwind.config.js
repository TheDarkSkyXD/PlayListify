/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media' or 'class'
  content: [
    "./src/frontend/**/*.{js,jsx,ts,tsx,html}",
    "./src/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF0000', // YouTube Red
          // It's good practice to define shades if needed, e.g., 50, 100, ..., 900
          // For now, just the default.
          // Example shades (can be generated using a tool)
          '50': '#ffe5e5',
          '100': '#ffcccc',
          '200': '#ff9999',
          '300': '#ff6666',
          '400': '#ff3333',
          '500': '#FF0000',
          '600': '#cc0000',
          '700': '#990000',
          '800': '#660000',
          '900': '#330000',
        },
        // Dark Mode Palette
        dark: {
          background: '#181818',       // Main Background
          'background-secondary': '#212121', // Secondary Background
          'background-tertiary': '#3d3d3d',  // Tertiary Background
          text: '#FFFFFF',              // Primary Text
          'text-secondary': '#AAAAAA',   // Secondary Text
          accent: '#FF0000',            // Accent (Red)
        },
        // Light Mode Palette
        light: {
          background: '#FFFFFF',       // Main Background
          'background-secondary': '#EDEDED', // Secondary Background
          // Tertiary background for light mode can be a slightly darker gray or derived
          'background-tertiary': '#E0E0E0', // Example
          text: '#212121',              // Primary Text
          'text-secondary': '#808080',   // Secondary Text
          accent: '#FF0000',            // Accent (Red)
        },
        // Neutral Colors
        neutral: {
          // Based on #AAAAAA for borders and secondary UI elements
          // Can also be a scale
          '50': '#f5f5f5',
          '100': '#e5e5e5',
          '200': '#cccccc',
          '300': '#b2b2b2',
          '400': '#AAAAAA', // Workflow defined neutral
          '500': '#888888',
          '600': '#666666',
          '700': '#4d4d4d',
          '800': '#333333',
          '900': '#1f1f1f',
          // Specific dark mode neutrals based on workflow
          'yt-dark-main': '#181818',
          'yt-dark-secondary': '#212121',
          'yt-dark-tertiary': '#3d3d3d',
          'yt-light-main': '#FFFFFF',
          'yt-light-secondary': '#EDEDED',
        }
      },
      // Shadcn UI often requires these CSS variables
      // This is a common setup, adjust based on actual shadcn init if different
      backgroundColor: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      textColor: {
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
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
  plugins: [require("tailwindcss-animate")], // Shadcn often uses this
};