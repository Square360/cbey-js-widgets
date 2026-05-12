#!/usr/bin/env node
/**
 * @file
 * Build a shared runtime bundle (React 18 for v1).
 *
 * Usage:
 *   node scripts/build-runtime.mjs react18
 *
 * Output: dist/runtimes/{runtime}.bundle.js
 *
 * The output is a standalone IIFE bundle: it includes React, ReactDOM,
 * and react-dom/client, and assigns them to `window.CbeyReact` (for
 * react18). Atlas copies this file into cbey-d8 at:
 *
 *   web/modules/custom/cbey_js_widgets/js/runtimes/react18.bundle.js
 *
 * so Drupal's `cbey_js_widgets/react18` library serves it from the
 * site's own origin. The widget bundles produced by `vite build`
 * externalise react / react-dom / react-dom/client and resolve them
 * to this global at runtime.
 */
import { build } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const runtime = process.argv[2] ?? 'react18';

const KNOWN = new Set(['react18']);
if (!KNOWN.has(runtime)) {
  console.error(`[build-runtime] Unknown runtime "${runtime}".`);
  console.error('  Supported: react18');
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
await build({
  configFile: false,
  root: repoRoot,
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

const tmpOut = resolve(repoRoot, `dist/runtimes/_tmp/${runtime}.bundle.js`);
const finalOut = resolve(outDir, `${runtime}.bundle.js`);
copyFileSync(tmpOut, finalOut);
console.log(`[build-runtime] Wrote ${finalOut}`);
