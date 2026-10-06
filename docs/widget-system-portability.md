# Widget system portability — standing this up on another site

This Svelte runtime is a proof of concept for a per-site widget system Square360 can stand up
on other sites. Nothing is shared across domains at runtime — every site builds and serves
its own assets from its own origin. **What travels is the pattern.**

This guide enumerates the site-prefix seams, the files to copy, and the build procedure for
lifting this system to a second site.

## Site-prefix seams — strings to rename

These are the four places where the site name is hardcoded. A second site renames all four
to match its own identity:

1. **`widget-loader.js`** — the loader's `REQUIRED_GLOBALS` map (line ~43):
   ```js
   const REQUIRED_GLOBALS = {
     react18: 'CbeyReact',
     svelte5: 'CbeySvelte',  // rename 'CbeySvelte' to 'YourSiteSvelte'
   };
   ```

2. **`JsWidgetMount.php`** — the mount formatter's `RUNTIME_LIBRARIES` map (line ~56):
   ```php
   'svelte5' => 'cbey_js_widgets/svelte5',  // rename to 'yoursite_js_widgets/svelte5'
   ```

3. **Drupal module name** — rename the `cbey_js_widgets` folder and all internal references to
   `yoursite_js_widgets`.

4. **npm and Composer package names** — rename `@square360/cbey-js-widgets` and
   `square360/cbey-js-widgets` accordingly.

No other changes needed. The runtime, the build scripts, the loader contract, and the widget
template are all generic.

## Files to copy

From the `square360/cbey-js-widgets` catalog package:

- `src/runtimes/svelte5/` — the entire directory
- `scripts/build-runtime.mjs` — unchanged
- `vite.config.ts` — the `svelteRuntimeGlobal()` plugin; edit only `SVELTE_RUNTIME_GLOBAL` (line ~43)
- `package.json` — Svelte 5, `@sveltejs/vite-plugin-svelte`, Vitest, happy-dom

From `cbey_js_widgets` Drupal module:

- `js/runtimes/svelte5.bundle.js` — the built runtime
- `src/Plugin/Field/FieldFormatter/JsWidgetMount.php` — the mount formatter (edit `RUNTIME_LIBRARIES`)
- `js/widget-loader.js` — the loader (edit `REQUIRED_GLOBALS`)
- `cbey_js_widgets.libraries.yml` — the library declarations (add the `svelte5` entry)

The widget entrypoint (`index.ts`), component structure, test setup, and all tooling are
portable as-is.

## Build procedure

### 1. Set up the catalog package

```bash
git clone {your-fork} your-site-js-widgets
cd your-site-js-widgets
npm install
```

### 2. (Optional) Add your first Svelte widget

Follow `docs/intake-recipe-svelte.md`. The widget goes in `src/widgets/{widget-id}/` and
exports a mount function from `index.ts`.

### 3. Build the widget bundle AND the runtime

`npm run build` does the whole thing — widgets, manifest, then the runtime:

```bash
npm run build                     # widgets + manifest + runtime bundle
```

The runtime rebuild is chained into `build` deliberately. Vite runs with `emptyOutDir: true`,
so a bare `vite build` empties `dist/` and takes the committed runtime bundle with it. Keep
that chaining when you port this to another site.

Verify:
- `dist/widgets/{widget-id}/{widget-id}.*.js` — the widget bundle
- `dist/widgets/{widget-id}/{widget-id}.*.css` — the extracted stylesheet
- `dist/manifest.json` — the manifest with the widget and `svelte5` in `supportedRuntimes`
- `dist/runtimes/svelte5.bundle.js` — the shared runtime (~36 KB gzipped)

### 4. Copy the runtime to the Drupal module

```bash
cp dist/runtimes/svelte5.bundle.js \
  ../your-site-drupal/web/modules/custom/yoursite_js_widgets/js/runtimes/svelte5.bundle.js
```

Commit this file to git.

### 5. Update the Drupal library declarations

In `yoursite_js_widgets.libraries.yml`, add:

```yaml
svelte5:
  js:
    js/runtimes/svelte5.bundle.js:
      minified: true
      preprocess: false
```

### 6. Update the mount formatter and loader

- `JsWidgetMount.php`: Change `'svelte5' => 'cbey_js_widgets/svelte5'` to
  `'svelte5' => 'yoursite_js_widgets/svelte5'`
- `widget-loader.js`: Change `svelte5: 'CbeySvelte'` to `svelte5: 'YourSiteSvelte'`

### 7. Register the widget in the manifest

The manifest is auto-generated in `dist/manifest.json` by `scripts/emit-manifest.mjs`.
No hand-editing needed.

## Version locking — THE CRUCIAL CONSTRAINT

**The runtime bundle and every Svelte widget bundle are version-locked.**

`svelte/internal/client` is a private, unversioned API surface. The runtime exposes the entire
namespace so widget bundles can resolve against it. This means:

- The runtime bundle and all widget bundles must be built from the same Svelte version.
- A Svelte upgrade requires rebuilding the runtime AND every widget, together.
- Uploading a new widget bundle against an old runtime (or vice versa) causes silent runtime
  errors or cryptic type mismatches.

**Runtime version detection:** The runtime hard-codes the Svelte version it compiled against
and logs a console warning (once per page) if `window.CbeySvelte.version` differs from the
version in the widget bundles. Drift surfaces as a warning rather than a silent failure.

**Consequence:** Whenever you upgrade Svelte:

```bash
npm install svelte@latest
npm run build                      # widget bundles AND the runtime
cp dist/runtimes/svelte5.bundle.js {drupal-module}/js/runtimes/svelte5.bundle.js
git commit -m "chore: rebuild Svelte bundles with v5.X.X"
```

Deploy the whole batch together — do not stagger the runtime and the widgets across releases.

## Which runtime bundles ship

`dist/runtimes/svelte5.bundle.js` is **committed**. Nothing builds runtimes in CI, so the bundle
has to be in the package or there is nothing to serve and nothing for the test setup to load.

`dist/runtimes/react18.bundle.js` is **not** committed, and the asymmetry is intentional: Svelte
widgets externalise against `window.CbeySvelte` and cannot run without it, whereas React widgets
bundle their own copy of React and nothing resolves against `window.CbeyReact`. Do not commit the
react18 bundle to make the two look consistent.

`scripts/build-runtime.mjs` stages its Vite output in `dist/runtimes/_tmp` and removes the
directory after copying the bundle up. That cleanup matters because `dist/` ships as a
`type: drupal-library` package — anything left behind installs on every site.

## Testing on the second site

1. Run the catalog package tests to confirm the runtime and any widgets work locally.
2. Deploy the updated Drupal module to a multidev or test environment.
3. Create a `js_widget` paragraph and select the Svelte widget from `field_widget_id`.
4. Verify:
   - The widget renders inside the loader's shadow root.
   - No widget styles leak into the host page.
   - No host page styles break the widget.
   - `window.CbeySvelte.version` matches the Svelte version in `package.json` (check browser console).
   - No external HTTP requests to CDNs (inspect the network panel).
5. Run a keyboard accessibility pass and a screen-reader test (if the widget has custom
   interaction).

## References

- `docs/intake-recipe-svelte.md` — the full procedure for porting a static page or component.
- `src/runtimes/svelte5/README.md` — what the runtime global exposes and how externalisation works.
- `src/widgets/career-explorer/README.md` — accessibility notes and implementation gotchas for
  the first Svelte widget.
