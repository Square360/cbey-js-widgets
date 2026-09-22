/**
 * @file
 * Ambient declaration for Svelte's internal client runtime.
 *
 * `svelte/internal/client` is deliberately untyped by the Svelte package —
 * it is a private, unversioned API surface, not a supported import for
 * application code. The shared runtime bundle imports it anyway, because
 * it IS the Svelte 5 runtime and is what every compiled component
 * resolves against. Declaring it here keeps `tsc --noEmit` honest about
 * that: the namespace is `any`, which is the truth.
 */
declare module 'svelte/internal/client';
