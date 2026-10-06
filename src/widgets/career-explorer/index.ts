/**
 * @file
 * Career Explorer — widget entry point.
 *
 * Svelte widgets use `index.ts` (React widgets use `index.tsx`); see the
 * entry convention in vite.config.ts. The default export matches the Drupal
 * loader's mount contract exactly:
 *
 *   (shadowHost, shadowRoot, config) => () => void
 *
 * Svelte's runtime is NOT bundled here — it resolves against the shared
 * `window.CbeySvelte` global supplied by the cbey_js_widgets/svelte5 Drupal
 * library. See src/runtimes/svelte5/README.md, and rebuild both together.
 */
import { mount, unmount } from 'svelte';
import CareerExplorer from './CareerExplorer.svelte';
import type { CareerExplorerConfig } from './types';
import './styles.css';

export default function mountCareerExplorer(
  shadowHost: HTMLElement,
  // The loader passes the shadow root; this widget never needs it, because
  // nothing queries outside its own component tree. Kept for contract shape.
  _shadowRoot: ShadowRoot,
  config: CareerExplorerConfig | null | undefined,
): () => void {
  const app = mount(CareerExplorer, {
    target: shadowHost,
    props: { config: config ?? {} },
  });

  return () => {
    void unmount(app);
  };
}
