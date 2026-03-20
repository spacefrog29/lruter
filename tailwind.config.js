/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#5625a8",
          foreground: "#ffffff",
          container: "#6f42c1",
          fixed: "#ebddff",
          "fixed-dim": "#d3bbff",
        },
        secondary: {
          DEFAULT: "#595d78",
          foreground: "#ffffff",
          container: "#dbdeff",
        },
        tertiary: {
          DEFAULT: "#611aa9",
          container: "#7a3ac3",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
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
        surface: {
          DEFAULT: "#faf9f9",
          dim: "#dadada",
          bright: "#faf9f9",
          container: {
            DEFAULT: "#eeeeed",
            low: "#f4f3f3",
            high: "#e9e8e8",
            highest: "#e3e2e2",
            lowest: "#ffffff",
          },
          tint: "#7043c2",
          variant: "#e3e2e2",
        },
        "on-surface": {
          DEFAULT: "#1a1c1c",
          variant: "#4a4453",
        },
        outline: {
          DEFAULT: "#7b7484",
          variant: "#ccc3d5",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
