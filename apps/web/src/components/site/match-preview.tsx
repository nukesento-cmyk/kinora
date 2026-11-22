import { PersonCard, Tag } from "@kinora/ui";

/** An illustrated match card built from design-system components. Never real data. */
export function MatchPreview({
  name,
  meta,
  ringLabel,
  intention,
  sharedLabel,
  interests,
  headingLevel = 3,
}: {
  name: string;
  meta: string;
  ringLabel: string;
  intention: string;
  sharedLabel?: string;
  interests: string[];
  headingLevel?: 2 | 3 | 4;
}) {
  return (
    <PersonCard
      name={name}
      meta={meta}
      headingLevel={headingLevel}
      avatar={{ ring: "connection", ringLabel }}
      className="max-w-sm"
    >
      <p className="font-semibold text-primary-ink">{ringLabel}</p>
      <p>{intention}</p>
      {sharedLabel ? <p className="text-sm text-ink-muted">{sharedLabel}</p> : null}
      <ul className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <li key={interest}>
            <Tag tone="shared">{interest}</Tag>
          </li>
        ))}
      </ul>
    </PersonCard>
  );
}
