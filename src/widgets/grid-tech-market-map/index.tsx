/**
 * @file
 * Mount entrypoint for the grid-tech-market-map widget.
 *
 * Default export: `(shadowHost, shadowRoot, config) => () => void`.
 *
 * The shadowHost is a fresh <div> inside the shadow root; the React tree
 * mounts there. The teardown unmounts the React root cleanly so the
 * loader can release the WeakMap entry on AJAX detach.
 *
 * Config shape (also documented in ../../schemas/grid-tech-market-map.json):
 *   - defaultCategory: id of the category to render first; falls back to
 *     the first entry in gridTechData.
 *   - lockCategory: when true, hide the selector and render a fixed view.
 *
 * Accessibility:
 *   - Selector is a native <select> with a <label> and id binding.
 *   - The scatter chart carries role="img" with an aria-label summarising
 *     the view (set by MarketMap.tsx).
 *   - A visually-hidden <table> renders the same data values, with a
 *     <caption>, so screen-reader users have a plain-text fallback for
 *     the SVG dots.
 *   - prefers-reduced-motion: the chart has no animation today, so no
 *     conditional logic is required; the helper is reserved here for any
 *     future widget revision that adds transitions.
 */
import { useId, useMemo, useState } from 'react';
import { gridTechData, Y_AXIS_OVERRIDES } from './data/gridTechData';
import MarketMap from './MarketMap';
import './styles.css';

export interface GridTechMarketMapConfig {
  defaultCategory?: string;
  lockCategory?: boolean;
}

interface WidgetProps {
  config: GridTechMarketMapConfig;
}

const resolveStartingCategoryId = (
  config: GridTechMarketMapConfig,
): string => {
  if (config.defaultCategory) {
    const found = gridTechData.find((cat) => cat.id === config.defaultCategory);
    if (found) {
      return found.id;
    }
  }
  return gridTechData[0]?.id ?? '';
};

const GridTechMarketMapWidget = ({ config }: WidgetProps) => {
  const selectorId = useId();
  const captionId = useId();
  const [categoryId, setCategoryId] = useState<string>(() =>
    resolveStartingCategoryId(config),
  );

  const category = useMemo(
    () => gridTechData.find((cat) => cat.id === categoryId) ?? gridTechData[0],
    [categoryId],
  );

  if (!category) {
    return (
      <div className="cbey-p-4 cbey-text-sm cbey-text-muted-foreground">
        No grid-tech data available.
      </div>
    );
  }

  const lockCategory = config.lockCategory === true;

  return (
    <div className="cbey-grid-tech-market-map cbey-p-4 cbey-md:p-6">
      {/*
        The previous <h1>Grid Tech Map</h1> heading has been removed:
        the wrapping <figure>'s <figcaption> (or aria-label fallback)
        already names the widget at the paragraph level, and a second
        page <h1> would break document outline (Aria audit Finding 3,
        WCAG 2.4.6). The category-name heading below is now <h3> —
        one level below the host page's section <h2> when this widget
        is embedded as a paragraph.
      */}

      {!lockCategory && gridTechData.length > 1 ? (
        <div className="cbey-flex cbey-items-center cbey-gap-3 cbey-mb-4 cbey-flex-wrap">
          <label
            htmlFor={selectorId}
            className="cbey-text-sm cbey-font-medium cbey-text-foreground"
          >
            Select domain:
          </label>
          <select
            id={selectorId}
            value={category.id}
            onChange={(event) => setCategoryId(event.target.value)}
            className="cbey-bg-card cbey-text-foreground cbey-border cbey-border-border cbey-rounded-md cbey-px-3 cbey-py-2 cbey-text-sm cbey-min-w-[20rem] focus:cbey-outline-none focus-visible:cbey-ring-2 focus-visible:cbey-ring-ring"
          >
            {gridTechData.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="cbey-bg-card cbey-border cbey-border-border cbey-rounded-lg cbey-shadow-sm cbey-p-4">
        <div
          className="cbey-h-[650px] cbey-w-full"
          aria-describedby={captionId}
        >
          <MarketMap
            data={category.subCategories}
            categoryName={category.name}
            yAxisMax={Y_AXIS_OVERRIDES[category.id]}
          />
        </div>

        {/*
          Screen-reader fallback — visually-hidden but in the
          accessibility tree. Read by NVDA/VoiceOver/JAWS users
          when they navigate the figure's aria-describedby pointer.
          The chart container above is aria-describedby this
          <caption>'s id.
        */}
        <table className="cbey-sr-only">
          <caption id={captionId}>
            {`${category.name}: subcategories with ARL, market size in 2025, market size in 2030, and CAGR.`}
          </caption>
          <thead>
            <tr>
              <th scope="col">Technology</th>
              <th scope="col">ARL</th>
              <th scope="col">Market Size 2025 ($B)</th>
              <th scope="col">Market Size 2030 ($B)</th>
              <th scope="col">CAGR (%)</th>
            </tr>
          </thead>
          <tbody>
            {category.subCategories.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.arl}</td>
                <td>{row.marketSize2025}</td>
                <td>{row.marketSize2030}</td>
                <td>{row.cagr}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/*
          Sighted-keyboard fallback for the Recharts tooltip data —
          Aria audit P2-8 promoted into this PR. Recharts markers
          aren't focusable and tooltips fire only on mouse hover, so
          a sighted user navigating with the keyboard alone has no
          path to the per-point values (ARL, market sizes, CAGR%).
          A native <details> element is keyboard-reachable (Tab →
          Space/Enter to expand), starts closed, and stays out of the
          way of mouse users. Renders the same data as the
          visually-hidden table above; both stay in place.
        */}
        <details className="cbey-grid-tech-market-map__data-details">
          <summary className="cbey-grid-tech-market-map__data-summary">
            View chart data as a table
          </summary>
          <table className="cbey-grid-tech-market-map__data-table">
            <caption>
              {`${category.name}: subcategories with ARL, market size in 2025, market size in 2030, and CAGR.`}
            </caption>
            <thead>
              <tr>
                <th scope="col">Technology</th>
                <th scope="col">ARL</th>
                <th scope="col">Market Size 2025 ($B)</th>
                <th scope="col">Market Size 2030 ($B)</th>
                <th scope="col">CAGR (%)</th>
              </tr>
            </thead>
            <tbody>
              {category.subCategories.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{row.arl}</td>
                  <td>{row.marketSize2025}</td>
                  <td>{row.marketSize2030}</td>
                  <td>{row.cagr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
};

/**
 * Mount the widget into the loader-supplied shadow-root host element.
 *
 * @param shadowHost - the div the React tree renders into.
 * @param shadowRoot - the shadow root (provided for parity with the loader
 *   contract; unused here because all rendering happens inside shadowHost).
 * @param config - JSON config blob, schema-validated upstream.
 * @returns teardown that unmounts the React root.
 */
const mount = (
  shadowHost: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _shadowRoot: ShadowRoot,
  config: GridTechMarketMapConfig,
): (() => void) => {
  // React + createRoot come from the shared runtime exposed on
  // window.CbeyReact. Vite externalises the import; this line resolves to
  // window.CbeyReact.createRoot at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createRoot = (window as any).CbeyReact?.createRoot;
  if (typeof createRoot !== 'function') {
    // Defence-in-depth: the loader's runtime gate should catch this first.
    // eslint-disable-next-line no-console
    console.warn(
      '[grid-tech-market-map] window.CbeyReact.createRoot missing; cannot mount.',
    );
    return () => {};
  }
  const root = createRoot(shadowHost);
  root.render(<GridTechMarketMapWidget config={config} />);
  return () => {
    root.unmount();
  };
};

export default mount;
