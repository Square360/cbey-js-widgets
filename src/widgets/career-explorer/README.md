# Career Explorer

Ported from a client-supplied single-file static page
(`cbey-d8/_working/iris_plus_career_matrix_v5 (1).html`). First `svelte5`
widget in the catalog, and the first widget that fetches its data at runtime
rather than bundling it.

## Data

Nothing is bundled. The widget fetches the payload from `config.endpoint`,
served by the `cbey_airtable` module at `/api/career-explorer/alumni`. The
payload shape is `types.ts`, and the Drupal side
(`AlumniNormalizer::normalize()`) is the source of truth for it.

`fixtures/alumni-payload.json` is a frozen copy of the 105-record dataset
extracted from the static source. It is test material only — it is not
imported by the widget.

**Positional `funcs` indices.** `Alum.funcs` holds integer indices into
`payload.sectors`. The widget never carries its own copy of the job
functions: it renders from the `sectors` array delivered in the same
response, so the index → label mapping travels with the data and cannot
desynchronise from a stale list in this bundle. The mapping itself is owned
by `AlumniSchema::SECTORS` in Drupal and asserted by a kernel test there.

## Two things that must not be undone

1. **No `{@html}`.** The source built roster and profile markup by
   concatenating record fields into `innerHTML`. That was harmless for a
   hand-checked static file and is a stored-XSS path onto a public Yale page
   now the data comes from an Airtable base a non-developer edits daily.
   Everything renders through Svelte's escaping `{expression}`. Two tests
   guard this: a behavioural one that poisons a fixture record and asserts no
   `<script>`/`<img>` element exists in the shadow root, and a source scan
   that fails if `{@html}` appears anywhere in this directory.
2. **No document-level queries.** The source assumed eight singleton element
   ids. Those are component state here. Also source-scanned.

The one field that reaches an *attribute* rather than a text node is
`linkedin`; escaping does not neutralise a `javascript:` URL, so the scheme
is checked before the anchor is rendered at all.

## Non-obvious implementation notes

- **`:root` → `:host`.** A stylesheet inside a shadow root does not match the
  document root, so the ported `:root` custom-property block would have
  resolved to nothing and the widget would have rendered colourless.
- **Single root element.** `CareerExplorer.svelte` wraps everything in
  `.ce-root`. Svelte 5.57's `unmount()` does not detach a component whose
  template root is a conditional block, which would leak markup into the
  loader's reused host element on teardown.
- **`$derived.by<T>(...)` is not a rune.** Writing a type argument on
  `$derived.by` makes the compiler treat it as an ordinary call: the value is
  computed once and never updates, with no error. Annotate the variable
  (`const rows: GridRow[] = $derived.by(() => …)`) instead. This cost an hour.
- **Icons are inline SVG.** The source loaded `@tabler/icons-webfont` from
  jsDelivr. Seven icons are used, not the three a skim suggests — `search`,
  `x` and `refresh` in the chrome, plus `user`, `arrow-left`,
  `chevron-right` and `brand-linkedin` in the roster and profile. They keep
  the original `<i>` wrapper so every `font-size` rule still sizes them.
- **Fonts by family name only.** `Mallory` (UI/body) and `YaleNew` (masthead
  heading, matching the theme's `%text-style-h1`). The theme registers the
  `@font-face` rules at document level and they resolve into the shadow root;
  no font files are shipped with this package.

## Accessibility

WCAG 2.2 AA. Every measured contrast ratio is recorded inline in
`styles.css` next to the declaration it justifies, so the numbers survive
the next edit; this section only covers the decisions.

**Matrix semantics — why a `<table>` and not `role="grid"`.** The activation
lives in a real `<button>` nested inside each `<th>`/`<td>`, not in
`role="button"` on the cell itself. `role="button"` *replaces* the
`columnheader`/`rowheader`/`cell` role rather than adding to it, so the
supplied construction cost all 207 data cells their header association —
which on a 23×9 matrix is the single most useful thing a screen reader has
to offer. The nested button restores that and gets Enter/Space, the button
role and `aria-pressed` natively, which is how the hand-rolled keydown
handler came out.

`role="grid"` with arrow-key navigation was considered and not taken. It
buys one tab stop instead of ~167, but at the cost of a bespoke keyboard
model (roving `tabindex`, arrows, Home/End/Ctrl+Home) over a component that
is read-and-drill-down rather than spreadsheet-like, and it puts screen
readers into a widget mode where the plain table is what users already know
how to drive. The tab-stop count is unchanged from the supplied page.
**Roving `tabindex` over the cell buttons — a single tab stop, arrows to
move, no role change — is the recommended follow-up** if the tab burden
proves to be a problem in testing; it is additive and needs no semantic
change.

**Focus.** Opening the panel moves focus to the panel container
(`tabindex="-1"`, `role="region"`, named from its own `<h3>`); closing it
returns focus to the control that opened it. Without this a keyboard user
got no signal that anything had happened and would have had to tab past
every remaining cell to reach the panel, which sits after the table in the
DOM.

**One live region.** `role="status"` at the root, rendered from first paint,
debounced 400 ms, covering the match count, the roster and the profile. The
`aria-live` that was on `.count-pill` is gone: it announced a sentence
fragment and said nothing about the panel, and two regions competing on one
interaction is how announcements get dropped.

**Dimming is not the only signal.** Off-focus cells (16 % opacity,
`pointer-events: none`) are not rendered as buttons at all, so they are out
of the tab order to match — a focus ring at 16 % opacity is not an
indicator. A populated cell dimmed out by the filters carries a
visually-hidden note saying so, because at 13 % opacity it is otherwise
indistinguishable from an empty cell and read as empty.

**Client design changes that needed sign-off** are each marked `VISUAL
CHANGE, needs sign-off` in `styles.css`: `--faint`, the search input border,
the unpressed org-toggle opacity, the dot rim, and the disabled-LinkedIn
text colour. `--accent: #185FA5` is not a CBEY palette colour and is left as
supplied by decision; it passes contrast everywhere it is used.

## Config

See `src/schemas/career-explorer.json`. `endpoint` is required — the widget
renders an honest error rather than falling back to a baked-in path.

## Tests

`tests/career-explorer.test.ts`. They run against the real shared-runtime
global: `tests/setup-svelte-runtime.ts` evaluates
`dist/runtimes/svelte5.bundle.js`, so **`npm run build:runtime svelte5` must
have been run**. `vite build` empties `dist/`, so the order is `npm run
build` then `npm run build:runtime svelte5`.
