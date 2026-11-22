import { Alert, cn } from "@kinora/ui";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Container, h1Class, h2Class } from "./layout";

/** The top of every inner page: its one h1, a lead, and optionally an illustration. */
export function PageHeader({
  title,
  lead,
  aside,
  before,
}: {
  title: ReactNode;
  lead: ReactNode;
  aside?: ReactNode;
  before?: ReactNode;
}) {
  return (
    <Container
      className={cn(
        "grid gap-10 pt-12 pb-10 sm:pt-16",
        aside && "lg:grid-cols-[1.2fr_1fr] lg:items-end",
      )}
    >
      <div className="flex max-w-[44rem] flex-col gap-5">
        {before}
        <h1 className={h1Class}>{title}</h1>
        <p className="text-lg text-ink-muted sm:text-xl">{lead}</p>
      </div>
      {aside}
    </Container>
  );
}

/** A titled block of an inner page. Text stays at a readable measure. */
export function Section({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("flex scroll-mt-6 flex-col gap-4", className)}
    >
      <h2 id={`${id}-title`} className={h2Class}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Paragraphs at a readable measure. */
export function Prose({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  return (
    <div className={cn("flex max-w-[65ch] flex-col gap-4 text-lg", className)}>
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}

/** A plain list with quiet markers. `check` marks things that are included or promised. */
export function BulletList({
  items,
  marker = "dot",
  className,
}: {
  items: string[];
  marker?: "dot" | "check";
  className?: string;
}) {
  return (
    <ul className={cn("flex max-w-[65ch] flex-col gap-2.5 text-lg", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          {marker === "check" ? (
            <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary-ink" />
          ) : (
            <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-ink-muted" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A real sequence of steps. Numbered markers sit on a line that joins them,
 * echoing the kin ring: each step is a ring.
 */
export function Steps({
  steps,
  headingLevel = 3,
}: {
  steps: { title: string; body: string }[];
  headingLevel?: 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <ol className="flex max-w-[60ch] flex-col">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-11 bottom-1 left-[1.375rem] w-px -translate-x-1/2 bg-line-strong"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-primary bg-bg font-[800] text-primary-ink tabular-nums"
          >
            {i + 1}
          </span>
          <div className="flex flex-col gap-1 pt-2">
            <Heading className="text-lg font-[750]">{step.title}</Heading>
            <p className="text-ink-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Short named entries: a bold term followed by what it means. */
export function TermList({
  items,
  className,
}: {
  items: { title: string; body: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("grid max-w-[65ch] gap-5", className)}>
      {items.map((item) => (
        <div key={item.title} className="flex flex-col gap-1">
          <dt className="text-lg font-[750]">{item.title}</dt>
          <dd className="text-ink-muted">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Says plainly which parts of the product aren't open yet. */
export function StagedNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Alert tone="info" title={title} className="max-w-[44rem]">
      {children}
    </Alert>
  );
}

/** Wraps a product preview so it always reads as an illustration, never as real members. */
export function Illustration({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      {children}
      <figcaption className="text-sm text-ink-muted">{caption}</figcaption>
    </figure>
  );
}

/** Body of an inner page: sections spaced evenly down the content column. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <Container className={cn("flex flex-col gap-16 pt-6", className)}>{children}</Container>;
}
