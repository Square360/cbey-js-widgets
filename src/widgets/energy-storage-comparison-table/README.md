# energy-storage-comparison-table

Static comparison table showing how each emerging energy-storage
technology compares to lithium-ion at its peak suitability duration.
No interactive controls — the widget is pure tabular content with a
horizontal scroll affordance for narrow viewports.

## Config

See [`../../schemas/energy-storage-comparison-table.json`](../../schemas/energy-storage-comparison-table.json)
for the full JSON Schema. All fields are optional.

| Key        | Type   | Default                                                     | Notes                                |
| ---------- | ------ | ----------------------------------------------------------- | ------------------------------------ |
| `title`    | string | `"Technology Cost Comparison vs. Li-Ion"`                   | Visible `<h3>` heading.              |
| `subtitle` | string | `"How each energy storage technology compares to lithium-ion at its peak suitability duration."` | Visible `<p>` directly below the heading. |
| `rows`     | array  | bundled                                                     | Override the comparison rows.        |

## Accessibility brief

Aria reviews this section before merge.

### Heading hierarchy

- `<h3>` for the section heading (one level below the host page's
  section `<h2>`). The widget never emits `<h1>` or `<h2>` — the
  wrapping `<figure>`'s `<figcaption>` or `aria-label` carries the
  widget's own name.

### Keyboard navigation

- No interactive elements. Tab passes over the widget; the inner
  scrollable container is reachable for users who navigate via
  scroll-region focus (browsers typically grant a scrollable region
  its own focus when it has overflow content).

### Screen readers

- The `<table>` carries a visually-hidden `<caption>` that combines
  the title and subtitle so screen readers reach the table heading
  alongside the data. The visible `<h3>`/`<p>` remain in flow for
  sighted users.
- Column headers use `<th scope="col">`; the first column (technology
  name) uses `<th scope="row">` so screen readers announce the
  technology when reading each cell.

### Focus management

- Nothing to manage — no interactive elements.

### Reduced motion

- No animations. `styles.css` declares the
  `prefers-reduced-motion: reduce` guard for parity with the other
  widgets.

### Colour contrast

- Body text uses `var(--esct-fg)` (`#26323d`) against
  `var(--esct-card)` (`#FFFFFF`). Measured ≈ 13.5:1.
- Header row uses the same `var(--esct-fg)` against
  `var(--esct-row)` (`#f1f5f9`). Measured ≈ 13.1:1.
- Subtitle uses `var(--esct-muted)` (`#64748b`) against white.
  Measured ≈ 4.55:1.

### Known gaps and open questions for Aria

1. **Long row text.** The "Key Advantage at This Duration" column
   carries 100–250 characters of dense prose per row. Confirm the
   row-by-row reading pattern in NVDA / VoiceOver / JAWS during
   launch QA — the `<th scope="row">` markup should announce the
   technology before each cell, but verify in practice.
2. **Horizontal scroll affordance.** Narrow viewports get a horizontal
   scrollbar on the table container. Confirm Aria is happy with the
   keyboard discoverability of the scroll region; flagged as a
   potential P2 item if not.
3. **Hidden caption vs. visible chrome.** The widget puts the
   `<caption>` in `cbey-sr-only` because the visible `<h3>` + `<p>`
   already name the section. Confirm this duplication policy.

## Dev notes

- Built against React 18; `createRoot` is imported from
  `react-dom/client` directly (no `window.CbeyReact`).
- Pure React — no runtime dependencies beyond React itself.
- The widget renders inside a shadow root; the shared design tokens
  on `:host` are joined by widget-local `--esct-*` tokens on the
  component root `<div>`.
