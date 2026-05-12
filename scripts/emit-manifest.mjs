#!/usr/bin/env node
/**
 * @file
 * Post-build step: reads the dist/ directory written by Vite and produces
 * dist/manifest.json from src/manifest.ts. Backfills the content-hashed
 * `bundle` and `styles` URLs onto each widget entry.
 *
 * Invoked by `npm run build` after `vite build`.
 */
import {
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
} from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const distDir = resolve(repoRoot, 'dist');

if (!existsSync(distDir)) {
  console.error('[emit-manifest] dist/ not found — run `vite build` first.');
  process.exit(1);
}

// Load the TS manifest by compiling on the fly via tsx/esbuild-loader if
// available, otherwise fall back to a JSON sidecar. For simplicity we let
// the user pre-compile manifest.ts to .mjs (via `tsc`), or we can use a
// lightweight import-from-source-via-typescript hook. To avoid pulling in
// a runtime TS loader, we read the JSON file `src/manifest.json` if
// present; otherwise we require the caller to run typecheck first. For
// v0.1 the simplest contract is: maintain BOTH manifest.ts AND a sibling
// manifest-source.json. To keep that single-source-of-truth pure, this
// script instead asks the user to run the typechecked manifest via the
// `--manifest` option, defaulting to looking for a compiled JS file.
//
// For v0.1, we read manifest definitions directly from a JSON helper.

const manifestSource = await loadManifestSource();
const { widgets, supportedRuntimes } = manifestSource;

const widgetDirs = readdirSync(distDir).filter((entry) => {
  const full = resolve(distDir, entry);
  return statSync(full).isDirectory();
});

const findFile = (widgetId, extension) => {
  const widgetDir = resolve(distDir, widgetId);
  if (!existsSync(widgetDir)) {
    return null;
  }
  const matches = readdirSync(widgetDir)
    .filter((f) => f.endsWith(extension))
    .map((f) => `dist/${widgetId}/${f}`);
  if (matches.length === 0) {
    return null;
  }
  if (matches.length > 1) {
    console.warn(
      `[emit-manifest] Multiple ${extension} files for ${widgetId}; picking ${matches[0]}.`,
    );
  }
  return matches[0];
};

const enriched = widgets.map((widget) => {
  if (!widgetDirs.includes(widget.id)) {
    console.error(
      `[emit-manifest] Widget "${widget.id}" listed in manifest but no dist/${widget.id}/ directory.`,
    );
    process.exit(1);
  }
  const bundle = findFile(widget.id, '.js');
  const styles = findFile(widget.id, '.css');
  if (!bundle) {
    console.error(`[emit-manifest] No bundle .js for widget "${widget.id}".`);
    process.exit(1);
  }
  return {
    ...widget,
    bundle,
    styles: styles ?? undefined,
  };
});

const manifest = {
  schemaVersion: 1,
  publishedAt: new Date().toISOString(),
  supportedRuntimes,
  widgets: enriched,
};

const outPath = resolve(distDir, 'manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`[emit-manifest] wrote ${outPath}`);

// Copy JSON Schemas into dist/ so the configSchema.$ref entries in the
// manifest resolve at runtime. The Drupal-side WidgetCatalogService
// resolves $ref values relative to dirname(manifestPath), so the dist
// copy must mirror the src/schemas/ layout.
const srcSchemaDir = resolve(repoRoot, 'src/schemas');
const distSchemaDir = resolve(distDir, 'schemas');
if (existsSync(srcSchemaDir)) {
  mkdirSync(distSchemaDir, { recursive: true });
  for (const entry of readdirSync(srcSchemaDir)) {
    if (entry.endsWith('.json')) {
      copyFileSync(
        resolve(srcSchemaDir, entry),
        resolve(distSchemaDir, entry),
      );
    }
  }
  console.log(`[emit-manifest] copied schemas to ${distSchemaDir}`);
}

/**
 * Load the manifest source.
 *
 * Strategy: import the .ts via Node's experimental support for native TS
 * if available (Node 22+). Otherwise we tolerate a compiled
 * dist-manifest.js sibling (e.g. produced by `tsc src/manifest.ts`).
 */
async function loadManifestSource() {
  const tsPath = resolve(repoRoot, 'src/manifest.ts');
  try {
    // Node 22+ understands --experimental-strip-types; if invoked under
    // such a Node, the dynamic import works directly.
    const mod = await import(pathToFileURL(tsPath).href);
    return { widgets: mod.widgets, supportedRuntimes: mod.supportedRuntimes };
  }
  catch (err) {
    // Fallback: look for a pre-compiled manifest.mjs that the build can
    // emit. The simplest hand-build path is:
    //   npx tsc src/manifest.ts --module ESNext --target ES2020 \
    //     --outDir scripts/_generated
    //   && node scripts/emit-manifest.mjs
    const fallback = resolve(repoRoot, 'scripts/_generated/manifest.js');
    if (existsSync(fallback)) {
      const mod = await import(pathToFileURL(fallback).href);
      return { widgets: mod.widgets, supportedRuntimes: mod.supportedRuntimes };
    }
    console.error(
      '[emit-manifest] Could not load src/manifest.ts. Either run under Node 22+ with --experimental-strip-types, or pre-compile to scripts/_generated/manifest.js. Underlying error:',
      err.message,
    );
    process.exit(1);
  }
}
