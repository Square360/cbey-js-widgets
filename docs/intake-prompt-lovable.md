# Lovable.dev intake prompt — verbatim

This is the canonical prompt the CBEY-affiliated economist uses inside
Lovable.dev to pre-scope each batch of widgets before they reach the
catalog. It produced the clean intake on 2026-05-12 (`power-vista-plot`,
three widgets) — the first batch where Lovable returned a shape Pixel
could lift straight into `src/widgets/{id}/` without a multi-day
refactor.

## When to use it

- Every time the author produces a new Lovable refactor for catalog
  ingestion. Cadence is roughly one batch every 3–4 weeks; sometimes
  one widget, sometimes 2–3.
- After a scoping conversation with the author about what's in the
  upcoming batch. They tell you which existing widget (if any) is
  being replaced and which sections of their working app should
  become standalone widgets.
- Before they hit "regenerate" on Lovable.

## How to send it

**Send it verbatim — no edits.** Lovable performs best with consistent,
structured asks. Light edits to the list of widgets/section names are
fine (those are the per-batch knobs); leave the constraints alone.
Replace `{widget-list}` with the concrete names from the scoping
conversation and the rest stays the same.

## The prompt

```text
I need to extract the interactive visualizations and data tables from
this project as a set of standalone, reusable widgets. Each widget will
be embedded as a single block inside a journal-article-style page on a
separate site, surrounded by editor-controlled prose, headers,
navigation, and other widgets we don't know about ahead of time. The
target is a Drupal CMS where editors place widgets one paragraph at a
time and don't write code.

Refactor the project into a `src/widgets/{widget-id}/` folder per
widget. The widgets I want extracted in this pass are:

{widget-list}
  e.g.
  - `grid-tech-map` — replaces the existing `grid-tech-market-map`; the
    scatter chart of grid technologies by ARL vs. 2030 market size
  - `investment-thesis-table` — the per-tech VC-thesis matrix and the
    long-form thesis cards beneath it, as one combined widget
  - `energy-storage-comparison-table` — the static comparison table
    showing each storage tech vs. lithium-ion at peak suitability

Each widget folder must contain:
  - `index.tsx` — the React component. Default export.
  - `data.ts` — the data the widget renders, with TypeScript interfaces.
  - `README.md` — a short usage note plus the config-prop shape.

Remove from each widget:
  - Page-shell elements: hero sections, full-page video, prose copy,
    site headers, site footers, top-level navigation.
  - Page-shell wrappers: `min-h-screen`, full-page `bg-*` painted on
    outer divs, `container mx-auto`, `max-w-7xl` constraints meant for
    a whole page, padding meant for page edges (`p-12`, `p-8`).
  - Routing: no `BrowserRouter`, `HashRouter`, `Routes`, `Route`,
    `Link`, `Navigate`, `useNavigate`, etc. The widget is one tree;
    there's no in-app navigation.
  - Page-level overlays and providers: `Toaster`, `Sonner`,
    `TooltipProvider` (unless the widget itself uses Radix tooltips
    and you wire them properly), `QueryClientProvider`. No global
    feedback that escapes the widget's own box.
  - Anything that portals to `document.body`. If a Radix primitive
    portals by default (Tooltip, Dialog, Select, DropdownMenu,
    Popover, HoverCard), either replace it with a native HTML
    equivalent (`<select>`, `<details>`, plain inline text) or pass a
    `container` prop pointing into the widget's own root div. Default
    lean: replace with native.

Keep in each widget:
  - The chart, table, or other interactive piece.
  - Any in-widget controls (a category `<select>`, a filter, a
    tab-strip implemented as a button group).
  - The widget's own type definitions for its data shape.

Each widget's component contract:
  - One default export from `index.tsx` (a React component).
  - One config prop of a typed interface (`{Widget}Config`) — the
    only way the editor changes the widget's behaviour at runtime.
    All fields optional, with documented defaults.
  - The component renders into a single root `<div>` it owns. No
    portals, no rendering anywhere else in the DOM.
  - No `dangerouslySetInnerHTML`, no `eval`, no `new Function`, no
    `.innerHTML = ...`, no `.insertAdjacentHTML(...)`. Editor-supplied
    strings are data, never code.
  - No `window.*` mutations and no `document.body.*` reads or writes.
    Read-only observation of the environment is fine
    (`window.matchMedia('prefers-reduced-motion')`, locale, etc.).
  - No `localStorage` or `sessionStorage` writes. Read-only access
    only if you have a specific reason; flag it in the README.
  - No cross-widget messaging — no custom DOM events on `window` or
    `document`, no `BroadcastChannel`, no shared global state. Two
    widgets that "must coordinate" are one widget with two visual
    sections; build them that way.

Styling rules:
  - Design tokens (CSS variables) live on the component's root `<div>`,
    not on `:root` and not in a global stylesheet. The widget will
    render inside a shadow root on the target site, so anything you
    declare on `:root` won't reach the widget.
  - No global resets or page-level body styles. Tailwind utility
    classes for layout are fine, but the widget can't paint a page
    background or set a page-level font.
  - Inline styles or CSS Modules or plain CSS — pick whichever fits
    the widget; just don't rely on `:root` tokens or global selectors.

Out of scope for this refactor:
  - Cross-component / cross-widget state. Each widget is sealed.
  - Deployment plumbing (build configs, hosting, environment variables).
    The receiving catalog handles its own build.
  - Tests, Storybook, documentation beyond the widget README.

The receiving project is a strict shadow-DOM-isolated widget catalog.
The cleaner the refactor here, the less rework Pixel has to do on the
receiving side, and the faster the widgets land in production.
```

## Companion: the isolation contract

The contract this prompt operationalizes lives at
[`./isolation-contract.md`](./isolation-contract.md). If the author
asks "why no `<Toaster>`?" or "why can't widget A talk to widget B?",
point them at the contract — it's written for them, not for
implementers.

## Companion: the intake recipe

Once the export arrives, Pixel runs the steps in
[`./intake-recipe-react.md`](./intake-recipe-react.md). The prompt
above gets the export to "intake step 4 ready"; steps 4–11 are still
Pixel's job. Roughly half the intake time is saved when the author
pre-scopes with this prompt vs. arriving with a full Lovable app.

## Iteration log

- **2026-05-12** — first verbatim send. Produced `grid-tech-map`,
  `investment-thesis-table`, `energy-storage-comparison-table`. All
  three landed in `src/widgets/{id}/` with no structural rework; only
  the catalog's accessibility patterns (hidden tables, useId,
  scope=row, audited contrast palette) were added on top. Forbidden-
  patterns sweep returned zero hits.
