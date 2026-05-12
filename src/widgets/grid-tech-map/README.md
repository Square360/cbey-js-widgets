# grid-tech-map

Interactive scatter chart plotting grid-tech sub-categories by Adoption
Readiness Level (ARL) vs. projected 2030 market size, with CAGR encoded
by marker shape and colour. A native `<select>` lets the reader switch
between top-level categories.

This widget **replaces** `grid-tech-market-map` (v0.1.x). The older id
remains in the manifest with `deprecated: true` so existing paragraphs
keep rendering, but new paragraphs offer `grid-tech-map` only.

## Differences vs. grid-tech-market-map

- Wider editor config: editors can now override `categories`,
  `labelPositions`, and the CAGR `colors` palette.
- Config knobs renamed: `defaultCategory` → `initialCategoryId`;
  `lockCategory` → `hideCategorySelector`.
- Default CAGR palette ships with the Aria-audited AA colours
  (`#3B82F6` / `#B45309` / `#15803D`). The raw Lovable export used
  `#F59E0B` and `#22C55E` which fail WCAG 1.4.11 against the white
  card; the widget's default does not use those values.

## Config

See [`../../schemas/grid-tech-map.json`](../../schemas/grid-tech-map.json)
for the full JSON Schema. All fields are optional.

| Key                    | Type                  | Default        | Notes                                                              |
| ---------------------- | --------------------- | -------------- | ------------------------------------------------------------------ |
| `initialCategoryId`    | string                | first category | Must match a category id in `categories`.                          |
| `hideCategorySelector` | boolean               | `false`        | Hides the `<select>` when `true`.                                  |
| `categories`           | array                 | bundled        | Override the dataset entirely; same shape as the bundled default.  |
| `labelPositions`       | object                | bundled        | Per-tech-name label placement override.                            |
| `colors`               | object                | AA palette     | `{ low?, medium?, high? }` hex strings. Editor owns contrast.      |

## Accessibility brief

Aria reviews this section before merge.

### Heading hierarchy

The widget body emits **no `<h1>`** and **no `<h2>`**. The wrapping
`<figure>`'s `<figcaption>` (or its `aria-label` fallback) carries the
widget's name at the paragraph level, so a second page `<h1>` inside
the widget would duplicate that and break document outline.

The only heading the widget renders today is an `<h3>` for the current
category name, which sits one level below the host page's section
`<h2>`. The same Phase 2 ticket as grid-tech-market-map (P2-3) makes
this configurable via JSON Schema.

### Keyboard navigation

- Category selector is a native `<select>`. Standard browser behaviour:
  Tab focuses, Space/Enter opens, arrow keys change selection. No
  custom key handlers.
- The scatter chart itself is not keyboard-interactive (no hoverable
  data points). Two fallbacks are in place:
  - A visually-hidden `<table>` exposes every data row to screen
    readers (see "Screen readers" below).
  - A visible `<details>` element below the chart, labelled "View
    chart data as a table", lets a sighted keyboard-only user expand
    the same data on demand. Tab to the summary, press Space/Enter to
    expand, Tab into the table. Closed by default. Mitigation for the
    Recharts tooltip-on-hover gap (Aria audit P2-8).
- Full per-marker keyboard interaction (focus rings, key-driven
  tooltip reveals) is a Phase 2 commitment — same ticket P2-1 as v1.

### Screen readers

- The scatter chart container carries `role="img"` and an `aria-label`
  describing the view (`Scatter chart: {category}, ARL versus market
  size 2030.`). Recharts' default SVG is otherwise opaque to AT.
- A visually-hidden `<table>` reproduces every data point with a
  `<caption>`, column headers (`<th scope="col">`), and row headers
  (`<th scope="row">`). The chart container is `aria-describedby` the
  table's caption so screen readers reach the data on either traversal
  pattern. This hidden table remains in place even though the visible
  `<details>` table also exists — different audiences (screen-reader
  vs. sighted-keyboard) and removing either reopens a gap.

### Focus management

- The native `<select>` carries its own focus ring; a `:focus-visible`
  fall-back styles it with the runtime `--cbey-ring` token in case the
  Tailwind utility misses a browser quirk.
- The category change is announced implicitly by the `<select>` itself.
  The chart re-renders synchronously when the selection changes; no
  loading state to manage.

### Reduced motion

- The chart has no animations today. `styles.css` declares the
  `prefers-reduced-motion: reduce` guard for any future revision; any
  animation added later inherits the override.

### Colour contrast

#### CAGR marker palette (default — audited)

Marker colours are paired with marker shapes (square / circle /
triangle). Shape redundancy satisfies WCAG 1.4.1; the colours
themselves are tuned to satisfy WCAG 1.4.11 (non-text contrast, 3:1
minimum) against the white card background (`--gtm-card` → `#FFFFFF`).

| Bucket | Shape    | Colour    | Contrast vs `#FFFFFF` | Notes                                                            |
| ------ | -------- | --------- | --------------------- | ---------------------------------------------------------------- |
| low    | square   | `#3B82F6` | 3.68:1                | Tailwind `blue-500`. Passes 1.4.11.                              |
| medium | circle   | `#B45309` | 4.66:1                | Tailwind `amber-700`. Passes 1.4.11 and 1.4.3 body-text minimum. |
| high   | triangle | `#15803D` | 4.54:1                | Tailwind `green-700`. Passes 1.4.11 and 1.4.3 body-text minimum. |

The raw Lovable export used `#F59E0B` (~2.0:1) and `#22C55E` (~2.4:1),
which both fail 1.4.11. The catalog default replaces them; editors who
supply a `colors` override own their own contrast budget.

#### Body text

- Body and tooltip text use `var(--gtm-fg)` (`#26323d`) against
  `var(--gtm-card)` (`#FFFFFF`). Measured ratio ≈ 13.5:1, well above
  4.5:1.
- Muted text uses `var(--gtm-muted)` (`#64748b`) against the white
  card. Measured ratio ≈ 4.55:1, just above the 4.5:1 floor; flagged
  as the v2 design-system canary — re-check on any token change.

### Known gaps and Phase 2 commitments

The same Phase 2 backlog applies as for grid-tech-market-map:

1. **No per-marker keyboard exposure.** Mitigated by hidden table +
   visible `<details>` data reveal. Full per-marker focus is Phase 2
   ticket P2-1.
2. **Tooltips are mouse/touch only.** Same root cause as 1.
3. **Long category names.** "T&D – Grid Enhancing Technologies"
   includes an en-dash; pronunciation verification across NVDA /
   VoiceOver / JAWS is on the launch QA checklist (Atlas + Aria
   pairing). Not a code change.
4. **`<title>` inside the SVG.** Phase 2 AAA-feasible improvement
   (P2-2): inject a leading `<title>` inside Recharts' SVG for screen
   readers that query the SVG directly. The container `aria-label`
   covers the AA case today.

### Items for Aria's re-audit on the v0.2.0 catalog cut

- Confirm the Aria-audited palette swap was carried over verbatim
  (it was; verified against the v1 README on intake).
- Re-verify document outline now that the only heading is `<h3>` (no
  `<h1>`, no `<h2>` in the widget body).
- Re-verify the `role="img"` + `aria-label` + `aria-describedby` triple
  on the chart container; this is a new pattern in v2 (v1 only had
  `aria-describedby` on the inner div).
- Confirm the CAGR-legend SVGs are correctly marked `aria-hidden="true"`
  so they don't get announced separately from the table fallback.

## Dev notes

- Built against React 18; `createRoot` is imported from
  `react-dom/client` directly (not `window.CbeyReact`).
- Recharts is bundled per widget (no shared library).
- The widget renders inside a shadow root; the shared design tokens
  declared on `:host` in `runtimes/tailwind-base.css` are joined by
  widget-local `--gtm-*` tokens on the component root `<div>`.
