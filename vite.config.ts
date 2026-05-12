import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

/**
 * Multi-entry build configuration for the widget catalog.
 *
 * Every directory under src/widgets/ that contains an index.tsx becomes
 * a build entry. React + ReactDOM are externalised — widgets pull them
 * from `window.CbeyReact` at runtime, served by the react18 shared
 * library in Drupal.
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
  // at build time so widget bundles are browser-safe. React itself is
  // externalised to `window.CbeyReact`, but widget source or any non-
  // externalised transitive dep may still reference `process.env.*`. Without
  // this, the browser throws `ReferenceError: process is not defined`.
  // Values must be valid JS source — `JSON.stringify('production')` yields
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
      // Externalise React and rewrite imports to the shared global at
      // runtime. Widget bundles emit `window.CbeyReact.React` etc. instead
      // of bundling their own React copy.
      external: ['react', 'react-dom', 'react-dom/client'],
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
        globals: {
          react: 'CbeyReact.React',
          'react-dom': 'CbeyReact.ReactDOM',
          'react-dom/client': 'CbeyReact',
        },
        paths: {
          react: 'window.CbeyReact.React',
          'react-dom': 'window.CbeyReact.ReactDOM',
          'react-dom/client': 'window.CbeyReact',
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
