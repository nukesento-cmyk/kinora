import {
  colorRoles,
  fonts,
  motion,
  palettes,
  radii,
  touchTarget,
  typeScale,
  type Palette,
} from "./tokens";

const HEADER = `/* GENERATED from packages/ui/src/tokens.ts. Do not edit by hand.
   Regenerate with: pnpm --filter @kinora/ui tokens */`;

function colorVars(p: Palette, indent: string): string {
  return colorRoles.map((role) => `${indent}--kn-${role}: ${p[role]};`).join("\n");
}

/**
 * Render tokens as CSS custom properties.
 * Light is the default; dark applies via the OS setting unless a page or element
 * opts out with data-theme="light", and always under data-theme="dark".
 */
export function renderTokensCss(): string {
  const scalar = [
    `  --kn-font-sans: ${fonts.sans};`,
    ...Object.entries(typeScale).flatMap(([k, v]) => [
      `  --kn-text-${k}: ${v.size};`,
      `  --kn-leading-${k}: ${v.lineHeight};`,
    ]),
    ...Object.entries(radii).map(([k, v]) => `  --kn-radius-${k}: ${v};`),
    `  --kn-duration-fast: ${motion.fast};`,
    `  --kn-duration-base: ${motion.base};`,
    `  --kn-duration-slow: ${motion.slow};`,
    `  --kn-ease: ${motion.ease};`,
    `  --kn-touch-target: ${touchTarget};`,
  ].join("\n");

  return `${HEADER}

:root,
[data-theme="light"] {
  color-scheme: light;
${colorVars(palettes.light, "  ")}
}

:root {
${scalar}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${colorVars(palettes.dark, "    ")}
  }
}

[data-theme="dark"] {
  color-scheme: dark;
${colorVars(palettes.dark, "  ")}
}
`;
}
