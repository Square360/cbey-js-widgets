#!/usr/bin/env node
/**
 * @file
 * Build a shared runtime bundle.
 *
 * Usage:
 *   node scripts/build-runtime.mjs react18
 *   node scripts/build-runtime.mjs svelte5
 *
 * Output: dist/runtimes/{runtime}.bundle.js
 *
 * The output is a standalone IIFE bundle assigning the framework to a
 * `window.Cbey*` global. Its source is src/runtimes/{runtime}/build-runtime.ts;
 * see that directory's README for what each global exposes.
 *
 * The built file is copied into cbey-d8 at:
 *
 *   web/modules/custom/cbey_js_widgets/js/runtimes/{runtime}.bundle.js
 *
 * so the matching Drupal library serves it from the site's own origin.
 *
 * Whether widget bundles actually resolve against the global differs by
 * runtime, and the difference is deliberate:
 *
 *   react18 — React is BUNDLED into each widget bundle (v1 decision).
 *             This shared bundle is loaded but nothing resolves against
 *             it yet. Left in place; externalising React is a separate
 *             change to vite.config.ts.
 *   svelte5 — widget bundles DO externalise against `window.CbeySvelte`.
 *             See svelteRuntimeGlobal() in vite.config.ts. Because
 *             `svelte/internal/client` is a private API surface, this
 *             bundle and the widget bundles must be rebuilt together;
 *             the widget-side shim warns on a version mismatch.
 */
import { build } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const runtime = process.argv[2] ?? 'react18';

const KNOWN = new Set(['react18', 'svelte5']);
if (!KNOWN.has(runtime)) {
  console.error(`[build-runtime] Unknown runtime "${runtime}".`);
  console.error(`  Supported: ${[...KNOWN].join(', ')}`);
  process.exit(1);
}

const outDir = resolve(repoRoot, 'dist/runtimes');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const entry = resolve(repoRoot, `src/runtimes/${runtime}/build-runtime.ts`);
if (!existsSync(entry)) {
  console.error(`[build-runtime] Entry not found: ${entry}`);
  process.exit(1);
}

// Vite library build: IIFE format, no externals, no minification skip.
// One file out, predictable filename.
//
// `define` substitutes `process.env.NODE_ENV` (and any other `process.env.*`
// access) at build time so the resulting IIFE is browser-safe. React's
// source references `process.env.NODE_ENV` for dev-mode checks; without
// substitution, the browser throws `ReferenceError: process is not defined`
// at the very first access. Setting it to `"production"` also routes
// React's conditional exports to the production build.
//
// Values must be valid JS source — see Vite's `define` docs. We deliberately
// substitute the dotted paths only and leave bare `process` alone to avoid
// rewriting unrelated identifiers inside React's source.
await build({
  configFile: false,
  root: repoRoot,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
  },
  build: {
    outDir: 'dist/runtimes/_tmp',
    emptyOutDir: true,
    lib: {
      entry,
      name: 'CbeyRuntime',
      formats: ['iife'],
      fileName: () => `${runtime}.bundle.js`,
    },
    rollupOptions: {
      // No externals — runtime must be standalone.
      external: [],
      output: {
        // Already named above.
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  logLevel: 'info',
});

const tmpDir = resolve(repoRoot, 'dist/runtimes/_tmp');
const tmpOut = resolve(tmpDir, `${runtime}.bundle.js`);
const finalOut = resolve(outDir, `${runtime}.bundle.js`);
copyFileSync(tmpOut, finalOut);

// Vite needs its own outDir, so the bundle is built into dist/runtimes/_tmp
// and copied up. Remove the staging dir afterwards: dist/ is committed and
// ships as a type:drupal-library package, so anything left here is dead
// weight installed on every site (the duplicate is ~97 KB).
rmSync(tmpDir, { recursive: true, force: true });

console.log(`[build-runtime] Wrote ${finalOut}`);
