<script lang="ts">
  interface Props {
    title: string;
    /** Lead sentence; editor-overridable. */
    intro: string;
    /** The live count pill, e.g. "105 alumni" or "12 of 105 alumni match". */
    countText: string;
    /** Number of populated matrix cells. */
    pathCount: number;
    /** "Last updated …" line; empty string hides it. */
    updated: string;
  }

  const { title, intro, countText, pathCount, updated }: Props = $props();
</script>

<!--
  A11Y — the heading is an <h2>, not the supplied <h1>: this widget mounts in
  a paragraph on a page that already has its own <h1>, and a shadow root does
  not hide a heading from the accessibility tree. Styled by .ce-title so the
  rendering is byte-identical to the supplied design.

  The aria-live that sat on .count-pill is gone. It announced a fragment
  mid-sentence and duplicated the root's status region, which now says the
  same thing once, in a full sentence, and covers the detail panel too.
-->
<div class="masthead">
  <h2 class="ce-title">{title}</h2>
  <p class="page-sub">
    {intro}
    <span class="count-pill">{countText}</span>
    across {pathCount} career paths — filter by cell, row, column, or organization
    type to learn more about the alumni.
  </p>
  {#if updated}
    <p class="updated">{updated}</p>
  {/if}
</div>
