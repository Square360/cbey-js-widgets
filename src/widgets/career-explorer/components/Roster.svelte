<script lang="ts">
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import type { Alum, OrgType, PanelHeader } from '../types';

  interface Props {
    header: PanelHeader;
    /** Alumni in scope, already filtered and sorted. */
    people: Alum[];
    orgTypes: Record<string, OrgType>;
    /** Colour lookup for each alum's avatar, by name. */
    avatarColor: (a: Alum) => string;
    /** "All of …" link when a cell sits inside the focused row/column. */
    backLabel: string | null;
    /**
     * Id put on the panel heading so DetailPanel's role="region" can name
     * itself from it. Ids are safe as constants here: the widget lives in
     * its own shadow root, so there is no document-wide collision to have.
     */
    titleId: string;
    onBack: () => void;
    onClose: () => void;
    onOpenProfile: (name: string) => void;
  }

  const {
    header,
    people,
    avatarColor,
    backLabel,
    titleId,
    onBack,
    onClose,
    onOpenProfile,
  }: Props = $props();
</script>

<div class="panel-top">
  <div>
    {#if backLabel}
      <button class="back-btn" style="margin-bottom:8px" onclick={onBack}>
        <Icon name="arrow-left" />{backLabel}
      </button>
    {/if}
    <div class="panel-eyebrow">{header.eyebrow}</div>
    <!--
      A11Y (1.3.1, A) — a heading, not a styled <div>. The panel had none, so
      it was invisible to heading navigation and had nothing to name the
      region with. .panel-title already declared font-size, weight and
      line-height explicitly, so the tag change renders identically.
    -->
    <h3 class="panel-title" id={titleId}>
      {#each header.title as part, index (index)}
        <span class:times={part.muted}>{part.text}</span>
      {/each}
    </h3>
    <div class="panel-sub">{header.sub}</div>
  </div>
  <button class="close-btn" onclick={onClose}><Icon name="x" />Close</button>
</div>

<div class="roster">
  {#if people.length === 0}
    <div class="roster-empty">
      No alumni here match the current filters. Clear a filter to see more.
    </div>
  {:else}
    {#each people as alum (alum.name)}
      <button class="alum-row" onclick={() => onOpenProfile(alum.name)}>
        <Avatar color={avatarColor(alum)} />
        <span class="alum-main">
          <span class="alum-name">{alum.name}</span>
          <span class="alum-role">
            {[alum.role, alum.org].filter(Boolean).join(', ')}
          </span>
        </span>
        <span class="alum-meta">
          {[alum.degree, alum.year].filter(Boolean).join(' ')}
        </span>
        <Icon name="chevron-right" class="alum-chev" />
      </button>
    {/each}
  {/if}
</div>

<style>
  /*
    The roster rows were <div>s with click handlers in the source. They are
    <button>s here so they are reachable and operable from the keyboard, and
    the block children need restoring inside the button's inline context.
    Component-scoped because the change belongs to this element, not the
    ported sheet.
  */
  .alum-main,
  .alum-name,
  .alum-role {
    display: block;
  }
</style>
