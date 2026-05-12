# grid-tech-market-map

Interactive scatter chart plotting grid-technology subcategories on two axes:

- X-axis: Adoption Readiness Level (ARL), 4.5 to 9.5
- Y-axis: Market Size 2030 (US$ billions), 0 to a category-specific maximum

Marker shape encodes Compound Annual Growth Rate (CAGR):

- Square: CAGR < 10 %
- Circle: CAGR 10–20 %
- Triangle: CAGR > 20 %

A category selector (native `<select>`) lets the reader switch between
"Energy Storage Technologies" and "T&D – Grid Enhancing Technologies".
When `lockCategory` is `true` in the editor config, the selector is
hidden and only the default category renders.

## Config

See [`../../schemas/grid-tech-market-map.json`](../../schemas/grid-tech-market-map.json)
for the full JSON Schema. All fields are optional.

| Key               | Type   | Default          | Notes                                                        |
| ----------------- | ------ | ---------------- | ------------------------------------------------------------ |
| `defaultCategory` | string | `"energy-storage"` | Must match a known category id; falls back to first entry. |
| `lockCategory`    | bool   | `false`          | Hides the selector when `true`.                              |

## Accessibility brief

Aria reviews this section before merge.

### Heading hierarchy

The widget body emits **no `<h1>`**. The wrapping `<figure>`'s
`<figcaption>` (or its `aria-label` fallback when the editor leaves
the title field empty) carries the widget's name at the paragraph
level, so a second page `<h1>` inside the widget would duplicate that
and break the document outline.

The only heading the widget renders today is an `<h3>` for the
current category name, which sits one level below the host page's
section `<h2>`. Phase 2 ticket P2-3 will make this configurable via
the widget's JSON Schema so editors can match the host page's depth
when needed.

### Keyboard navigation

- Category selector is a native `<select>`. Standard browser behaviour:
  Tab focuses, Space/Enter opens, arrow keys change selection. No custom
  key handlers — no broken expectations.
- The scatter chart itself is not keyboard-interactive (no hoverable
  data points). Two fallbacks are in place:
  - A visually-hidden `<table>` exposes every data row to screen
    readers (see "Screen readers" below).
  - A visible `<details>` element below the chart, labelled
    "View chart data as a table", lets a sighted keyboard-only user
    expand the same data on demand. Tab to the summary, press
    Space/Enter to expand, Tab into the table. Closed by default so
    mouse users don't see it unless they want to. Mitigation for the
    Recharts tooltip-on-hover gap (Aria audit Finding P2-8).
- Full per-marker keyboard interaction (focus rings, key-driven
  tooltip reveals) is a Phase 2 commitment (Aria audit P2-1) — either
  patch Recharts or swap chart library.

### Screen readers

- The scatter chart container carries `role="img"` and an `aria-label`
  describing the view ("Scatter chart: {category}, ARL versus market size
  2030."). Recharts' default SVG is otherwise opaque to assistive tech.
- A visually-hidden `<table>` reproduces every data point with a
  `<caption>`, column headers (`<th scope="col">`), and row headers
  (`<th scope="row">`). The chart container is `aria-describedby` the
  table's caption so screen readers reach the data on either traversal
  pattern. This table remains in place even though the visible
  `<details>` table also exists — the two serve different audiences
  (screen-reader vs sighted-keyboard) and removing either reopens a
  gap.
- Modern screen readers (NVDA, VoiceOver, JAWS) traverse open shadow
  roots transparently; no shadow-piercing fallback is needed.

### Focus management

- The native `<select>` carries its own focus ring; a `:focus-visible`
  fall-back styles it with the runtime `--cbey-ring` token in case the
  Tailwind utility misses a browser quirk.
- The category change is announced implicitly by the `<select>` itself.
  The chart re-renders synchronously when the selection changes; no
  loading state to manage.

### Reduced motion

- The chart has no animations today. The widget stylesheet still
  declares the `prefers-reduced-motion: reduce` block as a guard for
  future revisions; any animation added later inherits the override.

### Colour contrast

#### CAGR marker palette (audited)

Marker colours are paired with marker shapes (square / circle /
triangle). Shape redundancy satisfies WCAG 1.4.1; the colours
themselves are tuned to satisfy WCAG 1.4.11 (non-text contrast, 3:1
minimum) against the white card background that the chart renders on
(`--cbey-card` → `#FFFFFF` in the v1 theme).

| Bucket | Shape    | Colour    | Contrast vs `#FFFFFF` | Notes                                                            |
| ------ | -------- | --------- | --------------------- | ---------------------------------------------------------------- |
| low    | square   | `#3B82F6` | 3.68:1                | Tailwind `blue-500`. Passes 1.4.11.                              |
| medium | circle   | `#B45309` | 4.66:1                | Tailwind `amber-700`. Passes 1.4.11 and 1.4.3 body-text minimum. |
| high   | triangle | `#15803D` | 4.54:1                | Tailwind `green-700`. Passes 1.4.11 and 1.4.3 body-text minimum. |

The previous palette used `#F59E0B` (~2.0:1) and `#22C55E` (~2.4:1)
which both failed 1.4.11; the Aria audit on 2026-05-12 flagged them
and Pixel darkened to amber-700 and green-700 here.

If `--cbey-card` ever drifts away from pure white, re-measure these
three values. The audit log lives alongside the `CAGR_COLORS` constant
in `MarketMap.tsx`; update both together so future maintainers see
the floor.

#### Body text

- Axis labels and tooltips use `hsl(var(--cbey-foreground))` against
  `hsl(var(--cbey-card))` / `hsl(var(--cbey-background))`. Audited at
  ~14.5:1 (foreground on card) and ~4.65:1 (muted-foreground on card —
  tight; flagged in audit as the design-system canary). Re-check on
  any token change.

### Known gaps and Phase 2 commitments

1. **No per-marker keyboard exposure.** A keyboard user can't focus
   individual chart markers. Mitigated in Phase 1 by the visible
   `<details>` data-table reveal (sighted-keyboard) and the
   visually-hidden table (screen-reader). Full per-marker focus is
   Phase 2 — Aria audit ticket P2-1: either patch Recharts markers
   (`tabindex={0}` + keydown handlers that surface tooltip content via
   aria-live) or switch chart library to one with native keyboard
   support.
2. **Tooltips are mouse/touch only.** Same root cause as 1; same Phase
   2 ticket closes both. Sighted-keyboard users get the data via the
   `<details>` reveal; screen-reader users get it via the hidden table.
3. **Hidden table label voice.** Resolved by Aria's 2026-05-12 audit:
   the current caption text ("`${category.name}: subcategories with
   ARL, market size in 2025, market size in 2030, and CAGR.`") reads
   cleanly across NVDA, VoiceOver, and JAWS by structure inspection.
   No change needed.
4. **Long category names.** "T&D – Grid Enhancing Technologies"
   includes an en-dash and special characters; pronunciation
   verification across NVDA, VoiceOver, and JAWS is on the launch QA
   checklist (Atlas + Aria pairing). Not a code change.
5. **`<title>` element inside the SVG.** Phase 2 AAA-feasible
   improvement (Aria audit P2-2): inject a leading `<title>` inside
   Recharts' SVG for screen readers that query the SVG directly. The
   container `aria-label` covers the AA case today.

## Dev notes

- Built against React 18 via the shared runtime (`window.CbeyReact`).
- Recharts is bundled per widget (no shared library).
- Tailwind utilities are prefixed `cbey-` (set in `tailwind.config.ts`).
- The widget renders inside a shadow root; design tokens are declared on
  `:host`, never `:root`. See `../../runtimes/tailwind-base.css`.
