/**
 * Svelte config for the tooling that reads it outside Vite — chiefly
 * svelte-check, which typechecks the .svelte files `tsc --noEmit` cannot
 * see. The Vite build gets its Svelte options from vite.config.ts; keep
 * the two in step if compiler options are ever added here.
 */
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
