<script lang="ts">
  /**
   * Career Explorer root.
   *
   * Owns the state the source page kept in a module-level `state` object and
   * pushed into the DOM by hand. Everything below the fold here is a
   * derivation: the matrix, the panel, the live count and the reset button's
   * disabled state all fall out of the same few `$state` values, so there is
   * no render()/refresh()/updateX() cascade to keep in step.
   *
   * Two hard rules hold throughout this widget:
   *  1. NO {@html} — every record field reaches the DOM through Svelte's
   *     escaping {expression} interpolation. The data is edited daily by a
   *     non-developer in Airtable and renders on a public Yale page.
   *  2. NO document-level queries — nothing calls getElementById or
   *     querySelector. The source's eight singleton ids are state here.
   */
  import Controls from './components/Controls.svelte';
  import DetailPanel from './components/DetailPanel.svelte';
  import FocusBar from './components/FocusBar.svelte';
  import Masthead from './components/Masthead.svelte';
  import Matrix from './components/Matrix.svelte';
  import Profile from './components/Profile.svelte';
  import Roster from './components/Roster.svelte';
  import {
    alumMatches,
    backLabelFor,
    cellClass,
    cellOrgTypes,
    displayOrg,
    keyOf,
    scopeNames,
    viewHeader,
  } from './logic';
  import type { Alum, AlumniPayload, CareerExplorerConfig, GridRow, View } from './types';

  interface Props {
    config: CareerExplorerConfig;
  }

  const { config }: Props = $props();

  const DEFAULT_TITLE = 'Yale Social Impact · Career Explorer';
  const DEFAULT_INTRO =
    'Every dot is a real Yale alum working in social impact, placed where their impact theme meets their career function.';

  // ---- data ----
  type Status = 'loading' | 'ready' | 'error';
  let status = $state<Status>('loading');
  let errorDetail = $state('');
  let payload = $state<AlumniPayload | null>(null);

  $effect(() => {
    // The endpoint is editor config, not a constant: the path is never baked
    // into the bundle, so the widget is testable against a fixture and a
    // route change is a content edit rather than a rebuild.
    const endpoint = (config.endpoint ?? '').trim();
    if (!endpoint) {
      status = 'error';
      errorDetail =
        'No data endpoint is configured for this widget. Set "endpoint" in the widget configuration.';
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (!response.ok) {
          throw new Error(`The data service responded ${response.status}.`);
        }
        const body = (await response.json()) as AlumniPayload;
        if (cancelled) {
          return;
        }
        if (!body || typeof body !== 'object' || !body.alumni || !body.sectors) {
          throw new Error('The data service returned an unexpected response.');
        }
        payload = body;
        status = 'ready';
      }
      catch (error) {
        if (cancelled) {
          return;
        }
        // Be honest. An empty matrix here would read as "no alumni match
        // your filters", which is a different and wrong statement.
        status = 'error';
        errorDetail = error instanceof Error ? error.message : String(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  // ---- interaction state (was the source's `state` object) ----
  let selectedOrgs = $state<string[]>([]);
  let search = $state('');
  let focusRow = $state<string | null>(null);
  let focusCol = $state<number | null>(null);
  let view = $state<View | null>(null);
  let profileName = $state<string | null>(null);
  let scrollSignal = $state(0);

  // ---- derivations ----
  const orgOrder = $derived(payload?.orgOrder ?? []);
  const orgTypes = $derived(payload?.orgTypes ?? {});
  const sectors = $derived(payload?.sectors ?? []);
  const categories = $derived(payload?.categories ?? []);
  const alumni = $derived(payload?.alumni ?? {});
  const total = $derived(Object.keys(alumni).length);
  const pathCount = $derived(Object.keys(payload?.cellData ?? {}).length);

  /** Empty selection means "show all" — the source's syncActive(). */
  const activeOrgs = $derived(selectedOrgs.length ? selectedOrgs : orgOrder);
  const activeOrgSet = $derived(new Set(activeOrgs));

  const filtered = $derived(search !== '' || selectedOrgs.length > 0);
  const anyStateActive = $derived(
    filtered
    || focusRow !== null
    || focusCol !== null
    || view !== null
    || profileName !== null,
  );

  /** Names passing the current filters — computed once, read everywhere. */
  const matching = $derived.by(() => {
    const set = new Set<string>();
    for (const alum of Object.values(alumni)) {
      if (alumMatches(alum, activeOrgSet, search)) {
        set.add(alum.name);
      }
    }
    return set;
  });

  const countText = $derived(
    filtered ? `${matching.size} of ${total} alumni match` : `${total} alumni`,
  );

  const updatedText = $derived.by(() => {
    if (typeof config.lastUpdated === 'string') {
      // An empty string is an explicit "hide this line".
      return config.lastUpdated;
    }
    if (!payload?.generated) {
      return '';
    }
    const date = new Date(payload.generated * 1000);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `Last updated ${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
  });

  const rows: GridRow[] = $derived.by(() => {
    const cellData = payload?.cellData ?? {};
    const selectedCell = view && view.kind === 'cell' ? view : null;
    return categories.map((cat) => ({
      cat,
      focused: focusRow === cat.label,
      cells: sectors.map((sector, i) => {
        const all = cellData[keyOf(cat.label, i)] ?? [];
        const visible = all.filter((n) => matching.has(n));
        const offFocus =
          (focusRow !== null && focusRow !== cat.label)
          || (focusCol !== null && focusCol !== i);
        const selected =
          selectedCell !== null
          && selectedCell.cat === cat.label
          && selectedCell.i === i;
        const cls = cellClass({
          hasAny: all.length > 0,
          visibleCount: visible.length,
          offFocus,
          selected,
          aCellIsSelected: selectedCell !== null,
          filtered,
        });
        const orgs = visible.length
          ? cellOrgTypes(visible, alumni, activeOrgSet, orgOrder)
          : [];
        // A11Y (2.1.1 Keyboard, A). An off-focus cell is dimmed to 16% and
        // has pointer-events:none, so a mouse cannot reach it. It must not
        // stay in the tab order either: a focus ring painted at 16% opacity
        // is not a focus indicator, and a control nobody can see is worse
        // than one nobody can reach.
        const interactive = visible.length > 0 && !offFocus;
        const people = (n: number) => `${n} alum${n === 1 ? 'nus' : 'ni'}`;
        return {
          i,
          dots: orgs.map((o) => orgTypes[o]?.color ?? '#888'),
          count: visible.length,
          cls,
          interactive,
          // A11Y (1.4.1 Use of Colour, A). In the matrix the dot colour is
          // the only carrier of the organisation type — the legend is a key,
          // not an equivalent. Naming the types in the cell's accessible
          // name gives the same information without colour. (The palette is
          // Okabe-Ito, so the sighted colour-vision-deficient case is
          // already covered; this is the screen-reader half.)
          ariaLabel: interactive
            ? `${cat.label}, ${sector.label}: ${people(visible.length)} — ${orgs
              .map((o) => orgTypes[o]?.label ?? o)
              .join(', ')}`
            : '',
          note: interactive
            ? ''
            : visible.length > 0
              ? `${cat.label}, ${sector.label}: ${people(visible.length)}, outside the current focus.`
              : all.length > 0
                ? `${cat.label}, ${sector.label}: ${people(all.length)}, none matching the current filters.`
                : '',
        };
      }),
    }));
  });

  const focusLabel = $derived.by(() => {
    if (focusRow) {
      return focusRow;
    }
    if (focusCol !== null) {
      return sectors[focusCol]?.label ?? null;
    }
    return null;
  });

  const rosterNames = $derived(
    payload && view ? scopeNames(view, payload, matching) : [],
  );
  const rosterPeople = $derived(
    rosterNames.map((n) => alumni[n]).filter((a) => Boolean(a)),
  );
  const rosterHeader = $derived(
    payload && view
      ? viewHeader(view, rosterNames.length, filtered, payload, selectedOrgs, total)
      : null,
  );
  const rosterBackLabel = $derived.by(() => {
    if (!view || view.kind !== 'cell') {
      return null;
    }
    if (focusRow === view.cat) {
      return `All of ${view.cat}`;
    }
    if (focusCol === view.i) {
      return `All of ${sectors[view.i]?.label ?? ''}`;
    }
    return null;
  });

  const activeProfile = $derived(profileName ? (alumni[profileName] ?? null) : null);

  // ---- accessibility plumbing ----

  /**
   * The control that opened the detail panel, so focus can go back to it
   * when the panel closes (WCAG 2.4.3 Focus Order, A). Deliberately a plain
   * `let` and not `$state`: nothing renders from it, so making it reactive
   * would only add re-runs.
   */
  let lastTrigger: HTMLElement | null = null;

  /** Stable inside the shadow root — one widget per root, no collisions. */
  const PANEL_TITLE_ID = 'ce-panel-title';

  /**
   * A11Y (WCAG 4.1.3 Status Messages, AA).
   *
   * Everything the supplied page changed below the fold — the roster, the
   * profile, the match count — changed silently. The count pill carried an
   * aria-live, but it announced a bare fragment ("12 of 105 alumni match")
   * out of any sentence and said nothing at all about the panel.
   *
   * One polite region covers all three, because two live regions competing
   * on the same interaction is how announcements get dropped.
   */
  const statusText = $derived.by(() => {
    if (status !== 'ready') {
      return '';
    }
    if (activeProfile) {
      return `Showing the profile of ${activeProfile.name}.`;
    }
    if (view && rosterHeader) {
      const title = rosterHeader.title.map((t) => t.text).join(' ');
      return `${title}. ${rosterHeader.sub}.`;
    }
    return `${countText}.`;
  });

  /**
   * Debounced, because statusText changes on every keystroke in the search
   * box and an unthrottled live region reads each intermediate result. 400ms
   * is the usual landing point: long enough to coalesce typing, short enough
   * that a click feels immediate.
   */
  let announcement = $state('');
  $effect(() => {
    const next = statusText;
    const timer = setTimeout(() => {
      announcement = next;
    }, 400);
    return () => clearTimeout(timer);
  });

  // ---- actions ----
  const ambientView = (): View | null => (filtered ? { kind: 'all' } : null);

  function onFilterChange() {
    if (!profileName) {
      // Keep an explicit cell/row/col view (just refine it); otherwise show
      // all-matching or nothing.
      if (!(view && view.kind !== 'all')) {
        view = ambientView();
      }
    }
  }

  function onSearch(value: string) {
    search = value.trim();
    onFilterChange();
  }

  function onToggleOrg(org: string) {
    // Click to focus a type, click again to remove it; none selected = all.
    selectedOrgs = selectedOrgs.includes(org)
      ? selectedOrgs.filter((o) => o !== org)
      : [...selectedOrgs, org];
    onFilterChange();
  }

  function onReset() {
    selectedOrgs = [];
    search = '';
    focusRow = null;
    focusCol = null;
    view = null;
    profileName = null;
  }

  function toggleRowFocus(label: string, trigger?: HTMLElement) {
    lastTrigger = trigger ?? null;
    if (focusRow === label) {
      focusRow = null;
      view = ambientView();
    }
    else {
      focusRow = label;
      focusCol = null;
      view = { kind: 'row', cat: label };
    }
    profileName = null;
    if (view) {
      scrollSignal += 1;
    }
  }

  function toggleColFocus(i: number, trigger?: HTMLElement) {
    lastTrigger = trigger ?? null;
    if (focusCol === i) {
      focusCol = null;
      view = ambientView();
    }
    else {
      focusCol = i;
      focusRow = null;
      view = { kind: 'col', i };
    }
    profileName = null;
    if (view) {
      scrollSignal += 1;
    }
  }

  function openView(next: View, trigger?: HTMLElement) {
    if (trigger) {
      lastTrigger = trigger;
    }
    view = next;
    profileName = null;
    scrollSignal += 1;
  }

  function openProfile(name: string) {
    profileName = name;
    scrollSignal += 1;
  }

  function clearFocus() {
    focusRow = null;
    focusCol = null;
    view = ambientView();
    profileName = null;
  }

  /** Dismiss the panel and any focus; leave org/search filters alone. */
  function closePanel() {
    view = null;
    profileName = null;
    focusRow = null;
    focusCol = null;
    // A11Y (2.4.3, A). The panel held focus while it was open; dismissing it
    // destroys the focused element, and the browser's fallback is to drop
    // focus to the top of the document — which on a Drupal page means the
    // user restarts from the site header. Hand it back to whatever opened
    // the panel.
    lastTrigger?.focus?.();
    lastTrigger = null;
  }

  function rosterBack() {
    if (!view || view.kind !== 'cell') {
      return;
    }
    openView(focusRow === view.cat ? { kind: 'row', cat: view.cat } : { kind: 'col', i: view.i });
  }

  const avatarColor = (a: Alum) =>
    orgTypes[displayOrg(a, activeOrgSet)]?.color ?? '#888';
</script>

<!--
  SINGLE ROOT ELEMENT — load-bearing, not cosmetic.

  Svelte 5.57's `unmount()` does not remove a component's DOM when the
  template's root is a conditional block: the root effect has no
  materialised node range to detach, and the markup is silently left in the
  host. Verified in isolation against a three-line component. The Drupal
  loader's teardown contract is `() => void` and the host element is reused,
  so leaked markup would survive a re-render. One wrapper element fixes it
  and changes nothing visually — every child rule is max-width + margin auto.
-->
<div class="ce-root">
<!--
  A11Y (WCAG 4.1.3 Status Messages, AA). Visually hidden, present from first
  paint so assistive technology has registered it before the first update —
  a live region injected at the moment of the change is frequently missed.
-->
<div class="ce-vh" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
{#if status === 'loading'}
  <div class="masthead"><h2 class="ce-title">{config.title || DEFAULT_TITLE}</h2></div>
  <div class="state">
    <div class="state-title">Loading alumni…</div>
    <div class="state-body">Fetching the career matrix.</div>
  </div>
{:else if status === 'error'}
  <div class="masthead"><h2 class="ce-title">{config.title || DEFAULT_TITLE}</h2></div>
  <div class="state error" role="alert">
    <div class="state-title">The alumni data could not be loaded.</div>
    <div class="state-body">
      This is a problem with the data service, not with your filters — no
      alumni are being hidden from you. Please try again shortly. ({errorDetail})
    </div>
  </div>
{:else if total === 0}
  <div class="masthead"><h2 class="ce-title">{config.title || DEFAULT_TITLE}</h2></div>
  <div class="state">
    <div class="state-title">No alumni are published yet.</div>
    <div class="state-body">
      The data service answered, but the roster is empty. Check back once the
      dataset has been populated.
    </div>
  </div>
{:else}
  <Masthead
    title={config.title || DEFAULT_TITLE}
    intro={config.intro || DEFAULT_INTRO}
    {countText}
    {pathCount}
    updated={updatedText}
  />

  <Controls
    {search}
    {orgOrder}
    {orgTypes}
    {selectedOrgs}
    activeOrgs={[...activeOrgs]}
    resetDisabled={!anyStateActive}
    {onSearch}
    {onToggleOrg}
    {onReset}
  />

  {#if focusLabel}
    <FocusBar label={focusLabel} onClear={clearFocus} />
  {/if}

  <Matrix
    {sectors}
    {rows}
    {focusCol}
    onToggleRow={toggleRowFocus}
    onToggleCol={toggleColFocus}
    onOpenCell={(cat, i, trigger) => openView({ kind: 'cell', cat, i }, trigger)}
  />

  {#if activeProfile}
    <DetailPanel {scrollSignal} labelledBy={PANEL_TITLE_ID}>
      <Profile
        titleId={PANEL_TITLE_ID}
        alum={activeProfile}
        {orgTypes}
        {sectors}
        avatarColor={avatarColor(activeProfile)}
        backLabel={view ? backLabelFor(view, sectors) : 'Back'}
        onBack={() => {
          if (view) {
            profileName = null;
            scrollSignal += 1;
          }
          else {
            closePanel();
          }
        }}
        onClose={closePanel}
      />
    </DetailPanel>
  {:else if view && rosterHeader}
    <DetailPanel {scrollSignal} labelledBy={PANEL_TITLE_ID}>
      <Roster
        titleId={PANEL_TITLE_ID}
        header={rosterHeader}
        people={rosterPeople}
        {orgTypes}
        {avatarColor}
        backLabel={rosterBackLabel}
        onBack={rosterBack}
        onClose={closePanel}
        onOpenProfile={openProfile}
      />
    </DetailPanel>
  {/if}
{/if}
</div>
