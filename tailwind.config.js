/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--ink)",
        card: "var(--surface-card)",
        "card-foreground": "var(--ink)",
        popover: "var(--surface-card)",
        "popover-foreground": "var(--ink)",
        muted: "var(--surface-raised)",
        "muted-foreground": "var(--fg-secondary)",
        accent: "var(--surface-side)",
        "accent-foreground": "var(--ink)",
        primary: "var(--accent)",
        "primary-foreground": "var(--accent-foreground)",
        secondary: "var(--surface-side)",
        "secondary-foreground": "var(--ink)",
        destructive: "#b91c1c",
        "destructive-foreground": "#fff8f6",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

