/**
 * @file
 * The pure half of the port — the source page's filtering, scoping and
 * labelling functions with every DOM call taken out of them.
 *
 * In the static source these functions read `document.getElementById(...)`
 * and wrote `innerHTML`. Here they take their inputs as arguments and return
 * plain data; the components turn that data into DOM through Svelte's
 * escaping `{expression}` interpolation. Nothing in this file produces
 * markup, which is deliberate: a function returning an HTML string is how
 * the original acquired its XSS surface.
 */
import type {
  Alum,
  AlumniPayload,
  PanelHeader,
  Sector,
  View,
} from './types';

/** Matrix cell key. Mirrors the Drupal normaliser's derived cellData keys. */
export const keyOf = (cat: string, i: number): string => `${cat}__${i}`;

/**
 * An alum matches when ANY of their org types is active and, if a search
 * term is present, the haystack contains it.
 */
export function alumMatches(
  a: Alum,
  activeOrgs: ReadonlySet<string>,
  search: string,
): boolean {
  if (!a.orgs.some((o) => activeOrgs.has(o))) {
    return false;
  }
  if (search) {
    const q = search.toLowerCase();
    const hay = `${a.name} ${a.role} ${a.org} ${a.degree} ${a.desc}`.toLowerCase();
    if (!hay.includes(q)) {
      return false;
    }
  }
  return true;
}

/**
 * The org types to colour a cell's dots by.
 *
 * Only currently-active types surface, so a toggled-off colour never renders.
 */
export function cellOrgTypes(
  names: readonly string[],
  alumni: Record<string, Alum>,
  activeOrgs: ReadonlySet<string>,
  orgOrder: readonly string[],
): string[] {
  const present = new Set<string>();
  for (const n of names) {
    const a = alumni[n];
    if (!a) {
      continue;
    }
    for (const o of a.orgs) {
      if (activeOrgs.has(o)) {
        present.add(o);
      }
    }
  }
  return orgOrder.filter((o) => present.has(o));
}

/** The org type an alum's avatar is coloured by, respecting the filter. */
export function displayOrg(a: Alum, activeOrgs: ReadonlySet<string>): string {
  const active = a.orgs.filter((o) => activeOrgs.has(o));
  return active.length ? active[0] : a.orgType;
}

/**
 * The alumni a view resolves to: deduped, filtered, sorted.
 *
 * `matching` is the pre-computed set of names passing the current filters.
 */
export function scopeNames(
  view: View | null,
  payload: AlumniPayload,
  matching: ReadonlySet<string>,
): string[] {
  if (!view) {
    return [];
  }
  let names: string[] = [];
  if (view.kind === 'cell') {
    names = (payload.cellData[keyOf(view.cat, view.i)] ?? []).slice();
  }
  else if (view.kind === 'row') {
    const s = new Set<string>();
    payload.sectors.forEach((_, i) => {
      for (const n of payload.cellData[keyOf(view.cat, i)] ?? []) {
        s.add(n);
      }
    });
    names = [...s];
  }
  else if (view.kind === 'col') {
    const s = new Set<string>();
    for (const c of payload.categories) {
      for (const n of payload.cellData[keyOf(c.label, view.i)] ?? []) {
        s.add(n);
      }
    }
    names = [...s];
  }
  else {
    names = Object.keys(payload.alumni);
  }
  return names.filter((n) => matching.has(n)).sort((a, b) => a.localeCompare(b));
}

/**
 * Header copy for the detail panel.
 *
 * The title comes back as a list of runs rather than a string: the source
 * concatenated a styled `<span>` into an innerHTML title, and that is the
 * one place in the port where the markup was structural rather than
 * decorative. Runs keep the structure without an HTML string.
 */
export function viewHeader(
  view: View,
  count: number,
  filtered: boolean,
  payload: AlumniPayload,
  selectedOrgs: readonly string[],
  total: number,
): PanelHeader {
  const alum = (n: number) => `Yale alum${n === 1 ? 'nus' : 'ni'}`;
  const sectors: Sector[] = payload.sectors;

  if (view.kind === 'cell') {
    return {
      eyebrow: 'Impact theme × Career function',
      title: [
        { text: view.cat },
        { text: '×', muted: true },
        { text: sectors[view.i]?.label ?? '' },
      ],
      sub: `${count} ${alum(count)} in this path${filtered ? ' · matching your filters' : ''}`,
    };
  }
  if (view.kind === 'row') {
    return {
      eyebrow: `All job functions × ${view.cat}`,
      title: [{ text: `Alumni in ${view.cat}` }],
      sub: `${count} ${alum(count)}${filtered ? ' · matching your filters' : ''}`,
    };
  }
  if (view.kind === 'col') {
    const label = sectors[view.i]?.label ?? '';
    return {
      eyebrow: `All impact themes × ${label}`,
      title: [{ text: `Alumni in ${label}` }],
      sub: `${count} ${alum(count)}${filtered ? ' · matching your filters' : ''}`,
    };
  }

  // kind:'all' — ambient filter (organisation type and/or search).
  const orgLabels = payload.orgOrder
    .filter((o) => selectedOrgs.includes(o))
    .map((o) => payload.orgTypes[o]?.label ?? o);
  if (orgLabels.length) {
    return {
      eyebrow: 'Organization type',
      title: [{ text: `Alumni in ${orgLabels.join(', ')}` }],
      sub: `${count} of ${total} alumni match your filters`,
    };
  }
  return {
    eyebrow: 'Filtered view',
    title: [{ text: 'Matching alumni' }],
    sub: `${count} of ${total} alumni match your filters`,
  };
}

/** The "back to the wider lane" label shown above a profile. */
export function backLabelFor(view: View, sectors: readonly Sector[]): string {
  if (view.kind === 'cell' || view.kind === 'row') {
    return `Back to ${view.cat}`;
  }
  if (view.kind === 'col') {
    return `Back to ${sectors[view.i]?.label ?? 'results'}`;
  }
  return 'Back to results';
}

/** The class list for one matrix cell. Ported from the source's render(). */
export function cellClass(options: {
  hasAny: boolean;
  visibleCount: number;
  offFocus: boolean;
  selected: boolean;
  aCellIsSelected: boolean;
  filtered: boolean;
}): string {
  const { hasAny, visibleCount, offFocus, selected, aCellIsSelected, filtered } = options;
  let cls = `cell ${hasAny ? (visibleCount > 0 ? 'filled' : 'empty') : 'empty'}`;
  if (offFocus) {
    // Focus spotlight: off-lane cells fully dimmed and unclickable.
    cls += ' dim';
  }
  else if (aCellIsSelected) {
    // A cell is selected: highlight it, grey the rest (still clickable).
    cls += selected ? ' sel' : ' faded';
  }
  else if (filtered) {
    if (visibleCount > 0) {
      cls += ' hit';
    }
    else if (hasAny) {
      cls += ' nomatch';
    }
  }
  return cls;
}
