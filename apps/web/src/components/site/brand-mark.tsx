import Link from "next/link";

/** The brand name with the kin ring: the site's logo, linking home. */
export function BrandMark({ name, label }: { name: string; label: string }) {
  return (
    <Link
      href="/"
      aria-label={label}
      className="inline-flex min-h-touch items-center gap-2.5 rounded-control text-xl font-[850] tracking-[-0.035em]"
    >
      <span aria-hidden="true" className="size-6 rounded-full border-[5px] border-primary" />
      <span aria-hidden="true">{name}</span>
    </Link>
  );
}
