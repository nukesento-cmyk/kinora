import {
  Alert,
  Avatar,
  Button,
  colorRoles,
  contrastRatio,
  contrastRequirements,
  EmptyState,
  Field,
  Input,
  palettes,
  Panel,
  Skeleton,
  Spinner,
  Textarea,
  typeScale,
  type Theme,
} from "@kinora/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDesignPreviewEnabled } from "@/design-preview";

// Internal review page for the design system (milestone 1.3). Specimen copy here is
// written as real product copy but isn't translated: this page never ships to members.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Design system", robots: { index: false } };

function Swatches({ theme }: { theme: Theme }) {
  const p = palettes[theme];
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {colorRoles.map((role) => (
        <li key={role} className="flex items-center gap-3 rounded-control border border-line p-2">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-control border border-line"
            style={{ background: p[role] }}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{role}</span>
            <span className="text-xs text-ink-muted">{p[role]}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ContrastTable({ theme }: { theme: Theme }) {
  const p = palettes[theme];
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Contrast ratios, {theme} theme</caption>
      <thead className="text-ink-muted">
        <tr>
          <th scope="col" className="py-1.5 font-semibold">
            Text
          </th>
          <th scope="col" className="py-1.5 font-semibold">
            On
          </th>
          <th scope="col" className="py-1.5 text-right font-semibold">
            Ratio
          </th>
          <th scope="col" className="py-1.5 text-right font-semibold">
            Needs
          </th>
        </tr>
      </thead>
      <tbody>
        {contrastRequirements.map(({ fg, bg, min }) => (
          <tr key={`${fg}-${bg}`} className="border-t border-line">
            <td className="py-1.5">{fg}</td>
            <td className="py-1.5">{bg}</td>
            <td className="py-1.5 text-right tabular-nums">
              {contrastRatio(p[fg], p[bg]).toFixed(2)}
            </td>
            <td className="py-1.5 text-right tabular-nums">{min}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Components({ theme }: { theme: Theme }) {
  const id = (name: string) => `${theme}-${name}`;
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-labelledby={id("buttons")}>
        <h3 id={id("buttons")} className="text-lg">
          Buttons
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Send message</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="quiet">Skip for now</Button>
          <Button variant="danger">Block member</Button>
          <Button loading loadingLabel="Saving">
            Saving
          </Button>
          <Button disabled>Send message</Button>
          <Button size="sm" variant="secondary">
            Filter
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby={id("fields")}>
        <h3 id={id("fields")} className="text-lg">
          Fields
        </h3>
        <Field
          id={id("display-name")}
          label="Display name"
          hint="This is how other members see you."
        >
          <Input defaultValue="Amani" autoComplete="nickname" />
        </Field>
        <Field
          id={id("email")}
          label="Email"
          error="Enter an email address in the format name@example.com."
        >
          <Input type="email" defaultValue="amani@" autoComplete="email" />
        </Field>
        <Field id={id("bio")} label="About you" optional hint="A few lines about what you enjoy.">
          <Textarea />
        </Field>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby={id("alerts")}>
        <h3 id={id("alerts")} className="text-lg">
          Alerts
        </h3>
        <Alert tone="info" title="Your profile is private until you finish setup." />
        <Alert tone="success" title="Profile saved." />
        <Alert tone="warning" title="Your verification expires in 7 days.">
          Verify again to keep your badge.
        </Alert>
        <Alert tone="danger" title="We couldn't save your changes.">
          Check your connection and try again. Nothing you entered has been lost.
        </Alert>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby={id("people")}>
        <h3 id={id("people")} className="text-lg">
          People
        </h3>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name="Amani Wanjiru" size="lg" />
          <Avatar name="Jean-Luc Moreau" size="md" ring="connection" ringLabel="Connected" />
          <Avatar name="Émile Zola" size="md" ring="new" ringLabel="New message" />
          <Avatar name="Wambui" size="sm" />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby={id("states")}>
        <h3 id={id("states")} className="text-lg">
          Loading and empty
        </h3>
        <div className="flex items-center gap-3 text-ink-muted">
          <Spinner label="Loading matches" /> <span aria-hidden="true">Loading matches</span>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
        <EmptyState
          title="No matches yet"
          description="When someone you liked likes you back, you'll both see each other here. Discover people who share your interests to get started."
          action={<Button variant="secondary">Discover people</Button>}
        />
      </section>
    </div>
  );
}

function ThemePanel({ theme, title }: { theme: Theme; title: string }) {
  return (
    <div data-theme={theme} className="bg-bg text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <h2 className="text-3xl">{title}</h2>
        <Panel>
          <h3 className="mb-4 text-lg">Colour</h3>
          <Swatches theme={theme} />
        </Panel>
        <Panel>
          <h3 className="mb-4 text-lg">Contrast (WCAG 2.2)</h3>
          <ContrastTable theme={theme} />
        </Panel>
        <Panel>
          <Components theme={theme} />
        </Panel>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  if (!isDesignPreviewEnabled(process.env)) notFound();

  return (
    <main>
      <div data-theme="light" className="bg-bg text-ink">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pt-16 pb-4">
          <h1 className="text-5xl font-[850] tracking-[-0.035em]">Design system</h1>
          <p className="max-w-[60ch] text-lg text-ink-muted">
            Tokens and components from <code>@kinora/ui</code>, shown in both themes. Every text
            pairing is contrast-checked in tests.
          </p>
          <ol className="flex flex-col gap-3">
            {Object.entries(typeScale)
              .reverse()
              .map(([step, { size }]) => (
                <li key={step} className="flex items-baseline gap-4">
                  <span className="w-12 shrink-0 text-sm text-ink-muted">{step}</span>
                  <span
                    style={{ fontSize: size }}
                    className="font-bold leading-tight tracking-tight"
                  >
                    Meet people at eye level
                  </span>
                </li>
              ))}
          </ol>
        </div>
      </div>
      <ThemePanel theme="light" title="Light" />
      <ThemePanel theme="dark" title="Dark" />
    </main>
  );
}
