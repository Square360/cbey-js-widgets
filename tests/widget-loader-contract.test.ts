/**
 * @file
 * Smoke tests for the loader → widget-bundle contract.
 *
 * The loader source lives in cbey-d8 (`web/modules/custom/cbey_js_widgets/js/widget-loader.js`).
 * Rather than couple this repo to a sibling working copy, we test the
 * shape of the contract from the widget side:
 *
 *   - The bundle's default export is a function.
 *   - Called with (shadowHost, shadowRoot, config), it returns a teardown.
 *   - The teardown unmounts cleanly (no remaining nodes inside shadowHost).
 *
 * Run with: npm test
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';

// Polyfill the React 18 globals that the catalog's vite externals expect
// at runtime.
beforeAll(async () => {
  if (typeof window !== 'undefined' && !window.CbeyReact?.createRoot) {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const { createRoot } = await import('react-dom/client');
    (window as unknown as { CbeyReact: Record<string, unknown> }).CbeyReact = {
      React,
      ReactDOM,
      createRoot,
      version: React.version,
    };
  }
});

// Reuse one host element across tests, cleaning up between cases.
let hostContainer: HTMLDivElement;
let shadowRoot: ShadowRoot;
let shadowHost: HTMLDivElement;

const setupShadowDom = () => {
  hostContainer = document.createElement('div');
  document.body.appendChild(hostContainer);
  shadowRoot = hostContainer.attachShadow({ mode: 'open' });
  shadowHost = document.createElement('div');
  shadowRoot.appendChild(shadowHost);
};

afterEach(() => {
  if (hostContainer && hostContainer.parentNode) {
    hostContainer.parentNode.removeChild(hostContainer);
  }
});

describe('grid-tech-market-map widget bundle', () => {
  it('exports a default function matching the mount contract', async () => {
    const mod = await import('../src/widgets/grid-tech-market-map/index');
    expect(typeof mod.default).toBe('function');
  });

  it('mounts and returns a teardown that unmounts the React tree', async () => {
    setupShadowDom();
    const { default: mount } = await import(
      '../src/widgets/grid-tech-market-map/index'
    );
    const teardown = mount(shadowHost, shadowRoot, {
      defaultCategory: 'energy-storage',
      lockCategory: false,
    });
    // React renders asynchronously; flush a microtask.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(typeof teardown).toBe('function');
    // The widget rendered into the host element.
    expect(shadowHost.children.length).toBeGreaterThan(0);
    teardown();
    // After unmount React's root container has no rendered children.
    expect(shadowHost.children.length).toBe(0);
  });

  it('renders a category selector when lockCategory is false', async () => {
    setupShadowDom();
    const { default: mount } = await import(
      '../src/widgets/grid-tech-market-map/index'
    );
    const teardown = mount(shadowHost, shadowRoot, { lockCategory: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const select = shadowHost.querySelector('select');
    expect(select).not.toBeNull();
    teardown();
  });

  it('hides the category selector when lockCategory is true', async () => {
    setupShadowDom();
    const { default: mount } = await import(
      '../src/widgets/grid-tech-market-map/index'
    );
    const teardown = mount(shadowHost, shadowRoot, {
      defaultCategory: 'energy-storage',
      lockCategory: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const select = shadowHost.querySelector('select');
    expect(select).toBeNull();
    teardown();
  });

  it('falls back to the first category when defaultCategory is unknown', async () => {
    setupShadowDom();
    const { default: mount } = await import(
      '../src/widgets/grid-tech-market-map/index'
    );
    const teardown = mount(shadowHost, shadowRoot, {
      defaultCategory: 'does-not-exist',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Heading carries the widget title; selector reflects the fallback category.
    const select = shadowHost.querySelector('select') as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    if (select) {
      expect(select.value).toBe('energy-storage');
    }
    teardown();
  });
});
