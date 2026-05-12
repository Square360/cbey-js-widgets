/**
 * Typed source of truth for the published widget manifest.
 *
 * The build step (scripts/emit-manifest.mjs) reads this array, looks up
 * the content-hashed bundle and stylesheet file names emitted by Vite,
 * and writes dist/manifest.json. Drupal's WidgetCatalogService reads
 * the published JSON file — never this TypeScript source — so the
 * schemaVersion + runtime set stays in sync between catalog and host.
 */

export type WidgetRuntime =
  | 'react18'
  | 'vue3'
  | 'svelte5'
  | 'lit2'
  | 'vanilla';

export interface WidgetManifestEntry {
  /** Stable slug; used as the data-js-widget attribute value. */
  id: string;
  /** Editor-facing label in the paragraph dropdown. */
  label: string;
  /** One-line description for the editor list and the catalog README. */
  description: string;
  /** Widget version; semver. Bump on any user-visible change. */
  version: string;
  /** Runtime the bundle is built against. Drives Drupal library attach. */
  runtime: WidgetRuntime;
  /**
   * Path (relative to the package root) to the built bundle. Filled in
   * by emit-manifest.mjs after Vite has emitted hashed file names.
   */
  bundle?: string;
  /** Path to the widget's stylesheet, same resolution as `bundle`. */
  styles?: string;
  /** Reference to the JSON Schema describing valid config. */
  configSchema: { $ref: string };
  /** Optional preview image (Phase 4). */
  previewImage?: string;
  /** Once true the widget renders but is hidden from new-paragraph picks. */
  deprecated?: boolean;
}

export interface PublishedManifest {
  schemaVersion: 1;
  publishedAt: string;
  supportedRuntimes: WidgetRuntime[];
  widgets: WidgetManifestEntry[];
}

/**
 * Active catalog. Append a new entry per widget. The build step backfills
 * `bundle` and `styles` from the rollup output, so leave them unset here.
 */
export const widgets: WidgetManifestEntry[] = [
  {
    id: 'grid-tech-market-map',
    label: 'Grid Tech Market Map',
    description:
      'Interactive scatter chart plotting grid-tech subcategories by ARL vs. Market Size 2030, grouped by CAGR.',
    version: '0.1.0',
    runtime: 'react18',
    configSchema: { $ref: 'schemas/grid-tech-market-map.json' },
    deprecated: false,
  },
];

export const supportedRuntimes: WidgetRuntime[] = ['react18'];
