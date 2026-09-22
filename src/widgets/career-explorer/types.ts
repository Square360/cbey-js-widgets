/**
 * @file
 * The payload contract between cbey_airtable's JSON route and this widget.
 *
 * Mirrors \Drupal\cbey_airtable\Service\AlumniNormalizer::normalize(). The
 * Drupal side is the source of truth for the shape; nothing here may drift
 * from it without the endpoint changing first.
 */

export interface Sector {
  label: string;
  sub: string;
}

export interface Category {
  label: string;
  sub: string;
  future?: boolean;
}

export interface OrgType {
  label: string;
  color: string;
}

export interface Alum {
  name: string;
  role: string;
  org: string;
  degree: string;
  year: string;
  desc: string;
  linkedin: string;
  cats: string[];
  /**
   * Positional indices into AlumniPayload.sectors.
   *
   * The indices are meaningful ONLY against the `sectors` array delivered in
   * the same payload — the widget never carries its own copy of the job
   * functions. That is the whole mitigation for the positional-coupling
   * fragility: the mapping is owned by the Drupal normaliser and travels
   * with the data, so a reorder upstream can never desynchronise from a
   * stale list baked into this bundle.
   */
  funcs: number[];
  orgType: string;
  orgs: string[];
}

export interface AlumniPayload {
  alumni: Record<string, Alum>;
  cellData: Record<string, string[]>;
  sectors: Sector[];
  categories: Category[];
  orgTypes: Record<string, OrgType>;
  orgOrder: string[];
  /** Unix timestamp of the last successful Airtable sync. */
  generated?: number;
  recordCount?: number;
}

/** The roster scope the detail panel is currently showing. */
export type View =
  | { kind: 'cell'; cat: string; i: number }
  | { kind: 'row'; cat: string }
  | { kind: 'col'; i: number }
  | { kind: 'all' };

/** Editor-supplied config — see src/schemas/career-explorer.json. */
export interface CareerExplorerConfig {
  endpoint?: string;
  title?: string;
  intro?: string;
  lastUpdated?: string;
}

/** One run of text in a panel title. Structured so no HTML is concatenated. */
export interface TitlePart {
  text: string;
  muted?: boolean;
}

export interface PanelHeader {
  eyebrow: string;
  title: TitlePart[];
  sub: string;
}

/** One matrix cell, fully resolved for render. */
export interface GridCell {
  i: number;
  /** Dot colours, one per active org type present in the cell. */
  dots: string[];
  count: number;
  cls: string;
  interactive: boolean;
  /** Accessible name of the cell's button. Empty when not interactive. */
  ariaLabel: string;
  /**
   * Assistive-technology-only note for a NON-interactive cell that is not
   * genuinely empty — "3 alumni, none matching the current filters", or the
   * same outside a row/column focus. Without it those cells read as empty,
   * which is the one thing they are not (WCAG 1.4.1, A).
   */
  note: string;
}

/** One matrix row. */
export interface GridRow {
  cat: Category;
  focused: boolean;
  cells: GridCell[];
}
