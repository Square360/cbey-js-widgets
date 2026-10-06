/**
 * @file
 * Vitest setup: stand up `window.CbeySvelte` before any widget module loads.
 *
 * Svelte widget bundles do not carry Svelte. The `svelteRuntimeGlobal()`
 * plugin in vite.config.ts rewrites `svelte`, `svelte/internal/client` and
 * `svelte/store` onto that global, and Vitest runs through the same Vite
 * config — so a test that imports a Svelte widget hits the same shim the
 * browser does, and fails with "Shared Svelte runtime missing" if nothing
 * has populated the global.
 *
 * Rather than reconstruct the global from the installed package (which would
 * test a different object than production uses), this evaluates the actual
 * shipped runtime bundle — the same IIFE the cbey_js_widgets/svelte5 Drupal
 * library serves.
 *
 * Consequence: `npm run build:runtime svelte5` must have been run at least
 * once. It is not part of `npm run build`, and `vite build` empties dist/,
 * so the order is: build, then build:runtime.
 */
// `?raw` inlines the bundle's source at transform time. Reading it with
// node:fs would not work: the test environment is happy-dom, where Vite
// externalises node builtins.
import bundleSource from '../dist/runtimes/svelte5.bundle.js?raw';

if (!bundleSource || !bundleSource.includes('CbeySvelte')) {
  throw new Error(
    'dist/runtimes/svelte5.bundle.js is missing or does not assign window.CbeySvelte. '
    + 'Run `npm run build:runtime svelte5` (after `npm run build`, which empties dist/).',
  );
}

if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).CbeySvelte) {
  // The bundle is an IIFE that assigns window.CbeySvelte. Evaluating it in
  // global scope is exactly what a <script> tag does on the page.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  new Function(bundleSource)();
}
