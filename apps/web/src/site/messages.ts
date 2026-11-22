/** Values every page passes to its messages, such as the configured brand name. */
export type MessageValues = Record<string, string | number>;

/** The parts of next-intl's translator these helpers use. */
export interface Translator {
  (key: string, values?: MessageValues): string;
  raw(key: string): unknown;
}

/** A translated list of strings (a JSON array in the messages), with values filled in. */
export function list(t: Translator, key: string, values?: MessageValues): string[] {
  const raw = t.raw(key);
  if (!Array.isArray(raw)) return [];
  return raw.map((_, i) => t(`${key}.${i}`, values));
}

/** A translated list of { title, body } entries. */
export function entries(
  t: Translator,
  key: string,
  values?: MessageValues,
): { title: string; body: string }[] {
  const raw = t.raw(key);
  if (!Array.isArray(raw)) return [];
  return raw.map((_, i) => ({
    title: t(`${key}.${i}.title`, values),
    body: t(`${key}.${i}.body`, values),
  }));
}
