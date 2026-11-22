import type { ReactNode } from "react";
import { cn } from "../cn";
import { Avatar, type AvatarProps } from "./avatar";

export interface PersonCardProps {
  /** Display name, shown as the card's title. */
  name: string;
  /** A short line under the name, e.g. age and city. */
  meta?: ReactNode;
  /** Avatar props (photo, ring and its label). The name is reused. */
  avatar?: Omit<AvatarProps, "name" | "size">;
  /** Heading level for the name, so the card fits the page outline. */
  headingLevel?: 2 | 3 | 4;
  children?: ReactNode;
  className?: string;
}

/**
 * A person, as members see them in discovery and matches: avatar with the kin ring,
 * name and a few facts. Uses the "person" radius so people read differently from panels.
 */
export function PersonCard({
  name,
  meta,
  avatar,
  headingLevel = 3,
  children,
  className,
}: PersonCardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-person border border-line bg-surface p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar
          name={name}
          size="lg"
          {...avatar}
          className={cn("ring-offset-surface", avatar?.className)}
        />
        <div className="flex min-w-0 flex-col">
          <Heading className="text-xl">{name}</Heading>
          {meta ? <p className="text-ink-muted">{meta}</p> : null}
        </div>
      </div>
      {children}
    </article>
  );
}
