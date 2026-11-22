export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only rounded-control bg-surface px-4 py-3 font-semibold text-primary-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10"
    >
      {label}
    </a>
  );
}
