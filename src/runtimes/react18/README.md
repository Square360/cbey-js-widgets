# React 18 runtime

This directory ships the build script that produces the shared React 18
runtime bundle consumed by every React widget on a page that uses one.

The widget loader in `cbey_js_widgets` does **not** load React itself —
it expects `window.CbeyReact` to be present, populated by the Drupal
library `cbey_js_widgets/react18`. That library points at a single file
committed to the cbey-d8 repo at:

```
web/modules/custom/cbey_js_widgets/js/runtimes/react18.bundle.js
```

The committed copy is regenerated from this catalog repo via:

```bash
npm run build:runtime react18
cp dist/runtimes/react18.bundle.js \
  ../cbey-d8/web/modules/custom/cbey_js_widgets/js/runtimes/react18.bundle.js
```

(Path may differ depending on where you check out the two repos; Atlas
will document the canonical copy step in the deploy guide.)

## What the bundle does

It produces an IIFE that imports React, ReactDOM, and `react-dom/client`,
and assigns them to `window.CbeyReact`:

```js
window.CbeyReact = {
  React,
  ReactDOM,
  createRoot,
  version: '18.x.y',
};
```

Widget bundles externalise `react`, `react-dom`, and `react-dom/client`
at Vite-build time (see `vite.config.ts`) and resolve them to the
matching `window.CbeyReact` keys at runtime.

## Browser-safe build

The build script substitutes `process.env.NODE_ENV` (and any other
`process.env.*` access) at build time via Vite's `define` option, so the
emitted IIFE contains no live references to a Node-only `process` global.
This is what keeps React's dev-mode checks from throwing
`ReferenceError: process is not defined` in the browser, and routes React
to its production code path.

## Why a separate bundle file

A standalone, content-stable bundle file is the cleanest way to
guarantee exactly one React instance per page. The cbey-d8 repo
commits the file rather than fetching it at run time so the asset can
be served from the Drupal site's own origin and aggregated by Drupal's
asset pipeline.
