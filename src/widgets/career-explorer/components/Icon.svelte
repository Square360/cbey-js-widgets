<script lang="ts">
  /**
   * Inline replacements for the Tabler icon webfont the source page pulled
   * from cdn.jsdelivr.net.
   *
   * Two reasons they are inline SVG rather than a font:
   *  - no runtime third-party CDN on a public Yale page;
   *  - @font-face declared inside a shadow root is the unreliable path, and
   *    an icon font is not something the CBEY theme registers at document
   *    level the way it does Mallory and YaleNew.
   *
   * Paths traced from @tabler/icons 2.44.0, the version the source pinned.
   * The wrapping <i> keeps every `font-size` rule in styles.css governing
   * the icon size exactly as it did with the webfont.
   */
  interface Props {
    name:
      | 'search'
      | 'x'
      | 'refresh'
      | 'arrow-left'
      | 'chevron-right'
      | 'user'
      | 'brand-linkedin';
    class?: string;
  }

  const { name, class: className = '' }: Props = $props();
</script>

<i class="ti {className}" aria-hidden="true">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
  >
    {#if name === 'search'}
      <circle cx="10" cy="10" r="7" />
      <line x1="21" y1="21" x2="15" y2="15" />
    {:else if name === 'x'}
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    {:else if name === 'refresh'}
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    {:else if name === 'arrow-left'}
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="12" x2="11" y2="18" />
      <line x1="5" y1="12" x2="11" y2="6" />
    {:else if name === 'chevron-right'}
      <polyline points="9 6 15 12 9 18" />
    {:else if name === 'user'}
      <circle cx="12" cy="7" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    {:else if name === 'brand-linkedin'}
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <line x1="8" y1="8" x2="8" y2="8.01" />
      <line x1="12" y1="16" x2="12" y2="11" />
      <path d="M16 16v-3a2 2 0 0 0 -4 0" />
    {/if}
  </svg>
</i>
