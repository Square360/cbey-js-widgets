import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { readdirSync, statSync, existsSync } from 'node:fs';

/**
 * Multi-entry build configuration for the widget catalog.
 *
 * ENTRY CONVENTION (one per widget directory under src/widgets/):
 *   React widgets  → index.tsx
 *   Svelte widgets → index.ts  (alongside the .svelte component tree)
 * Discovery is explicit, not a blind glob: a directory containing both
 * is a build error, because the runtime it would be attributed to is
 * ambiguous and the manifest carries exactly one `runtime` per widget.
 *
 * RUNTIME LINKAGE — the two frameworks are deliberately treated differently:
 *
 *   React  is BUNDLED into each widget bundle (v1 decision, unchanged).
 *          The `cbey_js_widgets/react18` shared-runtime library exists but
 *          nothing currently resolves against it.
 *
 *   Svelte is EXTERNALISED against `window.CbeySvelte`, populated by the
 *          `cbey_js_widgets/svelte5` Drupal library. See the
 *          svelteRuntimeGlobal() plugin below and
 *          src/runtimes/svelte5/README.md.
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

/**
 * Window global that carries the shared Svelte runtime.
 *
 * PORTABILITY SEAM. A second site standing this pattern up renames this
 * to match its own `widget-loader.js` REQUIRED_GLOBALS entry. It is the
 * only CBEY-specific string in the build tooling.
 */
const SVELTE_RUNTIME_GLOBAL = 'CbeySvelte';

/**
 * Bare specifiers served from the shared runtime global, mapped to the
 * key they occupy on it. Anything a widget imports from Svelte that is
 * NOT listed here bundles into the widget as usual.
 */
const SHARED_SVELTE_MODULES: Record<string, string> = {
  svelte: 'svelte',
  'svelte/internal/client': 'internal',
  'svelte/store': 'store',
};

const VIRTUAL_PREFIX = '\0cbey-svelte-global:';

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
    const reactEntry = resolve(widgetDir, 'index.tsx');
    const svelteEntry = resolve(widgetDir, 'index.ts');
    const hasReact = existsSync(reactEntry);
    const hasSvelte = existsSync(svelteEntry);
    if (hasReact && hasSvelte) {
      throw new Error(
        `[widget-entries] "${dirent}" contains both index.tsx and index.ts. `
        + 'A widget declares exactly one runtime; pick one entry file.',
      );
    }
    if (hasReact) {
      entries[dirent] = reactEntry;
    }
    else if (hasSvelte) {
      entries[dirent] = svelteEntry;
    }
  }
  return entries;
}

/**
 * Rewrite Svelte's runtime imports onto the shared runtime global.
 *
 * Compiled Svelte 5 components emit `import * as $ from
 * 'svelte/internal/client'`. That module IS the Svelte 5 runtime — the
 * public `svelte` module is a thin facade over it — so externalising
 * only the facade would share nothing worth sharing.
 *
 * The loader dynamic-imports widget bundles from a URL with no import
 * map in play, so a plain `external` entry would leave an unresolvable
 * bare specifier in the output. Instead each shared specifier resolves
 * to a generated shim module that re-exports the runtime's members off
 * `window.{SVELTE_RUNTIME_GLOBAL}`.
 *
 * The export names are read from the installed Svelte package at config
 * time rather than hand-listed, so a Svelte upgrade needs no edit here.
 * `svelte/internal/client` is a private, unversioned API surface, so the
 * runtime bundle and the widget bundles are version-locked: the shim
 * warns loudly at load time if the global reports a different version
 * than the one this build compiled against.
 */
async function svelteRuntimeGlobal(): Promise<Plugin> {
  const svelteVersion: string = (
    await import('svelte/package.json', { with: { type: 'json' } })
  ).default.version;

  // Enumerate each shared module's exports from the installed package.
  const exportNames: Record<string, string[]> = {};
  for (const specifier of Object.keys(SHARED_SVELTE_MODULES)) {
    const mod = await import(specifier);
    exportNames[specifier] = Object.keys(mod).filter((name) => {
      // Export names must be valid IdentifierNames for the `export { x as
      // name }` form below. Nothing in Svelte currently fails this; a
      // future export that did would silently vanish, so warn.
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
        return true;
      }
      console.warn(
        `[svelte-runtime-global] Skipping non-identifier export "${name}" from ${specifier}.`,
      );
      return false;
    });
  }

  return {
    name: 'cbey:svelte-runtime-global',
    enforce: 'pre',
    resolveId(source) {
      if (source.startsWith(VIRTUAL_PREFIX)) {
        return source;
      }
      if (Object.prototype.hasOwnProperty.call(SHARED_SVELTE_MODULES, source)) {
        return VIRTUAL_PREFIX + source;
      }
      return null;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null;
      }
      const specifier = id.slice(VIRTUAL_PREFIX.length);
      const globalKey = SHARED_SVELTE_MODULES[specifier];
      const names = exportNames[specifier] ?? [];

      const lines = [
        `const __rt = (() => {`,
        `  const g = typeof window === 'undefined' ? undefined : window.${SVELTE_RUNTIME_GLOBAL};`,
        `  if (!g || !g[${JSON.stringify(globalKey)}]) {`,
        `    throw new Error('Shared Svelte runtime missing: window.${SVELTE_RUNTIME_GLOBAL}.${globalKey} is not present. Is the cbey_js_widgets/svelte5 library attached?');`,
        `  }`,
        `  if (g.version !== ${JSON.stringify(svelteVersion)} && !g.__cbeyVersionWarned) {`,
        `    g.__cbeyVersionWarned = true;`,
        `    console.warn('[cbey-js-widgets] Svelte runtime version mismatch: bundle built against ${svelteVersion}, page has ' + g.version + '. Rebuild and recopy the runtime bundle.');`,
        `  }`,
        `  return g[${JSON.stringify(globalKey)}];`,
        `})();`,
      ];
      names.forEach((name, index) => {
        lines.push(
          `const __e${index} = __rt[${JSON.stringify(name)}];`,
          `export { __e${index} as ${name} };`,
        );
      });
      return lines.join('\n');
    },
  };
}

export default defineConfig(async () => ({
  plugins: [
    await svelteRuntimeGlobal(),
    react(),
    svelte({
      // LOAD-BEARING. The Drupal loader attaches an open shadow root to
      // every mount point and injects the widget's stylesheet as a
      // <link> inside it, from the manifest's `styles` URL. Svelte's
      // alternative — injecting component CSS into document.head — lands
      // outside the shadow boundary and silently does nothing: the
      // widget renders completely unstyled with no console error.
      // emitCss:true routes component styles through Vite's CSS pipeline
      // so they are extracted to dist/{widget-id}/{widget-id}.{hash}.css.
      emitCss: true,
    }),
  ],
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
      // Preserve each entry file's exports — Vite's default treats this as
      // an app build and tree-shakes unused exports. Our widgets export a
      // default `mount` function that's consumed externally by the Drupal
      // loader's dynamic import(), so Rollup must keep that export shape.
      preserveEntrySignatures: 'exports-only',
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
    // Vitest runs through this same config, so the svelteRuntimeGlobal()
    // plugin above rewrites Svelte imports in tests too. The setup file
    // evaluates the shipped runtime bundle to populate the global, which
    // means tests exercise the real externalisation path rather than a
    // separately-resolved copy of Svelte.
    setupFiles: ['tests/setup-svelte-runtime.ts'],
  },
}));
