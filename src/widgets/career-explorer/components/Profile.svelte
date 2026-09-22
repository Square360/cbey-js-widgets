<script lang="ts">
  import Avatar from './Avatar.svelte';
  import Icon from './Icon.svelte';
  import type { Alum, OrgType, Sector } from '../types';

  interface Props {
    alum: Alum;
    orgTypes: Record<string, OrgType>;
    /**
     * The job functions from the SAME payload the alum came from. `funcs`
     * holds positional indices into this array; the widget never carries a
     * copy of its own, so the mapping cannot drift from the data.
     */
    sectors: Sector[];
    avatarColor: string;
    backLabel: string;
    /** See the note on the same prop in Roster.svelte. */
    titleId: string;
    onBack: () => void;
    onClose: () => void;
  }

  const {
    alum,
    orgTypes,
    sectors,
    avatarColor,
    backLabel,
    titleId,
    onBack,
    onClose,
  }: Props = $props();

  const meta = $derived([alum.degree, alum.year].filter(Boolean).join(' '));
  const roleLine = $derived([alum.role, alum.org].filter(Boolean).join(', '));
  // An out-of-range index would be a normalisation bug upstream; drop it
  // rather than render "undefined".
  const functions = $derived(
    (alum.funcs ?? []).map((f) => sectors[f]?.label).filter((l): l is string => Boolean(l)),
  );
</script>

<div class="panel-top">
  <button class="back-btn" onclick={onBack}>
    <Icon name="arrow-left" />{backLabel}
  </button>
  <button class="close-btn" onclick={onClose}><Icon name="x" />Close</button>
</div>

<div class="profile">
  <div class="profile-head">
    <Avatar color={avatarColor} size="lg" />
    <div>
      <!-- A11Y (1.3.1, A) — see the note on .panel-title in Roster.svelte. -->
      <h3 class="profile-name" id={titleId}>{alum.name}</h3>
      <div class="profile-role">{roleLine}</div>
      <div class="profile-badges">
        {#if meta}
          <span class="pbadge">{meta}</span>
        {/if}
        {#each alum.orgs ?? [] as org (org)}
          {@const type = orgTypes[org]}
          {#if type}
            <span class="pbadge org">
              <span class="sw" style="background:{type.color}"></span>{type.label}
            </span>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  {#if alum.desc}
    <p class="profile-desc">{alum.desc}</p>
  {/if}

  {#if alum.cats?.length}
    <div class="profile-section">
      <div class="ps-label">Impact themes</div>
      <div class="chips">
        {#each alum.cats as cat (cat)}
          <span class="chip">{cat}</span>
        {/each}
      </div>
    </div>
  {/if}

  {#if functions.length}
    <div class="profile-section">
      <div class="ps-label">Career functions</div>
      <div class="chips">
        {#each functions as fn (fn)}
          <span class="chip fn">{fn}</span>
        {/each}
      </div>
    </div>
  {/if}

  <div class="profile-actions">
    {#if alum.linkedin}
      <!--
        The href is the one place an externally-editable field reaches an
        attribute rather than a text node. Svelte escapes the value, but
        escaping does not stop a `javascript:` URL, so the scheme is
        checked before the link is rendered at all.
      -->
      {#if /^https?:\/\//i.test(alum.linkedin)}
        <a class="li-btn" href={alum.linkedin} target="_blank" rel="noopener noreferrer">
          <Icon name="brand-linkedin" />View LinkedIn
        </a>
      {:else}
        <span class="li-btn disabled">
          <Icon name="brand-linkedin" />No LinkedIn on file
        </span>
      {/if}
    {:else}
      <span class="li-btn disabled">
        <Icon name="brand-linkedin" />No LinkedIn on file
      </span>
    {/if}
  </div>
</div>
