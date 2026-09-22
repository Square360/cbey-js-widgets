/**
 * @file
 * Svelte 5 runtime bundle source.
 *
 * Built as a standalone IIFE by scripts/build-runtime.mjs. Assigns the
 * Svelte 5 runtime to `window.CbeySvelte` so widget bundles resolve
 * their Svelte imports to this single instance rather than each
 * carrying their own copy.
 *
 * `svelte/internal/client` IS the Svelte 5 runtime — the public `svelte`
 * module is a thin facade over it, and compiled components import the
 * internal namespace directly. Both are exposed here; see
 * vite.config.ts's svelteRuntimeGlobal() plugin for the widget-side
 * shim that consumes them.
 *
 * `svelte/internal/client` is a private, unversioned API surface. The
 * runtime bundle and the widget bundles it serves must be built from the
 * same Svelte version; `version` below is what the widget-side shim
 * checks to catch drift.
 *
 * Nothing here is site-specific. A second site copies this file
 * unchanged and renames only the global (see SVELTE_RUNTIME_GLOBAL in
 * vite.config.ts and REQUIRED_GLOBALS in widget-loader.js).
 */

import * as svelte from 'svelte';
import * as internal from 'svelte/internal/client';
import * as store from 'svelte/store';
// Read straight from the installed package so the reported version can
// never drift from the code actually bundled here. Vite's JSON plugin
// tree-shakes this to the single string.
import { version } from 'svelte/package.json';

declare global {
  interface Window {
    CbeySvelte?: {
      /** Public `svelte` module namespace: mount, unmount, tick, … */
      svelte: typeof svelte;
      /** `svelte/internal/client` — what compiled components import. */
      internal: typeof internal;
      /** `svelte/store` — writable/readable/derived/get. */
      store: typeof store;
      /** Svelte version this bundle was built from. */
      version: string;
      placeholder?: boolean;
      __cbeyVersionWarned?: boolean;
    };
  }
}

(() => {
  if (typeof window === 'undefined') {
    return;
  }
  // Idempotent: if a previous load already attached, don't clobber.
  if (window.CbeySvelte && !window.CbeySvelte.placeholder) {
    return;
  }
  window.CbeySvelte = {
    svelte,
    internal,
    store,
    version,
  };
})();
