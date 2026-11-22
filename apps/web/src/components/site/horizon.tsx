import { Avatar, cn } from "@kinora/ui";

type Node = {
  name: string;
  ring?: "connection" | "new";
  /** Hidden on the narrowest screens so the row never crowds. */
  wide?: boolean;
};

/**
 * The homepage illustration: invented people side by side on one horizon line, all the
 * same size, nobody above anybody. Two of them connect: the line between them turns jade
 * (the page's one animation) and both get the kin ring. One has something new (mango).
 */
export function Horizon({
  people,
  labels,
}: {
  people: Node[];
  labels: { connected: string; new: string };
}) {
  return (
    <div aria-hidden="true" className="flex w-full items-start">
      <Segment />
      {people.map((person, i) => {
        const next = people[i + 1];
        const link = person.ring === "connection" && next?.ring === "connection";
        return (
          <div key={person.name} className={cn("contents", person.wide && "max-sm:hidden")}>
            <div className="flex w-14 shrink-0 flex-col items-center gap-3 lg:w-24">
              <Avatar
                name={person.name}
                ring={person.ring}
                ringLabel={
                  person.ring ? labels[person.ring === "new" ? "new" : "connected"] : undefined
                }
                className={cn(
                  "size-14 text-lg lg:size-24 lg:text-3xl",
                  person.ring !== "connection" && "border border-line-strong bg-surface text-ink",
                )}
              />
              {person.ring === "new" ? (
                <span className="text-center text-xs font-semibold whitespace-nowrap text-ink">
                  {labels.new}
                </span>
              ) : null}
            </div>
            {i < people.length - 1 ? (
              <Segment connected={link} label={link ? labels.connected : undefined} />
            ) : null}
          </div>
        );
      })}
      <Segment />
    </div>
  );
}

function Segment({ connected = false, label }: { connected?: boolean; label?: string }) {
  return (
    <span className="relative mt-7 flex min-w-3 flex-1 flex-col items-center lg:mt-12">
      <span
        className={cn(
          "block w-full",
          connected ? "kn-connect -mt-px h-[3px] bg-primary" : "h-px bg-line-strong",
        )}
      />
      {label ? (
        <span className="mt-9 text-xs font-semibold whitespace-nowrap text-primary-ink lg:mt-14">
          {label}
        </span>
      ) : null}
    </span>
  );
}
