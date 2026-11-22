import { cn } from "../cn";

/**
 * The kin ring: KINORA's signature. A jade ring marks a connection, a mango ring
 * marks something new from that person. It sits outside the photo with a gap,
 * so it never covers a face, and it always comes with a text equivalent.
 */
const rings = {
  none: "",
  connection: "ring-3 ring-primary ring-offset-2 ring-offset-bg",
  new: "ring-3 ring-highlight ring-offset-2 ring-offset-bg",
} as const;

const sizes = {
  sm: "size-10 text-sm",
  md: "size-14 text-lg",
  lg: "size-24 text-3xl",
} as const;

export interface AvatarProps {
  /** Display name: used for initials and, when there's no ringLabel, the accessible name. */
  name: string;
  /** Signed, short-lived URL. Omit to show initials. */
  src?: string;
  size?: keyof typeof sizes;
  ring?: keyof typeof rings;
  /** Text equivalent of the ring, e.g. "Connected". Required when ring is set. */
  ringLabel?: string;
  className?: string;
}

/** First letter of the first and last words, grapheme-aware (works for accents and emoji). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = (w: string | undefined) =>
    w ? (segmenter.segment(w)[Symbol.iterator]().next().value?.segment ?? "") : "";
  const letters = words.length > 1 ? first(words[0]) + first(words.at(-1)) : first(words[0]);
  return letters.toLocaleUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  ring = "none",
  ringLabel,
  className,
}: AvatarProps) {
  const label = ringLabel ? `${name}, ${ringLabel}` : name;
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-primary-soft font-bold text-primary-ink",
        sizes[size],
        rings[ring],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URLs; next/image is wired up in 1.5
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
