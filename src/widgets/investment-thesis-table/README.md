# investment-thesis-table

Investment-thesis matrix and detailed write-ups by technology. A native
`<select>` switches between top-level categories (Energy Storage,
T&D – GETs). For each technology the widget renders:

1. A row in a summary `<table>` with early-stage and late-stage VC
   signal badges plus a short summary.
2. A long-form thesis card below the table with the full early-stage
   and late-stage thesis text.

## Config

See [`../../schemas/investment-thesis-table.json`](../../schemas/investment-thesis-table.json)
for the full JSON Schema. All fields are optional.

| Key                    | Type     | Default        | Notes                                                          |
| ---------------------- | -------- | -------------- | -------------------------------------------------------------- |
| `initialCategoryId`    | string   | first category | Must match a `categoryId` in `thesisData`.                     |
| `hideCategorySelector` | boolean  | `false`        | Hides the `<select>` when `true`.                              |
| `thesisData`           | array    | bundled        | Override the bundled per-tech thesis copy.                     |
| `signalMap`            | object   | bundled        | Override the bundled per-tech signal/summary map.              |

## Accessibility brief

Aria reviews this section before merge.

### Heading hierarchy

- The widget body emits no `<h1>` or `<h2>`. The wrapping `<figure>`'s
  `<figcaption>` (or its `aria-label` fallback) carries the widget's
  own name at the paragraph level.
- `<h3>` for the section title ("Investment Thesis by Technology
  Category"), one level below the host page's section `<h2>`.
- `<h4>` for the "Detailed Thesis" sub-heading.
- `<h5>` for each technology's thesis card title.

### Keyboard navigation

- Category selector is a native `<select>`. Standard browser behaviour:
  Tab focuses, Space/Enter opens, arrow keys change selection. No
  custom key handlers.
- All content beneath the selector is non-interactive text in semantic
  `<table>` / `<article>` elements. Tab moves the keyboard cursor
  past the selector and out of the widget.

### Screen readers

- The summary `<table>` carries a visually-hidden `<caption>`
  describing the category and columns. Column headers use
  `<th scope="col">`; the first column's per-row cells are
  `<th scope="row">` so screen readers announce the technology name
  alongside each cell.
- The signal "badges" pair a decorative emoji with a label. The
  emoji is wrapped in `<span aria-hidden="true">…</span>` so the
  screen reader hears the label text only, not the emoji description.
- Each thesis card is an `<article>` with an `<h5>` heading the
  technology name, so screen-reader heading-list navigation reaches
  every entry.

### Focus management

- The native `<select>` carries its own focus ring; a `:focus-visible`
  fall-back styles it with the runtime `--cbey-ring` token in case the
  Tailwind utility misses a browser quirk.
- The category change is announced implicitly by the `<select>`. The
  table re-renders synchronously when the selection changes; no
  loading state to manage.

### Reduced motion

- No animations today. `styles.css` declares the
  `prefers-reduced-motion: reduce` guard for any future revision.

### Colour contrast

- Body text uses `var(--itt-fg)` (`#26323d`) against
  `var(--itt-card)` (`#FFFFFF`). Measured ≈ 13.5:1.
- Muted text uses `var(--itt-muted)` (`#64748b`) against the white
  card. Measured ≈ 4.55:1, just above the 4.5:1 floor; flagged for
  Aria's design-system canary list.
- Primary section labels ("Early-Stage VC…", "Late-Stage VC…") use
  `var(--itt-primary)` (`#0c6f9a`) against white. Measured ≈ 5.4:1,
  passes 1.4.3.
- The badge chips use a `var(--itt-card)` (white) background with a
  `var(--itt-border)` (`#dbe2ea`) outline. Border-only contrast against
  white card is ≈ 1.4:1 — the chip is not the primary signal carrier
  (the text inside is); flagged for Aria review whether 1.4.11 applies
  here (decorative pill vs. UI control).

### Known gaps and open questions for Aria

1. **Emoji semantics.** Each signal badge has a decorative emoji
   followed by a text label. Today the emoji is `aria-hidden="true"`
   and the label is plain text. If Aria prefers a different pattern
   (e.g., `role="img"` with `aria-label` per emoji to reinforce the
   semantic), flag and we'll adjust.
2. **Pill-chip contrast.** The signal badges are bordered chips with
   no text-to-background contrast issue but a very faint border vs.
   the card. Confirm whether 1.4.11 is applicable.
3. **`<caption>` placement.** The widget's summary table puts the
   caption in `cbey-sr-only` (hidden from sighted users since the
   visible `<h3>` already names the section). Confirm Aria is happy
   with that vs. surfacing the caption visibly.
4. **Long-form text.** Each `<article>` contains 400–800 characters
   of dense prose. Confirm reading order via NVDA / VoiceOver / JAWS
   on launch QA.

## Dev notes

- Built against React 18; `createRoot` is imported from
  `react-dom/client` directly (no `window.CbeyReact`).
- Pure React — no Recharts or other runtime dependencies beyond
  React itself.
- The widget renders inside a shadow root; the shared design tokens
  on `:host` are joined by widget-local `--itt-*` tokens on the
  component root `<div>`.
