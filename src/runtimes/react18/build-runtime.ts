/**
 * @file
 * React 18 runtime bundle source.
 *
 * Built as a standalone IIFE by scripts/build-runtime.mjs. Assigns the
 * React 18 instance to `window.CbeyReact` so widget bundles (which have
 * `react`, `react-dom`, and `react-dom/client` marked external in their
 * Vite config) resolve their imports to this single instance.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    CbeyReact?: {
      React: typeof React;
      ReactDOM: typeof ReactDOM;
      createRoot: typeof createRoot;
      version: string;
      placeholder?: boolean;
    };
  }
}

(() => {
  if (typeof window === 'undefined') {
    return;
  }
  // Idempotent: if a previous load already attached, don't clobber.
  if (window.CbeyReact && !window.CbeyReact.placeholder) {
    return;
  }
  window.CbeyReact = {
    React,
    ReactDOM,
    createRoot,
    version: React.version,
  };
})();
