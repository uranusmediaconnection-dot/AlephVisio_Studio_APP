// Shared design tokens consumed by tailwind.config.ts.
// These map Tailwind theme keys onto the CSS custom properties defined in
// app/globals.css so the utility classes and the hand-written CSS stay in sync.

export const tailwindTokens = {
  colors: {
    background: {
      primary: "var(--bg-primary)",
      secondary: "var(--bg-secondary)",
      tertiary: "var(--bg-tertiary)",
      elevated: "var(--bg-elevated)"
    },
    accent: {
      DEFAULT: "var(--accent)",
      dark: "var(--accent-dark)",
      purple: "var(--accent-purple)"
    },
    muted: "var(--text-muted)",
    event: {
      blue: "var(--event-blue)",
      green: "var(--event-green)",
      purple: "var(--event-purple)",
      orange: "var(--event-orange)",
      red: "var(--event-red)",
      pink: "var(--event-pink)",
      teal: "var(--event-teal)"
    }
  },
  boxShadow: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    button: "var(--shadow-button)",
    glass: "var(--shadow-glass)"
  },
  borderRadius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    "3xl": "var(--radius-3xl)"
  }
};
