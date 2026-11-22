# Design system

_Lives in `packages/ui`. Review it live at `/design` with `ENABLE_DESIGN_PREVIEW=true`._

## Concept: eye level

KINORA meets people at eye level. Confident, never shouting. Nothing towers over or talks down to the person using it.

- **Reach:** every control people tap is at least 44px tall. On mobile, key content sits low on the screen, within thumb reach.
- **People carry the colour:** photos, names and connections get colour. The interface stays quiet in mineral and aubergine neutrals.
- **One signature, the kin ring:** a jade ring around an avatar means *connected*, a mango ring means *something new from this person*. It sits outside the photo with a gap so it never covers a face, and it always has a text equivalent.

## Tokens (`packages/ui/src/tokens.ts`)

| Role | Light | Dark | Use |
|------|-------|------|-----|
| `bg` | #F3F5F2 mineral | #16121A aubergine night | Page |
| `surface` | #FFFFFF | #211B27 | Panels, inputs |
| `ink` | #1E1723 aubergine | #F1EEF3 | Text |
| `primary` | #0F6B5C jade | #4FC2AB | Main actions, kin ring |
| `highlight` | #F2A541 mango | #F6B85C | New match or message only, used sparingly |

Plus muted ink, borders, soft tints, and danger/success/warning/info pairs. Each one is listed with its contrast ratio on `/design`.

- **Type:** Schibsted Grotesk (variable, self-hosted via Fontsource) is the only family. Headings use weight 750–850 with tight tracking. Body text is 16px with 1.55 line height. Major-third scale, 13–61px.
- **Shape follows hierarchy:** `control` 8px, `panel` 14px, `person` 24px (profile photos and cards). No drop shadows: elevation comes from surface colour and a hairline border.
- **Motion:** 120/200/320ms with one easing curve. It only answers actions. `prefers-reduced-motion` removes it entirely.

**Changing a colour:** edit `tokens.ts`, run `pnpm --filter @kinora/ui tokens`, then `pnpm test`. The contrast tests fail if any text pairing drops below WCAG AA (4.5:1 text, 3:1 boundaries and focus), and the drift test fails if `tokens.css` isn't regenerated.

## Themes

Light by default. Dark follows the operating system. Any element can force a theme with `data-theme="light"` or `"dark"`, which is how `/design` shows both side by side. There's no theme toggle yet: one will come with account settings rather than as a control that does nothing.

## Components (`@kinora/ui`)

| Component | Notes |
|-----------|-------|
| `Button`, `buttonVariants` | primary, secondary, quiet, danger. `loading` shows a spinner, sets `aria-busy` and blocks repeat presses. Use `buttonVariants()` on links |
| `Field` + `Input` / `Textarea` | Wires `id`, `aria-describedby` (hint and error), `aria-invalid` and `required`. Fields are required unless `optional` |
| `Alert` | info, success, warning, danger. Each has an icon as well as a colour. `live` controls screen-reader announcement |
| `Avatar` | Initials fallback (grapheme-aware), sizes, and the kin ring with a required `ringLabel` |
| `Skeleton`, `Spinner`, `EmptyState`, `Panel` | Loading, empty and container states. Empty states always offer the next action |

Components follow shadcn/ui conventions (cva variants, `cn()` merge) and `components.json` points the shadcn CLI at this package.

## Writing

Sentence case and plain verbs. Buttons say what happens ("Send message", not "Submit"). Errors say what went wrong and how to fix it, without apologising. Empty states invite the next step. Avoid labels that treat people of short stature as a curiosity (`idea.md` §6).

## Localisation

All member-facing copy is in `apps/*/messages/<locale>.json` (next-intl, ICU format). English ships first. A test checks that every locale has the same keys and placeholders as English.
