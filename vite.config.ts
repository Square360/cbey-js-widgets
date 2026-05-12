import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

/**
 * Multi-entry build configuration for the widget catalog.
 *
 * Every directory under src/widgets/ that contains an index.tsx becomes
 * a build entry.
 *
 * React + ReactDOM are BUNDLED into each widget bundle for v1 (not
 * externalised). Phase 2 can introduce import-map-based sharing when
 * multiple React widgets coexist on a page and bandwidth matters.
 * For now, each widget is self-contained: one React per widget bundle.
 *
 * Output layout:
 *   dist/{widget-id}/{widget-id}.{contentHash}.js
 *   dist/{widget-id}/{widget-id}.{contentHash}.css
 *
 * The post-build script (scripts/emit-manifest.mjs) reads the rollup
 * output and writes dist/manifest.json with content-hashed URLs that
 * Drupal's WidgetCatalogService picks up via composer-installed package.
 *
 * NOTE: `lovable-tagger` and any other framework-author dev plugin is
 * intentionally NOT present. The intake recipe (docs/intake-recipe-react.md)
 * strips them at intake.
 */

const WIDGETS_DIR = resolve(__dirname, 'src/widgets');

function discoverWidgetEntries(): Record<string, string> {
  if (!existsSync(WIDGETS_DIR)) {
    return {};
  }
  const entries: Record<string, string> = {};
  for (const dirent of readdirSync(WIDGETS_DIR)) {
    const widgetDir = resolve(WIDGETS_DIR, dirent);
    if (!statSync(widgetDir).isDirectory()) {
      continue;
    }
    const entry = resolve(widgetDir, 'index.tsx');
    if (existsSync(entry)) {
      entries[dirent] = entry;
    }
  }
  return entries;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Substitute `process.env.NODE_ENV` (and any other `process.env.*` access)
  // at build time so widget bundles are browser-safe. React is bundled
  // into each widget for v1 (see top-of-file note), so React's own
  // `process.env.NODE_ENV` checks also need this substitution — otherwise
  // the browser throws `ReferenceError: process is not defined`. Values
  // must be valid JSON for esbuild — `JSON.stringify('production')` yields
  // `'"production"'`, which is what esbuild needs. We deliberately leave
  // bare `process` alone to avoid rewriting unrelated identifiers.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: discoverWidgetEntries(),
      output: {
        format: 'es',
        entryFileNames: '[name]/[name].[hash].js',
        chunkFileNames: '[name]/chunks/[name].[hash].js',
        assetFileNames: ({ name }) => {
          if (name && name.endsWith('.css')) {
            // Pull the widget id out of the chunk name and route the CSS
            // to that widget's directory.
            const widgetId = name.replace(/\.css$/, '');
            return `${widgetId}/${widgetId}.[hash][extname]`;
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['tests/**/*.test.{ts,tsx,js}'],
  },
});
