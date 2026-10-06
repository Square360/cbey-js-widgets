<script lang="ts">
  import Icon from './Icon.svelte';
  import type { OrgType } from '../types';

  interface Props {
    search: string;
    orgOrder: string[];
    orgTypes: Record<string, OrgType>;
    /** Org types the visitor has explicitly picked. Empty means "all". */
    selectedOrgs: string[];
    /** Effective filter set: selectedOrgs when non-empty, else orgOrder. */
    activeOrgs: string[];
    resetDisabled: boolean;
    onSearch: (value: string) => void;
    onToggleOrg: (org: string) => void;
    onReset: () => void;
  }

  const {
    search,
    orgOrder,
    orgTypes,
    selectedOrgs,
    activeOrgs,
    resetDisabled,
    onSearch,
    onToggleOrg,
    onReset,
  }: Props = $props();

  // The source held a reference to #search to clear and refocus it. Here the
  // element binds to a local, so nothing queries the document.
  let searchEl = $state<HTMLInputElement | null>(null);

  function clearSearch() {
    onSearch('');
    searchEl?.focus();
  }
</script>

<div class="controls">
  <div class="searchrow">
    <div class="search">
      <Icon name="search" />
      <input
        bind:this={searchEl}
        type="text"
        value={search}
        placeholder="Search a name, organization, role, or degree…"
        autocomplete="off"
        aria-label="Search alumni"
        oninput={(e) => onSearch((e.currentTarget as HTMLInputElement).value)}
      />
      {#if search}
        <button class="clear" aria-label="Clear search" onclick={clearSearch}>
          <Icon name="x" />
        </button>
      {/if}
    </div>
    <button class="reset-btn" disabled={resetDisabled} onclick={onReset}>
      <Icon name="refresh" />Reset view
    </button>
  </div>
  <div class="togglerow">
    <span class="lbl">Organization type</span>
    {#each orgOrder as org (org)}
      {@const type = orgTypes[org]}
      {#if type}
        {@const on = activeOrgs.includes(org)}
        <button
          class="orgtoggle"
          class:sel={selectedOrgs.length > 0 && on}
          aria-pressed={on ? 'true' : 'false'}
          onclick={() => onToggleOrg(org)}
        >
          <span class="sw" style="background:{type.color}"></span>{type.label}
        </button>
      {/if}
    {/each}
    <span class="toggle-hint">click a type to focus it</span>
  </div>
</div>
