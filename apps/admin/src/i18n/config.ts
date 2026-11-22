/**
 * Locales the staff app ships. English first (idea.md §23); adding a language means
 * adding messages/<locale>.json and listing it here. The parity test enforces that
 * every locale has exactly the same keys as English.
 */
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
