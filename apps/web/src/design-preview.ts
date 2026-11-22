/**
 * The /design page shows tokens and components for review. It is off unless
 * ENABLE_DESIGN_PREVIEW is exactly "true", so it never appears in production by accident.
 */
export function isDesignPreviewEnabled(env: Record<string, string | undefined>): boolean {
  return env.ENABLE_DESIGN_PREVIEW === "true";
}
