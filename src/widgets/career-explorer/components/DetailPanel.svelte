<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /**
     * Incremented by the parent on every explicit open. Filter-driven
     * re-renders leave it alone, which is how the source distinguished
     * openRoster() (scrolls) from renderPanel() (does not).
     */
    scrollSignal: number;
    /** Id of the heading inside the panel, for the region's accessible name. */
    labelledBy: string;
    children: Snippet;
  }

  const { scrollSignal, labelledBy, children }: Props = $props();

  let el = $state<HTMLDivElement | null>(null);

  /**
   * A11Y (WCAG 2.4.3 Focus Order, A) — where the keyboard goes when the
   * panel opens.
   *
   * The supplied page scrolled the panel into view and left focus on the
   * cell that was clicked. That works for a mouse and for nobody else: a
   * keyboard or screen-reader user activating a cell got no indication
   * anything had happened, and the panel sits after the whole 23x9 table in
   * the DOM, so reaching it meant tabbing past every remaining cell.
   *
   * Focus moves to the panel container instead — not to the first control
   * inside it, which would skip the heading and the count that say what
   * just opened. The container is tabindex="-1" (programmatically
   * focusable, never a tab stop) and carries role="region" plus a name
   * taken from its own heading, so it is also reachable from a screen
   * reader's landmark list afterwards.
   *
   * preventScroll is used, then scrollIntoView runs separately, so the
   * scroll honours prefers-reduced-motion rather than the jump the browser
   * would do on focus.
   */
  const reducedMotion = () =>
    typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  $effect(() => {
    // Read the signal so the effect re-runs on every explicit open.
    void scrollSignal;
    if (!el) {
      return;
    }
    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true });
    }
    // happy-dom (and older Safari) do not implement scrollIntoView options.
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  });
</script>

<div
  class="panel"
  bind:this={el}
  tabindex="-1"
  role="region"
  aria-labelledby={labelledBy}
>
  {@render children()}
</div>
