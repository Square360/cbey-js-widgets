# Svelte 5 runtime

Shared Svelte 5 runtime for every Svelte widget in the catalog. Unlike
`react18`, this one is real: widget bundles genuinely externalise against
it and carry no Svelte of their own.

Regenerate and copy into the host site with:

```bash
npm run build:runtime svelte5
cp dist/runtimes/svelte5.bundle.js \
  ../cbey-d8/web/modules/custom/cbey_js_widgets/js/runtimes/svelte5.bundle.js
```

The Drupal library `cbey_js_widgets/svelte5` serves that copy; the loader
attaches it whenever a widget declares `runtime: svelte5` and refuses to
mount if `window.CbeySvelte` is absent.

## What the global exposes

```js
window.CbeySvelte = {
  svelte,    // the public `svelte` module namespace — mount, unmount, tick, …
  internal,  // `svelte/internal/client` — what compiled components import
  store,     // `svelte/store` — writable, readable, derived, get
  version,   // e.g. '5.57.1', read from the installed package
};
```

`internal` is the interesting one. `svelte/internal/client` **is** the
Svelte 5 runtime — the public `svelte` module is a thin facade over it,
and every compiled component emits `import * as $ from
'svelte/internal/client'`. Sharing only the facade would share nothing
worth sharing, so the whole internal namespace is exposed.

## How widget bundles resolve against it

The loader dynamic-imports a widget bundle from a URL with no import map
in play, so a bare `import … from 'svelte/internal/client'` left in the
output would be unresolvable. Instead the `svelteRuntimeGlobal()` plugin
in `vite.config.ts` resolves each shared specifier to a generated shim
module that re-exports the runtime's members off the global:

```js
const __rt = window.CbeySvelte.internal;   // throws with a clear message if absent
const __e0 = __rt["state"]; export { __e0 as state };
// …one pair per export, generated from the installed package
```

Export names are read from the installed Svelte package at build time,
not hand-listed, so a Svelte upgrade needs no edit to the plugin.

## Version locking

`svelte/internal/client` is a private, unversioned API surface. The
runtime bundle and the widget bundles that resolve against it must be
built from the same Svelte version — **rebuild and recopy both together**.
The generated shim hard-codes the version it compiled against and logs a
console warning (once per page) if `window.CbeySvelte.version` differs,
so drift surfaces instead of producing an obscure runtime error.

Bundle size is ~97 kB raw / ~36 kB gzipped. Nothing tree-shakes, because
the whole namespace is exposed — that is the price of one shared instance,
paid once per page rather than once per widget.

## Build order

`npm run build` builds the widgets, emits the manifest, and rebuilds this runtime, in that order:

```bash
vite build && node scripts/emit-manifest.mjs && node scripts/build-runtime.mjs svelte5
```

The chaining is deliberate and load-bearing. Vite runs with `emptyOutDir: true`, so `vite build`
alone empties `dist/` and takes the runtime bundle with it — and because `dist/runtimes/` is
committed (see below), that showed up as a phantom deleted file until someone remembered to run
`build:runtime` separately. Chaining it means a single build always leaves the tree correct.

`npm run build:runtime svelte5` still exists for rebuilding the runtime on its own.

## Why this bundle is committed, and react18's is not

`dist/runtimes/svelte5.bundle.js` is **committed to the repository**. Nothing builds runtimes in
CI, so the bundle has to be in the package or there is nothing to serve and nothing for the test
setup to load — `tests/setup-svelte-runtime.ts` evaluates this exact file, the way the browser
does.

`dist/runtimes/react18.bundle.js` is **not** committed, and that asymmetry is correct rather than
an oversight:

- Svelte widgets **externalise** against `window.CbeySvelte`. Without this bundle they do not run.
- React widgets **bundle their own copy** of React (see the note in `vite.config.ts`). Nothing
  resolves against `window.CbeyReact`, so the react18 runtime is effectively vestigial.

Do not "fix" the inconsistency by committing the react18 bundle. If React widgets are ever
switched to externalise, commit it then, and update this note.

## Portability

Nothing in this directory, in `scripts/build-runtime.mjs`, or in the
`svelteRuntimeGlobal()` plugin is CBEY-specific. A second site copies
them unchanged and renames one string, `SVELTE_RUNTIME_GLOBAL` in
`vite.config.ts`, to match its own loader's `REQUIRED_GLOBALS` entry.

See `docs/widget-system-portability.md` for the full lift procedure.
