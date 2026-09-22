/**
 * @file
 * Career Explorer: mount contract, data states, behaviour, and the XSS
 * regression guard.
 *
 * The widget takes its endpoint from the editor config and fetches at
 * runtime, so every test here stubs `globalThis.fetch` and points the config
 * at a fake path. Nothing reaches the network and no path is hardcoded in
 * the bundle.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fixture from '../src/widgets/career-explorer/fixtures/alumni-payload.json';
import type { AlumniPayload } from '../src/widgets/career-explorer/types';

const ENDPOINT = '/test/career-explorer/alumni';

type Mount = (
  host: HTMLElement,
  root: ShadowRoot,
  config: Record<string, unknown>,
) => () => void;

let container: HTMLDivElement;
let shadowRoot: ShadowRoot;
let shadowHost: HTMLDivElement;
let teardown: (() => void) | null = null;

/** Mirrors the Drupal loader: a host element inside an open shadow root. */
function setupShadowDom() {
  container = document.createElement('div');
  document.body.appendChild(container);
  shadowRoot = container.attachShadow({ mode: 'open' });
  shadowHost = document.createElement('div');
  shadowRoot.appendChild(shadowHost);
}

function stubFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
    })),
  );
}

function stubFetchReject(message: string) {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error(message); }));
}

async function flush(times = 4) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function mountWidget(config: Record<string, unknown> = { endpoint: ENDPOINT }) {
  setupShadowDom();
  const mod = await import('../src/widgets/career-explorer/index');
  const mount = mod.default as unknown as Mount;
  teardown = mount(shadowHost, shadowRoot, config);
  await flush();
}

const q = <T extends Element = Element>(selector: string) =>
  shadowHost.querySelector<T>(selector);
const qa = <T extends Element = Element>(selector: string) =>
  Array.from(shadowHost.querySelectorAll<T>(selector));

function clickText(selector: string, text: string) {
  const el = qa<HTMLElement>(selector).find((e) => (e.textContent ?? '').includes(text));
  if (!el) {
    throw new Error(`No ${selector} containing "${text}"`);
  }
  el.click();
  return el;
}

/**
 * Click a matrix row or column header.
 *
 * The header cells are <th scope="row|col"> with a real <button> inside;
 * they used to be <th role="button" tabindex="0">. The click goes to the
 * button, the state classes stay on the cell, so this returns the cell.
 */
function clickHeader(selector: string, text: string) {
  const btn = clickText(`${selector} button`, text);
  const cell = btn.closest('th');
  if (!cell) {
    throw new Error(`No header cell around "${text}"`);
  }
  return cell;
}

async function type(value: string) {
  const input = q<HTMLInputElement>('.search input');
  if (!input) {
    throw new Error('No search input');
  }
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
}

beforeEach(() => {
  stubFetch(fixture);
});

afterEach(() => {
  if (teardown) {
    teardown();
    teardown = null;
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
  vi.unstubAllGlobals();
});

describe('mount contract', () => {
  it('default-exports a function', async () => {
    const mod = await import('../src/widgets/career-explorer/index');
    expect(typeof mod.default).toBe('function');
  });

  it('mounts into the shadow host and returns a working teardown', async () => {
    await mountWidget();
    expect(typeof teardown).toBe('function');
    expect(shadowHost.children.length).toBeGreaterThan(0);
    teardown!();
    teardown = null;
    await flush();
    expect(shadowHost.children.length).toBe(0);
  });

  it('takes the endpoint from config rather than a hardcoded path', async () => {
    await mountWidget({ endpoint: '/somewhere/else.json' });
    const call = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
    expect(call[0]).toBe('/somewhere/else.json');
  });
});

describe('data states', () => {
  it('renders an honest error, not an empty matrix, when the fetch fails', async () => {
    stubFetch({ error: 'no' }, { ok: false, status: 503 });
    await mountWidget();
    const state = q('.state.error');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('could not be loaded');
    // The crucial property: it must not look like "nothing matched".
    expect(q('table')).toBeNull();
    expect(shadowHost.textContent).not.toContain('No alumni here match');
  });

  it('reports a transport failure the same way', async () => {
    stubFetchReject('network down');
    await mountWidget();
    expect(q('.state.error')).not.toBeNull();
  });

  it('says so when no endpoint is configured', async () => {
    await mountWidget({});
    expect(q('.state.error')!.textContent).toContain('No data endpoint is configured');
  });

  it('distinguishes an empty roster from a failure', async () => {
    stubFetch({ ...fixture, alumni: {}, cellData: {} });
    await mountWidget();
    expect(q('.state')).not.toBeNull();
    expect(q('.state.error')).toBeNull();
    expect(shadowHost.textContent).toContain('No alumni are published yet');
  });
});

describe('matrix render', () => {
  it('renders every category row and every sector column', async () => {
    await mountWidget();
    const payload = fixture as unknown as AlumniPayload;
    expect(qa('tbody tr').length).toBe(payload.categories.length);
    expect(qa('thead tr:nth-child(2) th').length).toBe(payload.sectors.length + 1);
  });

  it('reports the live alumni count', async () => {
    await mountWidget();
    expect(q('.count-pill')!.textContent).toBe('105 alumni');
  });

  it('renders the unpopulated "Transportation" row without collapsing or erroring', async () => {
    await mountWidget();
    const payload = fixture as unknown as AlumniPayload;
    // Guard the premise: nothing references this category.
    const referenced = Object.keys(payload.cellData).some((k) =>
      k.startsWith('Transportation__'));
    expect(referenced).toBe(false);

    const row = qa('tbody tr').find((tr) =>
      tr.querySelector('.row-label')?.textContent?.startsWith('Transportation'));
    expect(row).toBeDefined();
    const cells = Array.from(row!.querySelectorAll('td.cell'));
    expect(cells.length).toBe(payload.sectors.length);
    expect(cells.every((c) => c.classList.contains('empty'))).toBe(true);
    expect(row!.querySelectorAll('.dot').length).toBe(0);
  });
});

describe('filtering', () => {
  it('filters by name', async () => {
    await mountWidget();
    await type('Becca Miller Rose');
    expect(q('.count-pill')!.textContent).toBe('1 of 105 alumni match');
  });

  it('filters by organisation', async () => {
    await mountWidget();
    await type('Welbehealth');
    expect(q('.count-pill')!.textContent).toContain('of 105 alumni match');
    expect(shadowHost.textContent).toContain('Becca Miller Rose');
  });

  it('filters by role', async () => {
    await mountWidget();
    await type('Chief Operating Officer');
    const text = q('.count-pill')!.textContent ?? '';
    expect(text).toMatch(/^\d+ of 105 alumni match$/);
    expect(Number(text.split(' ')[0])).toBeGreaterThan(0);
  });

  it('filters by degree', async () => {
    await mountWidget();
    await type('MBA');
    const n = Number((q('.count-pill')!.textContent ?? '').split(' ')[0]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(105);
  });

  it('filters by organisation-type toggle', async () => {
    await mountWidget();
    const before = q('.count-pill')!.textContent;
    clickText('.orgtoggle', 'Government agency');
    await flush();
    expect(q('.count-pill')!.textContent).not.toBe(before);
    const pressed = qa('.orgtoggle').filter(
      (b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.length).toBe(1);
  });
});

describe('focus', () => {
  it('dims off-lane cells on row focus and releases on a second click', async () => {
    await mountWidget();
    const label = clickHeader('.row-label', 'Health');
    await flush();
    expect(label.classList.contains('rowfocus')).toBe(true);
    expect(qa('td.cell.dim').length).toBeGreaterThan(0);
    expect(q('.focusbar')).not.toBeNull();

    clickHeader('.row-label', 'Health');
    await flush();
    expect(qa('td.cell.dim').length).toBe(0);
    expect(q('.focusbar')).toBeNull();
  });

  it('dims off-lane cells on column focus and releases on a second click', async () => {
    await mountWidget();
    const th = clickHeader('thead tr:nth-child(2) th', 'Finance & Investment');
    await flush();
    expect(th.classList.contains('colfocus')).toBe(true);
    expect(qa('td.cell.dim').length).toBeGreaterThan(0);

    clickHeader('thead tr:nth-child(2) th', 'Finance & Investment');
    await flush();
    expect(qa('td.cell.dim').length).toBe(0);
  });
});

describe('reset', () => {
  it('starts disabled, enables on any state, and restores the initial view', async () => {
    await mountWidget();
    const reset = q<HTMLButtonElement>('.reset-btn')!;
    expect(reset.disabled).toBe(true);

    await type('MBA');
    clickHeader('.row-label', 'Health');
    await flush();
    expect(q<HTMLButtonElement>('.reset-btn')!.disabled).toBe(false);

    q<HTMLButtonElement>('.reset-btn')!.click();
    await flush();
    expect(q<HTMLButtonElement>('.reset-btn')!.disabled).toBe(true);
    expect(q<HTMLInputElement>('.search input')!.value).toBe('');
    expect(q('.count-pill')!.textContent).toBe('105 alumni');
    expect(q('.focusbar')).toBeNull();
    expect(q('.panel')).toBeNull();
    expect(qa('td.cell.dim').length).toBe(0);
  });
});

describe('roster and profile', () => {
  it('opens a cell roster and then an alumni profile', async () => {
    await mountWidget();
    const cell = qa<HTMLElement>('td.cell.filled button')[0];
    cell.click();
    await flush();
    expect(q('.panel')).not.toBeNull();
    const row = qa<HTMLElement>('.alum-row')[0];
    expect(row).toBeDefined();
    row.click();
    await flush();
    expect(q('.profile')).not.toBeNull();
    expect(q('.profile-name')!.textContent).toBeTruthy();
  });
});

/**
 * THE GUARD. This is the test that must fail the moment anyone reintroduces
 * `{@html}` into this widget.
 *
 * The source page built its roster and profile markup by concatenating
 * record fields into innerHTML. Harmless for a hand-checked static file;
 * a stored-XSS path onto a public Yale page the moment the data comes from
 * an Airtable base a non-developer edits daily.
 */
describe('XSS regression', () => {
  const NAME = '<script>alert("name")</script>Mallory Hostile';
  const DESC = '<img src=x onerror=alert(1)> hostile bio';

  const poisoned = () => {
    const payload = JSON.parse(JSON.stringify(fixture)) as AlumniPayload;
    payload.alumni[NAME] = {
      name: NAME,
      role: '<b>Director</b> of Injection',
      org: '<iframe src=evil></iframe> Bad Corp',
      degree: 'MBA',
      year: "'13",
      desc: DESC,
      linkedin: 'javascript:alert(1)',
      cats: ['Health'],
      funcs: [3],
      orgType: 'corporation',
      orgs: ['corporation'],
    };
    payload.cellData['Health__3'] = [...(payload.cellData['Health__3'] ?? []), NAME];
    return payload;
  };

  it('renders hostile name and bio as literal text, with no injected elements', async () => {
    stubFetch(poisoned());
    await mountWidget();

    // Reach the profile: search narrows to the one hostile record.
    await type('Mallory Hostile');
    const row = qa<HTMLElement>('.alum-row')[0];
    expect(row).toBeDefined();
    row.click();
    await flush();

    // 1. The payload's markup is visible as text, not parsed as markup.
    expect(q('.profile-name')!.textContent).toBe(NAME);
    expect(q('.profile-desc')!.textContent).toBe(DESC);

    // 2. Nothing from the payload became an element.
    expect(shadowHost.querySelector('script')).toBeNull();
    expect(shadowHost.querySelector('img')).toBeNull();
    expect(shadowHost.querySelector('iframe')).toBeNull();
    expect(shadowHost.querySelector('b')).toBeNull();

    // 3. Belt and braces: the raw markup must not exist in the serialised
    //    DOM as markup — only as escaped entities.
    expect(shadowHost.innerHTML).not.toContain('<script>');
    expect(shadowHost.innerHTML).not.toContain('<img src=x');
    expect(shadowHost.innerHTML).toContain('&lt;script&gt;');
  });

  it('refuses a javascript: URL in the LinkedIn field', async () => {
    stubFetch(poisoned());
    await mountWidget();
    await type('Mallory Hostile');
    qa<HTMLElement>('.alum-row')[0].click();
    await flush();
    expect(shadowHost.querySelector('a.li-btn')).toBeNull();
    expect(q('.li-btn.disabled')).not.toBeNull();
  });

  it('renders a hostile name as text in the roster list too', async () => {
    stubFetch(poisoned());
    await mountWidget();
    await type('Mallory Hostile');
    expect(q('.alum-name')!.textContent).toBe(NAME);
    expect(shadowHost.querySelector('script')).toBeNull();
  });
});

/**
 * A source-level guard alongside the behavioural one above. The render test
 * catches `{@html}` on the fields it exercises; this catches it anywhere in
 * the widget, including on a field no test happens to poison.
 */
describe('source guarantees', () => {
  const sources = import.meta.glob('../src/widgets/career-explorer/**/*.{svelte,ts}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  /**
   * Strip comments before scanning. The prose in this widget discusses the
   * very patterns being banned — a naive grep would flag the warnings
   * telling the next developer not to do it.
   */
  const code = (src: string) =>
    src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('finds the widget source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5);
  });

  it('contains no {@html} anywhere', () => {
    const offenders = Object.entries(sources)
      .filter(([, src]) => /\{\s*@html/.test(code(src)))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('makes no document-level DOM queries', () => {
    const banned = /document\.(getElementById|querySelector|querySelectorAll|getElementsBy)/;
    const offenders = Object.entries(sources)
      .filter(([, src]) => banned.test(code(src)))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('references no third-party CDN', () => {
    const offenders = Object.entries(sources)
      .filter(([, src]) => /cdn\.jsdelivr\.net|unpkg\.com|cdnjs\./.test(code(src)))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

/**
 * Accessibility behaviour (WCAG 2.2 AA).
 *
 * These guard the things that are invisible on screen and therefore the
 * things a future change will silently break: table header semantics, the
 * status region, and where the keyboard goes when the panel opens and
 * closes. Contrast and target size are not testable here — happy-dom has no
 * layout engine and no style resolution — and are asserted in the
 * stylesheet's own comments with the measured ratios.
 */
describe('accessibility', () => {
  describe('matrix semantics (1.3.1 A, 4.1.2 A)', () => {
    it('keeps real table header semantics instead of role="button"', async () => {
      await mountWidget();
      // The whole point: not one cell may claim to be a button.
      expect(qa('table [role="button"]').length).toBe(0);
      expect(qa('table th[role]').length).toBe(0);
      expect(qa('table td[role]').length).toBe(0);
    });

    it('marks the impact themes as row headers and the job functions as column headers', async () => {
      await mountWidget();
      const payload = fixture as unknown as AlumniPayload;
      expect(qa('tbody th.row-label[scope="row"]').length).toBe(payload.categories.length);
      expect(qa('thead th[scope="col"]').length).toBe(payload.sectors.length);
    });

    it('gives the table a caption naming both axes', async () => {
      await mountWidget();
      const caption = q('table > caption');
      expect(caption).not.toBeNull();
      expect(caption!.textContent).toContain('impact themes');
      expect(caption!.textContent).toContain('job functions');
    });

    it('activates headers and cells through real buttons, so Enter and Space are native', async () => {
      await mountWidget();
      expect(q('thead th[scope="col"] > button[type="button"]')).not.toBeNull();
      expect(q('th.row-label > button[type="button"]')).not.toBeNull();
      expect(q('td.cell.filled > button[type="button"]')).not.toBeNull();
      // No hand-rolled key handling left to drift out of step with the click
      // handler, and no tabindex to manage.
      expect(qa('table [tabindex]').length).toBe(0);
    });

    it('exposes the toggle state of a focused row or column header', async () => {
      await mountWidget();
      const cell = clickHeader('.row-label', 'Health');
      await flush();
      expect(cell.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
      clickHeader('.row-label', 'Health');
      await flush();
      expect(cell.querySelector('button')!.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('information not carried by colour alone (1.4.1 A)', () => {
    it('names the organisation types in a cell rather than only colouring dots', async () => {
      await mountWidget();
      const label = q('td.cell.filled > button')!.getAttribute('aria-label') ?? '';
      // "<theme>, <function>: N alumni — <Org type>, <Org type>"
      expect(label).toMatch(/: \d+ alumn?(i|us) — .+/);
      const payload = fixture as unknown as AlumniPayload;
      const anyOrgLabel = Object.values(payload.orgTypes).some((t) =>
        label.includes(t.label));
      expect(anyOrgLabel).toBe(true);
    });

    it('says so when a populated cell is dimmed out by the filters, instead of reading as empty', async () => {
      await mountWidget();
      await type('Becca Miller Rose');
      const notes = qa('td.cell.nomatch .ce-vh')
        .map((n) => n.textContent ?? '');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0]).toMatch(/none matching the current filters/);
    });
  });

  describe('keyboard reach (2.1.1 A, 2.4.11 AA)', () => {
    it('takes off-focus cells out of the tab order, matching their pointer-events:none', async () => {
      await mountWidget();
      clickHeader('.row-label', 'Health');
      await flush();
      const dimmed = qa('td.cell.dim');
      expect(dimmed.length).toBeGreaterThan(0);
      // A control dimmed to 16% opacity cannot show a focus indicator, so it
      // must not be focusable either.
      expect(dimmed.some((c) => c.querySelector('button'))).toBe(false);
    });
  });

  describe('status messages (4.1.3 AA)', () => {
    it('has a polite status region present from first paint', async () => {
      await mountWidget();
      const live = q('[role="status"]');
      expect(live).not.toBeNull();
      expect(live!.getAttribute('aria-live')).toBe('polite');
      expect(live!.classList.contains('ce-vh')).toBe(true);
    });

    it('announces the match count when a filter changes', async () => {
      await mountWidget();
      await type('Becca Miller Rose');
      // The region is debounced so typing does not read every keystroke.
      await new Promise((r) => setTimeout(r, 600));
      expect(q('[role="status"]')!.textContent).toContain('1 of 105 alumni match');
    });

    it('announces the roster and then the profile when the panel changes', async () => {
      await mountWidget();
      qa<HTMLElement>('td.cell.filled > button')[0].click();
      await flush();
      await new Promise((r) => setTimeout(r, 600));
      const rosterText = q('[role="status"]')!.textContent ?? '';
      expect(rosterText).toMatch(/alumn(i|us) in this path/);

      qa<HTMLElement>('.alum-row')[0].click();
      await flush();
      await new Promise((r) => setTimeout(r, 600));
      expect(q('[role="status"]')!.textContent).toContain('Showing the profile of');
    });
  });

  describe('focus management (2.4.3 A)', () => {
    it('moves focus into the detail panel when a cell is opened', async () => {
      await mountWidget();
      qa<HTMLElement>('td.cell.filled > button')[0].click();
      await flush();
      const panel = q('.panel')!;
      expect(panel.getAttribute('tabindex')).toBe('-1');
      expect(panel.getAttribute('role')).toBe('region');
      // The region names itself from its own heading, so the announcement
      // says which roster opened.
      const labelledBy = panel.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(q(`#${labelledBy}`)).not.toBeNull();
      expect(shadowRoot.activeElement).toBe(panel);
    });

    it('returns focus to the control that opened the panel when it closes', async () => {
      await mountWidget();
      const trigger = qa<HTMLElement>('td.cell.filled > button')[0];
      trigger.click();
      await flush();
      expect(shadowRoot.activeElement).not.toBe(trigger);

      clickText('.close-btn', 'Close');
      await flush();
      expect(shadowRoot.activeElement).toBe(trigger);
    });

    it('gives the panel a heading, so it is reachable by heading navigation', async () => {
      await mountWidget();
      qa<HTMLElement>('td.cell.filled > button')[0].click();
      await flush();
      expect(q('.panel h3.panel-title')).not.toBeNull();
      qa<HTMLElement>('.alum-row')[0].click();
      await flush();
      expect(q('.panel h3.profile-name')).not.toBeNull();
    });
  });

  describe('document outline (1.3.1 A)', () => {
    it('does not put a second h1 on the host page', async () => {
      await mountWidget();
      expect(qa('h1').length).toBe(0);
      expect(q('h2.ce-title')).not.toBeNull();
    });

    it('keeps the heading in the loading and error states too', async () => {
      stubFetchReject('down');
      await mountWidget();
      expect(qa('h1').length).toBe(0);
      expect(q('h2.ce-title')).not.toBeNull();
    });
  });
});
