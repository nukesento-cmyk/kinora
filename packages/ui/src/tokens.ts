/**
 * KINORA design tokens: the single source of truth for colour, type, space,
 * shape and motion. `src/styles/tokens.css` is generated from this file
 * (`pnpm --filter @kinora/ui tokens`) and a test fails if the two drift.
 * Every text/background pair is contrast-tested in both themes (contrast.test.ts),
 * so a brand colour change can't silently break accessibility.
 *
 * Concept: "eye level". KINORA meets people at eye level: confident but never
 * shouting, controls large and easy to reach, colour reserved for people
 * (photos, names, connections) while the interface stays quiet.
 */

export const colorRoles = [
  "bg", // page background (mineral)
  "surface", // raised panels, inputs
  "surface-sunken", // wells, skeletons
  "ink", // primary text
  "ink-muted", // secondary text
  "line", // decorative dividers (not relied on for meaning)
  "line-strong", // input borders and other boundaries that must be seen (3:1)
  "primary", // jade: primary actions, kin ring
  "primary-hover",
  "on-primary",
  "primary-soft", // jade tint backgrounds
  "primary-ink", // jade text and links
  "highlight", // mango: new match, new message. Use sparingly
  "on-highlight",
  "danger",
  "on-danger",
  "danger-soft",
  "success",
  "success-soft",
  "warning-ink",
  "warning-soft",
  "info-ink",
  "info-soft",
  "focus",
] as const;

export type ColorRole = (typeof colorRoles)[number];
export type Theme = "light" | "dark";
export type Palette = Record<ColorRole, `#${string}`>;

export const palettes: Record<Theme, Palette> = {
  light: {
    bg: "#F3F5F2",
    surface: "#FFFFFF",
    "surface-sunken": "#E6EAE5",
    ink: "#1E1723",
    "ink-muted": "#585160",
    line: "#D5DBD3",
    "line-strong": "#7B8579",
    primary: "#0F6B5C",
    "primary-hover": "#0B5549",
    "on-primary": "#FFFFFF",
    "primary-soft": "#DDEFEA",
    "primary-ink": "#0B5A4D",
    highlight: "#F2A541",
    "on-highlight": "#1E1723",
    danger: "#B42318",
    "on-danger": "#FFFFFF",
    "danger-soft": "#FDECEA",
    success: "#1C6E35",
    "success-soft": "#E3F3E7",
    "warning-ink": "#7A4F00",
    "warning-soft": "#FFF2D3",
    "info-ink": "#2C4A9C",
    "info-soft": "#E7ECFA",
    focus: "#0F6B5C",
  },
  dark: {
    bg: "#16121A",
    surface: "#211B27",
    "surface-sunken": "#100D13",
    ink: "#F1EEF3",
    "ink-muted": "#B6AEBC",
    line: "#352E3B",
    "line-strong": "#837989",
    primary: "#4FC2AB",
    "primary-hover": "#72D4C0",
    "on-primary": "#0A1F1B",
    "primary-soft": "#173430",
    "primary-ink": "#7FDCC8",
    highlight: "#F6B85C",
    "on-highlight": "#1E1723",
    danger: "#F97066",
    "on-danger": "#2A0A07",
    "danger-soft": "#3B1714",
    success: "#62D18D",
    "success-soft": "#14301F",
    "warning-ink": "#F5C451",
    "warning-soft": "#33270E",
    "info-ink": "#A2B8F6",
    "info-soft": "#1B2341",
    focus: "#72D4C0",
  },
};

/**
 * Pairs that must meet WCAG 2.2 contrast in both themes.
 * 4.5 = normal text (1.4.3). 3 = large text, UI boundaries and focus rings (1.4.11).
 */
export const contrastRequirements: Array<{ fg: ColorRole; bg: ColorRole; min: 3 | 4.5 }> = [
  { fg: "ink", bg: "bg", min: 4.5 },
  { fg: "ink", bg: "surface", min: 4.5 },
  { fg: "ink", bg: "surface-sunken", min: 4.5 },
  { fg: "ink-muted", bg: "bg", min: 4.5 },
  { fg: "ink-muted", bg: "surface", min: 4.5 },
  { fg: "on-primary", bg: "primary", min: 4.5 },
  { fg: "on-primary", bg: "primary-hover", min: 4.5 },
  { fg: "primary-ink", bg: "bg", min: 4.5 },
  { fg: "primary-ink", bg: "surface", min: 4.5 },
  { fg: "primary-ink", bg: "primary-soft", min: 4.5 },
  { fg: "on-highlight", bg: "highlight", min: 4.5 },
  { fg: "on-danger", bg: "danger", min: 4.5 },
  { fg: "danger", bg: "surface", min: 4.5 },
  { fg: "danger", bg: "bg", min: 4.5 },
  { fg: "danger", bg: "danger-soft", min: 4.5 },
  { fg: "success", bg: "success-soft", min: 4.5 },
  { fg: "warning-ink", bg: "warning-soft", min: 4.5 },
  { fg: "info-ink", bg: "info-soft", min: 4.5 },
  { fg: "line-strong", bg: "surface", min: 3 },
  { fg: "line-strong", bg: "bg", min: 3 },
  { fg: "primary", bg: "bg", min: 3 },
  { fg: "primary", bg: "surface", min: 3 },
  { fg: "focus", bg: "bg", min: 3 },
  { fg: "focus", bg: "surface", min: 3 },
];

/**
 * Type scale: major third (1.25) on a 16px base, rounded to whole pixels.
 * Line height tightens as size grows; body text stays at 1.55 for readability.
 */
export const typeScale = {
  xs: { size: "0.8125rem", lineHeight: "1.45" }, // 13px
  sm: { size: "0.875rem", lineHeight: "1.5" }, // 14px
  base: { size: "1rem", lineHeight: "1.55" }, // 16px
  lg: { size: "1.25rem", lineHeight: "1.45" }, // 20px
  xl: { size: "1.5625rem", lineHeight: "1.3" }, // 25px
  "2xl": { size: "1.9375rem", lineHeight: "1.2" }, // 31px
  "3xl": { size: "2.4375rem", lineHeight: "1.12" }, // 39px
  "4xl": { size: "3.0625rem", lineHeight: "1.05" }, // 49px
  "5xl": { size: "3.8125rem", lineHeight: "1" }, // 61px
} as const;

/** One family, Schibsted Grotesk (variable 400–900): heavy and tight for display, regular for text. */
export const fonts = {
  sans: '"Schibsted Grotesk Variable", "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif',
} as const;

/** Shape follows hierarchy: small controls, medium panels, large for people (photos, profile cards). */
export const radii = {
  control: "0.5rem",
  panel: "0.875rem",
  person: "1.5rem",
} as const;

/** Motion answers actions. Durations stay short; reduced-motion users get none. */
export const motion = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)",
} as const;

/** Minimum touch target (WCAG 2.5.8 asks 24px; we use 44px for comfortable reach). */
export const touchTarget = "2.75rem";
