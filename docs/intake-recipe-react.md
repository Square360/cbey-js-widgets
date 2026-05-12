# Intake recipe — React (Lovable export → catalog widget)

This is the canonical version of the recipe; the upstream plan doc in
`cbey-d8/docs/2026-05-12-js-widget-paragraph-plan.md` points back here.

## Audience

You are a frontend engineer (or Pixel) integrating a freshly-arrived
Lovable.dev export into the catalog as a new widget. Cadence is roughly
one new widget every 3–4 weeks.

This recipe assumes the export is a Vite + React + Tailwind + shadcn
starter, which is what Lovable.dev produces by default. Other React
shapes are easier, not harder — adapt the steps that mention shadcn or
Radix.

## Step 0 — Pre-scope with the author

Before the export arrives, have a scoping conversation with the widget
author:

> Your deliverable is a single component, not a page. No hero, no
> surrounding copy, no nav, no toaster, no router — just the interactive
> piece and its controls.

If the author has access to an AI scoping assistant (Lovable.dev does),
point them at [`isolation-contract.md`](./isolation-contract.md) and let
them pre-trim the export at source. Trimmed exports cut about half the
intake time, but they don't replace the formal recipe — every step
below still runs.

**For Lovable.dev specifically**, send the canonical prompt in
[`intake-prompt-lovable.md`](./intake-prompt-lovable.md) verbatim. That
prompt has been tuned across multiple batches and produces a folder
shape (`src/widgets/{widget-id}/` with `index.tsx`, `data.ts`, and
`README.md`) that maps 1:1 onto step 3 below. The 2026-05-12 intake
(`power-vista-plot`, three widgets) was the first batch where the
shape landed correctly enough to skip almost all of step 4's
page-shell stripping; the prompt is now the standing default for any
new Lovable batch.

## Step 1 — Isolation pre-check

Look at the export. Answer one question:

> Does this widget try to do anything outside its own boundary?
> Routing, page-level toasts, body-scroll lock, URL state, cross-widget
> assumptions?

If yes, send it back with the isolation contract attached, or rescope
in conversation with the author. Everything below assumes a yes here.

Quick grep:

```bash
grep -rn "BrowserRouter\|HashRouter\|Toaster\|Sonner\|TooltipProvider\|QueryClientProvider\|window\.\|document\.body\|localStorage\|sessionStorage" src/
```

Any hit is a flag, not necessarily a fail — read the context.

## Step 2 — Pick the keep-list

Identify which components are the widget and which are scaffolding.

| Keep                                                    | Discard                                          |
| ------------------------------------------------------- | ------------------------------------------------ |
| The actual chart / interactive piece (e.g. MarketMap)   | `App.tsx` router setup                           |
| The data file(s) the chart consumes                     | `pages/Index.tsx` page shell                     |
| The selector / controls that drive the interactive view | `TooltipProvider`, `Toaster`, `Sonner`           |
| The widget's own CSS                                    | `QueryClientProvider`, any global store          |
| Type definitions for the data                           | `main.tsx` (rendering into `#root`)              |
|                                                         | `index.css` page-level body styles               |
|                                                         | shadcn `ui/*` files the widget doesn't reference |

If the widget uses a shadcn `ui/*` component (button, card, select)
deeply, decide per component whether to (a) lift it as a small dependency
into the widget folder, or (b) replace it with a vanilla equivalent. Lean
toward (b) when the shadcn component is just a styling wrapper.

## Step 3 — Lift to `src/widgets/{widget-id}/`

Create the new widget folder. Recommended shape:

```
src/widgets/{widget-id}/
├── index.tsx       # mount function
├── {Widget}.tsx    # the interactive component itself
├── data/           # data files (if any)
├── styles.css      # imports tailwind-base + @tailwind directives
└── README.md       # accessibility brief (Aria reviews)
```

The `index.tsx` exports default:

```ts
const mount = (
  shadowHost: HTMLElement,
  shadowRoot: ShadowRoot,
  config: WidgetConfig,
): (() => void) => {
  const createRoot = (window as any).CbeyReact?.createRoot;
  if (typeof createRoot !== 'function') return () => {};
  const root = createRoot(shadowHost);
  root.render(<Widget config={config} />);
  return () => root.unmount();
};
export default mount;
```

## Step 4 — Strip page-shell assumptions

Find and remove anything that assumed full-page ownership:

- `min-h-screen` / `min-h-dvh` on the outer element
- `bg-background` painted at the top level (the widget shouldn't paint a
  page background)
- `container` / `mx-auto` / `max-w-7xl` width constraints intended for
  page columns (let the editor's surrounding layout drive width)
- Padding intended for page edges (`p-12`, `p-8`); keep only padding the
  widget itself needs

Replace `<h1>` with `<h2>` if the widget is no longer the sole H1 on the
page — though for a charty/figury widget, an `<h2>` at the widget root
is usually right.

## Step 5 — Repoint CSS scope

Move design tokens from `:root` to `:host`. The widget's stylesheet
imports `../../runtimes/tailwind-base.css` first, which carries the
shared `:host`-scoped token block. Anything the widget defined in its
own `index.css` that lived under `@layer base { :root { … } }` either:

- gets moved into `tailwind-base.css` (if it's a token every widget
  wants), or
- gets moved into the widget's `styles.css` under `:host { … }` (if
  it's widget-specific).

Audit:

```bash
grep -n ":root" src/widgets/{widget-id}/
```

Zero hits expected once you're done. The catalog can grow a stylelint
rule (`selector-disallowed-list: [':root']`) to enforce this; not in
v0.1.

## Step 6 — Cull Radix and shadcn deps

Lovable starters carry the entire shadcn-init dep tree (25+ Radix
packages). Strip every one the widget doesn't actually import.

```bash
# In the catalog repo
npm ls @radix-ui/react-select
# Remove anything not imported anywhere under src/widgets/
```

Pay attention to portaling primitives — these portal to `document.body`
by default and break the isolation contract:

| Radix primitive   | Portal default | Mitigation                                                 |
| ----------------- | -------------- | ---------------------------------------------------------- |
| `Tooltip`         | yes            | Pass `container={shadowRoot}` to `Tooltip.Portal`          |
| `Dialog`          | yes            | Pass `container` to `Dialog.Portal`                        |
| `Select`          | yes            | Pass `container` to `Select.Portal`, OR replace with `<select>` |
| `DropdownMenu`    | yes            | Pass `container` to `Portal`                               |
| `Popover`         | yes            | Pass `container` to `Portal`                               |
| `HoverCard`       | yes            | Pass `container` to `Portal`                               |
| `Menubar`         | yes            | Pass `container` to `Portal`                               |
| `NavigationMenu`  | yes            | Pass `container` to `Portal`                               |
| `ContextMenu`     | yes            | Pass `container` to `Portal`                               |

**Default lean: replace with native.** Radix exists to give you styling
control over a non-native control. If the widget only needs basic
behaviour (a 2–3-option `<select>`, a static tooltip, an inline
disclosure), use the native element. Native controls are accessible by
default, smaller in the bundle, and don't require shadow-root container
plumbing.

## Step 7 — Sweep for forbidden patterns

*Updated 2026-05-12 from Shield's security audit (see cbey-d8 `docs/YCBE-898-shield-js-widget-security-audit.md`).*

Search the widget folder one more time:

```bash
grep -rn "BrowserRouter\|HashRouter\|Toaster\|Sonner\|TooltipProvider\|QueryClientProvider\|BroadcastChannel\|sessionStorage\|localStorage\|window\.location\|history\.pushState\|document\.body\|document\.documentElement" src/widgets/{widget-id}/
```

And a second sweep for client-side XSS markers:

```bash
grep -rn "dangerouslySetInnerHTML\|\.innerHTML\s*=\|\.outerHTML\s*=\|insertAdjacentHTML\|\beval\s*(\|new Function" src/widgets/{widget-id}/
```

Address every hit:

- Router refs → delete; the widget renders one tree, no in-app
  navigation.
- `Toaster` / `Sonner` → delete; the widget surfaces feedback inside
  its own shadow root.
- `TooltipProvider` at widget root → only acceptable if the widget
  actually uses Radix tooltips and they're wired with `container`. If
  the widget doesn't tooltip, delete.
- `QueryClientProvider` → delete; if data-fetching is needed, do it
  inline in a `useEffect` (see "Data fetching" below).
- `window.*` mutations → delete; observation (`prefers-reduced-motion`,
  `matchMedia`) is allowed, mutation is not.
- `document.body.*` → delete.
- `localStorage` / `sessionStorage` writes → delete.

### Client-side XSS markers — banned outright

- `dangerouslySetInnerHTML` (React) → banned. If user-controlled HTML
  truly needs to render, reject the widget or escalate for a sanitizer
  review before any other recipe step proceeds. There is no in-recipe
  remediation for this one.
- `eval(...)` → banned outright. No exceptions.
- `new Function(...)` → banned outright. No exceptions.
- Direct DOM string-injection — `el.innerHTML = …`, `el.outerHTML = …`,
  `el.insertAdjacentHTML(…)` → banned outright in widget code. A
  sanitized-library call (DOMPurify or equivalent) is the only path to
  rendering HTML strings, and even that requires an explicit Shield
  review and a documented justification in the widget's README before
  the widget can ship.
- Inline event handlers in JSX bound to editor-supplied strings —
  e.g. `<button onClick={config.callback}>` where `config` is parsed
  from the paragraph's JSON field → banned. Editor JSON is data, not
  code; never treat a string from `config` as an executable handler.
  Handlers must be defined in the widget's own source.

## Step 8 — Externalise React and ReactDOM

Confirm the catalog's `vite.config.ts` externalises `react`,
`react-dom`, and `react-dom/client`. The default config already does;
verify your widget doesn't import them under a different specifier
(some Lovable starters use `import * as ReactDOMClient from 'react-dom/client'`
which works; others use deep paths which need rewriting).

After build, inspect the bundle:

```bash
npm run build
grep -c "createRoot" dist/{widget-id}/{widget-id}.*.js  # expect 0 occurrences of inlined React
```

If a build emits React internals into the widget bundle, the externals
config is wrong. Fix and rebuild.

## Step 9 — Add the manifest entry

Append to `src/manifest.ts`:

```ts
{
  id: '{widget-id}',
  label: 'Human-readable name',
  description: 'One sentence describing what this widget shows.',
  version: '0.1.0',
  runtime: 'react18',
  configSchema: { $ref: 'schemas/{widget-id}.json' },
  deprecated: false,
}
```

`bundle` and `styles` paths are filled in by the build step
(`scripts/emit-manifest.mjs`). Don't set them by hand.

## Step 10 — Author the JSON Schema

Create `src/schemas/{widget-id}.json`. Cover:

- `$schema`, `$id`, `title`, `description`, `type: object`
- `additionalProperties: false`
- Each editor-facing config knob as a property, with `description`,
  `type`, and `default`.
- Use `enum` to constrain string fields when only a few values are
  valid.
- Mark required fields explicitly via `required: []` — but most widget
  configs should have no required fields; defaults cover the editor
  experience.

Test the schema by hand against the JSON validator the Drupal module
uses (`justinrainbow/json-schema`). The kernel test suite under
`web/modules/custom/cbey_js_widgets/tests/src/Kernel/` is the canonical
oracle.

## Step 11 — Add the accessibility brief

Author `src/widgets/{widget-id}/README.md`. Cover, at minimum:

- What the widget does (one paragraph).
- Keyboard navigation — every interactive element, in tab order, what
  each key does.
- Screen-reader behaviour — roles, labels, descriptions; the data
  fallback (hidden table) for any chart that's opaque to assistive
  tech.
- Focus management — what receives focus on widget mount, where focus
  goes on state changes.
- Reduced motion — what animations exist, how they're toned down.
- Colour contrast — verify the widget's colour usage against AA, list
  any contrast notes.
- Known gaps / open questions for Aria.

This file is what Aria reviews at PR time. If a section is N/A, say so
explicitly — silence reads as a gap.

## Step 12 — Build and smoke-test

```bash
npm install
npm run typecheck
npm run lint
npm run build         # emits dist/{widget-id}/ and dist/manifest.json
npm test              # runs vitest
```

For a visual smoke test in v0.1, the simplest path is a one-page HTML
harness that mounts the dist bundle into a shadow root. Storybook is on
the roadmap but not required for first widgets.

## Step 13 — Open a PR

The catalog repo PR triggers review from:

- **Pixel** — bundle shape, library wiring, manifest correctness.
- **Aria** — the widget README, the rendered widget against WCAG AA.
- **Shield** — third-party origins in bundle, CSP implications, any
  shadcn/Radix component that retained an external reference.

Once merged and tagged, the cbey-d8 side picks it up via
`composer update square360/cbey-js-widgets` and a manifest cache
rebuild. Atlas owns the deploy.

## Appendix — Data fetching

If a widget needs to fetch data at runtime (rather than ship it bundled),
use `fetch` inside a `useEffect`. No `react-query`, no global store.
Cache via a top-level `Promise` if necessary — one fetch per mount is
fine for most widgets.

Origin allowlist: data sources must be approved by Shield as part of
the CSP review for that widget. Default to `'self'`; cross-origin
sources need explicit `connect-src` entries.

## Appendix — Updating an existing widget

A patch-level revision (data correction, copy fix) reuses the same
widget id, bumps the version in `src/manifest.ts`, and rebuilds.

A breaking revision (config shape change, conceptually different
widget) gets a new widget id. The old one is marked `deprecated: true`
in the manifest so existing paragraphs keep rendering, but no new
paragraphs offer it as a choice.
