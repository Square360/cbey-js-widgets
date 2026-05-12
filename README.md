# cbey-js-widgets

Curated catalogue of framework-agnostic interactive widgets for the
CBEY Drupal site. Each widget is a sealed shadow-DOM unit. Cadence is
roughly one new widget every 3–4 weeks; first widget is the
`grid-tech-market-map` scatter chart.

## Why this repo

- Editors pick from a known list of widgets in the `js_widget` paragraph
  and supply a JSON config blob.
- This repo builds those widgets and emits a `dist/manifest.json` that
  Drupal reads via `composer require square360/cbey-js-widgets`.
- Each widget is built as its own bundle with React + ReactDOM
  externalised; a single shared React 18 runtime is loaded once per
  page from cbey-d8's own asset path.
- The host site mounts each widget into a per-instance shadow root —
  styles and DOM are isolated per widget.

The full architectural picture lives in
`cbey-d8/docs/2026-05-12-js-widget-paragraph-plan.md`. The
non-negotiables for widget authors live in
[`docs/isolation-contract.md`](./docs/isolation-contract.md).

## Layout

```
cbey-js-widgets/
├── package.json            # npm scripts: dev / build / build:runtime / test
├── composer.json           # type:drupal-library — dist/ is what cbey-d8 installs
├── vite.config.ts          # multi-entry build; React externalised
├── tailwind.config.ts      # prefix: 'cbey-' ; tokens map to :host CSS vars
├── tsconfig.json
├── postcss.config.js
├── docs/
│   ├── intake-recipe-react.md     # canonical recipe for new React widgets
│   └── isolation-contract.md      # the sealed-unit contract (plain language)
├── scripts/
│   ├── emit-manifest.mjs          # post-build: writes dist/manifest.json
│   └── build-runtime.mjs          # builds the shared React 18 runtime
├── src/
│   ├── manifest.ts                # typed source of truth for the manifest
│   ├── runtimes/
│   │   ├── tailwind-base.css      # :host-scoped reset + tokens shared by all widgets
│   │   └── react18/
│   │       ├── build-runtime.ts   # source for window.CbeyReact bundle
│   │       └── README.md
│   ├── schemas/
│   │   └── grid-tech-market-map.json
│   └── widgets/
│       └── grid-tech-market-map/
│           ├── index.tsx
│           ├── MarketMap.tsx
│           ├── data/gridTechData.ts
│           ├── styles.css
│           └── README.md          # accessibility brief (Aria reviews)
└── tests/                         # vitest; loader contract + widget smoke tests
```

## Develop locally

```bash
npm install
npm run typecheck         # tsc --noEmit
npm run lint
npm run dev               # vite dev server; rough preview
npm run build             # vite build → dist/, then emit-manifest.mjs
npm run build:runtime react18   # build the shared React 18 bundle
npm test                  # vitest run
```

After `npm run build`:

- Widget bundles land under `dist/{widget-id}/`, content-hashed.
- `dist/manifest.json` carries the published manifest Drupal reads.
- `dist/runtimes/react18.bundle.js` is the shared React 18 runtime
  (produced separately via `build:runtime`).

## Add a new widget

Follow [`docs/intake-recipe-react.md`](./docs/intake-recipe-react.md).
Short version:

1. Pre-scope with the author against `docs/isolation-contract.md`.
2. Lift the load-bearing components into `src/widgets/{widget-id}/`.
3. Add a manifest entry to `src/manifest.ts`.
4. Author the JSON Schema at `src/schemas/{widget-id}.json`.
5. Write the accessibility brief in
   `src/widgets/{widget-id}/README.md`.
6. `npm run build`, verify, open a PR.

## Add a new runtime

When the first Vue / Svelte / Lit widget arrives:

1. Add `src/runtimes/{runtime}/build-runtime.ts` mirroring the React 18
   bridge.
2. Update `scripts/build-runtime.mjs`'s allow-list.
3. Add a Drupal library entry in cbey-d8's
   `cbey_js_widgets.libraries.yml` and a corresponding mapping in
   `JsWidgetMount::RUNTIME_LIBRARIES`.
4. Add the runtime id to `supportedRuntimes` in `src/manifest.ts`.
5. Author `docs/intake-recipe-{runtime}.md`.

Existing widgets are untouched.

## Deploy to cbey-d8

1. Tag a release in this repo (e.g. `v0.1.0`).
2. In cbey-d8: `composer update square360/cbey-js-widgets`.
3. Atlas: copy `vendor/square360/cbey-js-widgets/dist/runtimes/react18.bundle.js`
   to `web/modules/custom/cbey_js_widgets/js/runtimes/react18.bundle.js`,
   or wire a Composer post-update hook.
4. `lando drush cr` to invalidate the manifest cache tag.

Atlas owns the deploy path; the steps above are the contract from this
repo's side, not the Drupal side.

## Out of scope

- SSR.
- Multi-tenant catalogs.
- Editor JSON Schema form (cbey-d8 Phase 3).
- Cross-widget messaging in any form.
