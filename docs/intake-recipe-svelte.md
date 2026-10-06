# Intake recipe — Svelte (static HTML page → catalog widget)

This is the canonical version of the recipe for taking a client-supplied static HTML page
and porting it to a Svelte widget in the catalog. The upstream plan doc points back here.

## Audience

You are a frontend engineer (or Pixel) porting a freshly-arrived static HTML page or component
into the catalog as a new Svelte widget. The source is self-contained — markup, CSS, data,
and logic in one file, no build artefact, no missing pieces to obtain from the client.

## Before anything else — the supplied source is untrusted input

This pipeline exists precisely so client material is *processed* rather than uploaded blind to
the site. That protection only holds if the material is treated as untrusted on the way in,
including on your own machine.

The build toolchain's known weaknesses are almost all "attacker supplies input to the build":
`postcss` reading arbitrary `.map` files via a crafted `sourceMappingURL`, `browserslist`
crashing or writing to a prototype from a hostile `browserslist-stats.json`, `js-yaml` burning
CPU on crafted merge keys. None of these matter when every input comes from the team. All of
them matter the moment a zip arrives from a faculty member, an agency or a vendor — and that is
the normal case here. The career explorer arrived as an HTML file from the content owner; the
next one may arrive as a repository.

**So, before the source touches a build:**

- **Read it.** Every file, including the ones you did not expect. A single-file HTML page is
  quick to read end to end; a supplied repository needs the same scrutiny applied to its
  config, not just its components.
- **Never run a supplied `npm install`, `postinstall`, or build script.** Lifecycle scripts run
  arbitrary code with your credentials, your SSH agent and your cloud sessions. Take the source
  files into *this* package and build them with *this* toolchain. Do not adopt theirs.
- **Do not copy a supplied `package.json`, lockfile, `vite.config`, `postcss.config`,
  `.browserslistrc` or `browserslist-stats.json`.** Take components, styles and data. Leave
  build configuration behind — you are rebuilding it here anyway.
- **Strip `sourceMappingURL` comments and any `.map` files** from supplied assets.
- **Treat supplied data as hostile**, not merely as data. It is going through escaping and
  scheme checks (Step 10) because it ends up on a public page.
- **If something must be executed to be understood** — a minified bundle, an obfuscated asset,
  a binary — that is a reason to go back to the content owner for the source, not a reason to
  run it.

If a supplied artefact cannot be read and understood, it does not go in the build.

## Step 0 — Pre-scope with the content owner

Before intake, clarify scope:

> Your deliverable becomes a single interactive component, embedded on the host site. No hero,
> no surrounding page copy, no navigation, no routing — just the interactive piece and any
> controls it needs.

The widget must work inside a shadow root with no style leakage and no dependencies on page-level
globals.

## Step 1 — Shadow DOM sanity check

This widget will render inside a shadow root. Answer this first:

> Does this source assume full-page control? Document scroll, body margins, font-family, global
> `z-index` layers, `position: fixed` elements, `localStorage`, `window.location`, routers?

If yes, flag it with the content owner before proceeding. A shadow root isolates the widget
but cannot isolate page-level assumptions.

Quick sweep:

```bash
grep -in "document\.body\|window\.location\|localStorage\|sessionStorage\|position.*fixed" \
  {source-file}
```

Any hit in widget logic (not just comments) is a flag. Styling hits are fine — the shadow
boundary contains them.

## Step 2 — Isolation of the interactive piece

Extract the widget from surrounding page shell:

| Keep                                              | Discard                        |
| ------------------------------------------------- | ------------------------------ |
| The actual interactive component and its markup  | `<html>`, `<head>`, `<body>` tags |
| The data structure (inline literal, fixture, etc) | Page-level `<style>` blocks    |
| The CSS — all of it                              | `<nav>`, `<header>`, `<footer>` |
| The JavaScript logic                             | Hero sections, introductory copy |
|                                                   | `<script>` tags for CDN sources |

Keep the CSS as-is, even global selectors (`*`, `body`, `h1`, `table`, `th,td`). The shadow
boundary contains them — rewriting into BEM is wasted work.

## Step 3 — Assess the build entry point

Look at the source file's structure. For Svelte:

**If the source is markup + CSS + inline data + vanilla JS:**
- This is the ideal case. Everything stays, just reorganised.

**If the source references a third-party library via CDN** (e.g. `@tabler/icons-webfont` from jsDelivr):
- Remove the `<link>` tag from the HTML.
- For icon fonts: inline the actual SVG icons (rarely more than a dozen) into the Svelte components.
- For data libraries: if the source uses a utility library (lodash, date-fns), add it to
  `package.json` and import normally.

**If the source assumes jQuery or any frontend framework:**
- This recipe does not apply; hand it back for a different treatment.

## Step 4 — Create the widget structure

Create `src/widgets/{widget-id}/`:

```
src/widgets/{widget-id}/
├── index.ts           # mount function
├── {WidgetName}.svelte # root component
├── {ChildComponent}.svelte # any child components
├── types.ts           # TypeScript types for data
├── logic.ts           # pure, data-agnostic helpers
├── styles.css         # all ported styles
├── fixtures/          # test data (optional)
└── README.md          # accessibility brief
```

The `index.ts` must export default a mount function matching the loader contract:

```ts
import { mount, unmount } from 'svelte';
import CareerExplorer from './CareerExplorer.svelte';

const widgetMount = (
  shadowHost: HTMLElement,
  shadowRoot: ShadowRoot,
  config: WidgetConfig,
): (() => void) => {
  const instance = mount(CareerExplorer, {
    target: shadowHost,
    props: { config },
  });
  return () => unmount(instance);
};

export default widgetMount;
```

## Step 5 — Port markup to Svelte

Convert HTML markup to `.svelte` component(s):

- `<div id="header">` → component state and bindings, no DOM queries
- Conditional rendering: `{#if …}…{/if}` not inline `<div style="display:none">`
- Loops: `{#each array as item}…{/each}` not `array.map(item => createElement(…))`
- Interpolation: `{variable}` not string concatenation or `innerHTML`
- Event handling: `on:click`, `on:change`, etc. — not inline `onclick` attributes

**Replace every `document.querySelector`, `document.getElementById`, or
`document.querySelectorAll`.** The source likely has singleton IDs (`#header`, `#panel`, `#search`).
In Svelte, these become component state, not DOM queries. Nothing queries `document`.

## Step 6 — Port styles

Move the CSS to `styles.css` in the widget folder. Keep it as-is, including global selectors:

```css
* { margin: 0; padding: 0; }
h1 { font-size: 1.5rem; }
table { width: 100%; }
```

These are fine — the shadow boundary contains them. Do not rewrite into BEM.

**Critical: Scope any custom properties to `:host`.**

If the source has `:root { --color: #abc; }` in a `<style>` tag, it becomes:

```css
:host { --color: #abc; }
```

A stylesheet inside a shadow root does not match the document root, so any `:root`-scoped
property would resolve to nothing and the widget would render unstyled.

## Step 7 — Handle fonts

If the source uses a generic stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', …`),
replace it with the host site's theme faces — by *family name only*.

For CBEY, the theme registers `Mallory` and `YaleNew` at document level:

```css
:host { font-family: Mallory, 'Gill Sans', Arial, sans-serif; }
h1 { font-family: YaleNew, Georgia, serif; }
```

**Do not copy `@font-face` rules.** The theme already defines them at document level and they
resolve into the shadow root by family name. No font files in the catalog package — one source
of truth in the theme, accessed by name.

**Set `font-family` explicitly on `:host`; typography does not inherit into a shadow root**
the way it does through regular DOM.

If the font name is unknown, ask the host site's theme developer or Pixel which faces are
available and which to use where.

## Step 8 — Handle icons

If the source loads an icon font from CDN (e.g. `@tabler/icons-webfont`), remove the `<link>`.

**Inline the SVG icons as components or literals.** Count them first — if there are more than
~20, reconsider the approach. For most widgets, a dozen icons or fewer:

```svelte
<script>
  const IconSearch = `<svg>…</svg>`;
  const IconX = `<svg>…</svg>`;
</script>

<i>{@html IconSearch}</i>
```

**Never load icons from an external CDN at runtime.** No jsDelivr, no unpkg, no separate HTTP
requests. Inline or replace with Unicode symbols.

## Step 9 — Externalise Svelte

Ensure the widget bundles *externalise* against the shared Svelte runtime rather than bundling
its own copy.

The `svelteRuntimeGlobal()` plugin in `vite.config.ts` already handles this for `svelte`,
`svelte/internal/client`, and `svelte/store`. Verify after build:

```bash
npm run build
grep -c "svelte" dist/{widget-id}/{widget-id}.*.js
# expect 0: all Svelte is externalised
```

If the bundle contains Svelte code, the externalisation config is wrong. Fix and rebuild.

## Step 10 — Eliminate XSS vectors

This is load-bearing security. The source likely builds HTML strings in several places:

```js
element.innerHTML = `<h1>${label}</h1><p>${description}</p>`;
```

This is harmless for a hand-checked static file and **is a stored-XSS path onto a public page**
the moment the data comes from an externally-editable source (Airtable, a CMS, user input).

**In Svelte, use `{expression}` escaping. Never `{@html ...}`.**

```svelte
<h1>{label}</h1>
<p>{description}</p>
```

Svelte's default interpolation escapes HTML entities. If a record's `description` contains
`<img src=x onerror=alert(1)>`, it renders as literal text.

**For attributes, check the scheme.** If a field becomes a URL in an `href`:

```svelte
<a href={linkedinUrl}>{name}</a>
```

A record with `linkedin: "javascript:alert(1)"` still bypasses escaping. Before rendering the
link:

```svelte
{#if linkedinUrl?.startsWith('http')}
  <a href={linkedinUrl}>{name}</a>
{:else}
  <span>{name}</span>
{/if}
```

**Audit the whole widget:**

```bash
grep -rn "@html\|innerHTML\|outerHTML\|insertAdjacentHTML\|dangerously" src/widgets/{widget-id}/
```

Zero hits expected. Any hit is a security review.

## Step 11 — Fetch data at runtime, if needed

If the widget needs runtime data (rather than bundling it), use a simple `fetch` inside
component lifecycle:

```svelte
<script>
  import { onMount } from 'svelte';

  let data = [];
  let error = '';
  let loading = true;

  onMount(async () => {
    try {
      const res = await fetch(config.endpoint);
      if (!res.ok) throw new Error(`${res.status}`);
      data = await res.json();
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading…</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  {#each data as item}
    {item.name}
  {/each}
{/if}
```

No `react-query`, no Axios, no middleware. A single `fetch` per mount is the pattern.

The endpoint URL comes from `config`, passed by the loader from the editor — not hardcoded.
The widget is then testable against fixtures and portable across sites.

## Step 12 — Add the manifest entry

In `src/manifest.ts`, add:

```ts
{
  id: '{widget-id}',
  label: 'Human-readable name',
  description: 'One sentence describing what this widget shows.',
  version: '0.1.0',
  runtime: 'svelte5',
  configSchema: { $ref: 'schemas/{widget-id}.json' },
  deprecated: false,
}
```

`bundle` and `styles` are filled in by the build step; do not set them by hand.

## Step 13 — Author the JSON Schema

Create `src/schemas/{widget-id}.json`. Cover:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "$id": "https://cbey.yale.edu/schemas/{widget-id}.json",
  "title": "Human-readable name",
  "description": "What this widget does.",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "endpoint": {
      "type": "string",
      "description": "Required. Endpoint URL for the widget's data.",
      "default": ""
    }
  },
  "required": ["endpoint"]
}
```

Do not mark properties `required` unless they have no sensible default. Most widgets need no
required fields — the editor defaults everything.

Test the schema against the Drupal module's validator (`justinrainbow/json-schema`) via the
kernel test in `cbey-d8/web/modules/custom/cbey_js_widgets/tests/src/Kernel/`.

## Step 14 — Add the accessibility brief

Author `src/widgets/{widget-id}/README.md`. Covers, at minimum:

- What the widget does (one paragraph).
- Keyboard navigation — every interactive element, in tab order, what each key does.
- Screen-reader behaviour — roles, labels, descriptions; fallback (e.g. a hidden table) for
  any chart.
- Focus management — what gets focus on mount, where it goes on state changes.
- Reduced motion — what animations exist, how they respond to `prefers-reduced-motion`.
- Colour contrast — verify against WCAG AA (or AAA if feasible), record specific ratios inline
  in the CSS.
- Known gaps or questions for Aria.

This is what Aria reviews. If a section is N/A, say so — silence reads as a gap.

## Step 15 — Build and test

```bash
npm install
npm run typecheck
npm run lint
npm run build         # emits dist/{widget-id}/ and dist/manifest.json
npm test              # runs vitest
```

**One build does everything.** `npm run build` chains the widget build, the manifest, and the
runtime rebuild. Vite runs with `emptyOutDir: true`, so a bare `vite build` would empty `dist/`
and take the committed runtime bundle with it — the chaining exists to stop that. There is no
second command to remember.

Verify `dist/runtimes/svelte5.bundle.js` exists before committing. `npm run build:runtime svelte5`
rebuilds only the runtime if you need it on its own.

For a smoke test, create a simple HTML harness that mounts the widget into a shadow root
and feeds it a fixture config. The Storybook integration is on the roadmap but not required
for v0.1.

## Step 16 — Write widget tests

Create `tests/{widget-id}.test.ts`. Vitest + happy-dom, running against the real shared
runtime:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import widgetMount from '../src/widgets/{widget-id}/index';
import fixtureConfig from '../src/widgets/{widget-id}/fixtures/config.json';

describe('{widget-id}', () => {
  let host: HTMLElement;
  let shadowRoot: ShadowRoot;
  let unmount: () => void;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });
    unmount = widgetMount(host, shadowRoot, fixtureConfig);
  });

  afterEach(() => {
    unmount();
    document.body.removeChild(host);
  });

  it('mounts and renders', () => {
    expect(shadowRoot.querySelector('.widget-root')).toBeTruthy();
  });

  it('handles data correctly', () => {
    // fixture test
  });

  // XSS regression test if widget accepts external data
  it('escapes untrusted content', () => {
    const hostileData = { name: '<img src=x onerror="alert(1)">' };
    // render with hostile data, assert no <img> element in shadowRoot
  });
});
```

## Step 17 — Open a PR

The catalog repo PR triggers review from:

- **Pixel** — bundle shape, library wiring, manifest correctness, CSS scoping.
- **Aria** — the widget README, keyboard navigation, WCAG AA compliance, screen-reader
  support.
- **Shield** — XSS audit, CSP implications, any external data sources.

Once merged and tagged, the cbey-d8 side picks it up via `composer update` and a cache
rebuild. Atlas owns the deploy.

## Appendix — Known gotchas

**Svelte 5 specific:**

- **`$derived.by<T>(...)` with a type argument is not a rune.** It becomes an ordinary function
  call, computed once and never updating. Write `const rows: GridRow[] = $derived.by(() => …)`
  instead.
- **`unmount()` does not detach a component with a conditional block root.** If your `.svelte`
  file's template is `{#if condition}…{/if}` at the top level, the component does not fully
  detach on unmount. Wrap everything in a single `<div>` to fix.

**Version locking:**

- `svelte/internal/client` is a private, unversioned API. The runtime bundle and every widget
  bundle must be built from the same Svelte version. If versions drift, the widget logs a
  console warning (once per page) and may fail at runtime.
- Whenever you upgrade Svelte, rebuild everything with `npm run build` (it rebuilds the runtime
  too) and copy the new bundle to the Drupal module in the same commit.

**Shadow root CSS containment:**

- Global selectors (`*`, `body`, `h1`, `table`) are contained by the shadow boundary. Do not
  spend effort rewriting them into BEM — the boundary does the work.
- Custom properties must be scoped to `:host`, not `:root`.
- `@font-face` inside a shadow root is unreliable — reference font families by name and rely
  on document-level registration.

## Appendix — Updating an existing widget

A patch-level revision (data fix, copy fix) reuses the same widget id, bumps the version in
`src/manifest.ts`, and rebuilds.

A breaking revision (config shape change, conceptually different widget) gets a new widget id.
The old one is marked `deprecated: true` in the manifest so existing paragraphs keep rendering,
but no new paragraphs offer it as a choice.
