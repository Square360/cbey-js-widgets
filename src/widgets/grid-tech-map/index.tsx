/**
 * @file
 * Mount entrypoint for the grid-tech-map widget (v2; replaces
 * grid-tech-market-map v0.1.x).
 *
 * Default export: `(shadowHost, shadowRoot, config) => () => void`.
 *
 * The shadowHost is a fresh <div> inside the shadow root; the React tree
 * mounts there. The teardown unmounts the React root cleanly so the
 * loader can release the WeakMap entry on AJAX detach.
 *
 * v2 changes vs. grid-tech-market-map:
 *   - Config surface is wider: editors can override the dataset
 *     (`categories`), tweak label placement (`labelPositions`), and
 *     override the CAGR bucket colours (`colors`). Defaults match the
 *     bundled dataset.
 *   - Replaces `defaultCategory` (string) with `initialCategoryId` to
 *     match the wider-config shape. `hideCategorySelector` replaces
 *     `lockCategory`.
 *   - The default CAGR palette is the Aria-audited AA palette
 *     (`#3B82F6` / `#B45309` / `#15803D`) — NOT the raw Lovable export's
 *     `#F59E0B` / `#22C55E`, which fail WCAG 1.4.11 against the white
 *     card. If an editor supplies a `colors` override they own the
 *     contrast budget; the catalog default ships AA.
 *
 * Accessibility:
 *   - Selector is a native <select> with a <label> and id binding via
 *     useId.
 *   - The scatter chart is wrapped in a container with role="img" and
 *     an aria-label naming the current category.
 *   - A visually-hidden <table> renders the same data values, with a
 *     <caption>, so screen-reader users have a plain-text fallback for
 *     the SVG dots. The chart container is aria-describedby this
 *     caption.
 *   - A visible <details> element below the chart, labelled "View
 *     chart data as a table", lets a sighted keyboard-only user expand
 *     the same data on demand (Aria audit P2-8 carryover).
 *   - prefers-reduced-motion: no animations today, but styles.css
 *     carries the guard for any future addition.
 */
import { useId, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
  Label,
} from 'recharts';
import {
  defaultCategories,
  labelPositions as defaultLabelPositions,
  type Category,
  type SubCategory,
} from './data';
import './styles.css';

export interface GridTechMapConfig {
  /** Override the built-in dataset. */
  categories?: Category[];
  /** Initial selected category id. Falls back to the first available. */
  initialCategoryId?: string;
  /** Hide the category dropdown. Useful for single-category embeds. */
  hideCategorySelector?: boolean;
  /** Optional custom label-position map keyed by tech name. */
  labelPositions?: Record<string, 'left' | 'right' | 'top' | 'bottom' | 'top-right'>;
  /** CAGR bucket colors (hex). Editor override of the AA-audited defaults. */
  colors?: { low?: string; medium?: string; high?: string };
}

interface WidgetProps {
  config: GridTechMapConfig;
}

type CAGRBucket = 'low' | 'medium' | 'high';

const cssVars: React.CSSProperties = {
  ['--gtm-fg' as any]: '#26323d',
  ['--gtm-muted' as any]: '#64748b',
  ['--gtm-border' as any]: '#dbe2ea',
  ['--gtm-card' as any]: '#ffffff',
  ['--gtm-bg' as any]: '#f7f9fb',
};

/**
 * Default CAGR-bucket palette.
 *
 * Tuned to meet WCAG 1.4.11 (non-text contrast, 3:1 minimum) against the
 * `--gtm-card` white background. Shape redundancy (square / circle /
 * triangle) handles 1.4.1; these colours are paired with each shape, not
 * relied on alone. Measured ratios against #FFFFFF:
 *   - low (#3B82F6, blue):     3.68:1  passes 1.4.11
 *   - medium (#B45309, amber): 4.66:1  passes 1.4.11 and 1.4.3
 *   - high (#15803D, green):   4.54:1  passes 1.4.11 and 1.4.3
 * The raw Lovable export shipped #F59E0B (~2.0:1) and #22C55E (~2.4:1),
 * both of which fail 1.4.11. Intake recipe step 5 / Aria audit history
 * mandate the darkened palette as the catalog default.
 */
const DEFAULT_COLORS = { low: '#3B82F6', medium: '#B45309', high: '#15803D' };

const bucketOf = (cagr: number): CAGRBucket =>
  cagr < 10 ? 'low' : cagr <= 20 ? 'medium' : 'high';

const GridTechMapWidget = ({ config }: WidgetProps) => {
  const selectorId = useId();
  const captionId = useId();

  const categories = config.categories ?? defaultCategories;
  const labelPositions = config.labelPositions ?? defaultLabelPositions;
  const colors = { ...DEFAULT_COLORS, ...(config.colors ?? {}) };

  const [selectedId, setSelectedId] = useState<string>(
    config.initialCategoryId ?? categories[0]?.id ?? '',
  );

  const selected: Category | undefined = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? categories[0],
    [categories, selectedId],
  );

  if (!selected) {
    return (
      <div style={{ padding: 16, fontSize: 14, color: 'var(--gtm-muted)' }}>
        No grid-tech data available.
      </div>
    );
  }

  const hideSelector = config.hideCategorySelector === true;

  const data: SubCategory[] = selected.subCategories;
  const chartData = data.map((d) => ({ ...d, x: d.arl, y: d.marketSize2030 }));
  const maxMarketSize = Math.max(...data.map((d) => d.marketSize2030));
  const yAxisMax = selected.yAxisMax ?? Math.ceil(maxMarketSize / 5) * 5 + 5;
  const yAxisMid = yAxisMax / 2;
  const xAxisMid = 7;

  const renderShape = (props: any) => {
    const { cx, cy, payload } = props;
    const bucket = bucketOf(payload.cagr);
    const color = colors[bucket];
    const size = 8;
    const pos = labelPositions[payload.name] || 'top';

    let shapeEl: JSX.Element;
    if (bucket === 'low') {
      shapeEl = (
        <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} fill={color} stroke={color} strokeWidth={1.5} />
      );
    } else if (bucket === 'high') {
      const t = size * 1.2;
      shapeEl = (
        <polygon
          points={`${cx},${cy - t} ${cx - t},${cy + t * 0.7} ${cx + t},${cy + t * 0.7}`}
          fill={color}
          stroke={color}
          strokeWidth={1.5}
        />
      );
    } else {
      shapeEl = <circle cx={cx} cy={cy} r={size} fill={color} stroke={color} strokeWidth={1.5} />;
    }

    const label = (() => {
      switch (pos) {
        case 'left':
          return { x: cx - 14, y: cy, textAnchor: 'end' as const, dominantBaseline: 'middle' as const };
        case 'right':
          return { x: cx + 14, y: cy, textAnchor: 'start' as const, dominantBaseline: 'middle' as const };
        case 'bottom':
          return { x: cx, y: cy + 18, textAnchor: 'middle' as const, dominantBaseline: 'hanging' as const };
        case 'top-right':
          return { x: cx + 14, y: cy - 14, textAnchor: 'start' as const, dominantBaseline: 'auto' as const };
        default:
          return { x: cx, y: cy - 14, textAnchor: 'middle' as const, dominantBaseline: 'auto' as const };
      }
    })();

    return (
      <g>
        {shapeEl}
        <text {...label} fill="var(--gtm-fg)" fontSize={13} fontWeight={500}>
          {payload.name}
        </text>
      </g>
    );
  };

  const TooltipBody = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--gtm-card)',
          border: '1px solid var(--gtm-border)',
          borderRadius: 8,
          padding: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          color: 'var(--gtm-fg)',
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{d.name}</div>
        <div style={{ color: 'var(--gtm-muted)' }}>ARL: <span style={{ color: 'var(--gtm-fg)', fontWeight: 500 }}>{d.arl}</span></div>
        <div style={{ color: 'var(--gtm-muted)' }}>Market Size 2025: <span style={{ color: 'var(--gtm-fg)', fontWeight: 500 }}>${d.marketSize2025}B</span></div>
        <div style={{ color: 'var(--gtm-muted)' }}>Market Size 2030: <span style={{ color: 'var(--gtm-fg)', fontWeight: 500 }}>${d.marketSize2030}B</span></div>
        <div style={{ color: 'var(--gtm-muted)' }}>CAGR: <span style={{ color: 'var(--gtm-fg)', fontWeight: 500 }}>{d.cagr}%</span></div>
      </div>
    );
  };

  return (
    <div className="cbey-grid-tech-map" style={cssVars}>
      <div
        style={{
          background: 'var(--gtm-card)',
          border: '1px solid var(--gtm-border)',
          borderRadius: 12,
          color: 'var(--gtm-fg)',
          padding: 24,
          width: '100%',
        }}
      >
        {!hideSelector && categories.length > 1 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <label
              htmlFor={selectorId}
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--gtm-fg)' }}
            >
              Select Domain:
            </label>
            <select
              id={selectorId}
              value={selected.id}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                background: 'var(--gtm-card)',
                color: 'var(--gtm-fg)',
                border: '1px solid var(--gtm-border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 14,
                minWidth: 280,
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '8px 4px',
          }}
        >
          {/*
            The widget's only visible heading is an <h3> for the current
            category name. The wrapping <figure>'s <figcaption> (or
            aria-label fallback) carries the widget name at the paragraph
            level, so a second page <h1> inside the widget would duplicate
            that and break document outline (WCAG 2.4.6). <h3> sits one
            level below the host page's section <h2>.
          */}
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--gtm-fg)', margin: 0 }}>
            {selected.name}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 13,
              color: 'var(--gtm-muted)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill={colors.low} /></svg>
              CAGR &lt;10%
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill={colors.medium} /></svg>
              CAGR 10-20%
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><polygon points="6,1 1,11 11,11" fill={colors.high} /></svg>
              CAGR &gt;20%
            </span>
          </div>
        </div>

        <div
          role="img"
          aria-label={`Scatter chart: ${selected.name}, ARL versus market size 2030.`}
          aria-describedby={captionId}
          style={{ height: 600, width: '100%' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gtm-border)" opacity={0.6} />
              <ReferenceLine x={xAxisMid} stroke="var(--gtm-muted)" strokeWidth={1} strokeDasharray="8 4" opacity={0.6} />
              <ReferenceLine y={yAxisMid} stroke="var(--gtm-muted)" strokeWidth={1} strokeDasharray="8 4" opacity={0.6} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[4.5, 9.5]}
                ticks={[5, 6, 7, 8, 9]}
                tick={{ fill: 'var(--gtm-muted)', fontSize: 16 }}
                stroke="var(--gtm-border)"
                tickLine={false}
              >
                <Label
                  value="Adoption Readiness Level (ARL)"
                  position="bottom"
                  offset={20}
                  style={{ fill: 'var(--gtm-fg)', fontSize: 16, fontWeight: 500, textAnchor: 'middle' }}
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, yAxisMax]}
                tick={{ fill: 'var(--gtm-muted)', fontSize: 16 }}
                stroke="var(--gtm-border)"
                tickLine={false}
              >
                <Label
                  value="Market Size 2030 ($B)"
                  angle={-90}
                  position="left"
                  offset={15}
                  style={{ fill: 'var(--gtm-fg)', fontSize: 16, fontWeight: 500, textAnchor: 'middle' }}
                />
              </YAxis>
              <ZAxis type="number" range={[200, 200]} />
              <Tooltip content={<TooltipBody />} cursor={{ stroke: 'var(--gtm-muted)', strokeDasharray: '3 3', opacity: 0.5 }} />
              <Scatter data={chartData} shape={renderShape} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/*
          Screen-reader fallback — visually-hidden but in the
          accessibility tree. Read by NVDA/VoiceOver/JAWS users when
          they navigate the figure's aria-describedby pointer. The
          chart container above points to this caption's id.
        */}
        <table className="cbey-sr-only">
          <caption id={captionId}>
            {`${selected.name}: subcategories with ARL, market size in 2025, market size in 2030, and CAGR.`}
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
            {data.map((row) => (
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
          Sighted-keyboard fallback for the Recharts tooltip data — same
          rationale as grid-tech-market-map (Aria audit P2-8). Recharts
          markers aren't focusable and tooltips fire only on mouse
          hover, so a sighted user navigating with the keyboard alone
          has no path to the per-point values. <details> is
          keyboard-reachable (Tab → Space/Enter to expand), starts
          closed, and stays out of the way of mouse users.
        */}
        <details className="cbey-grid-tech-map__data-details">
          <summary className="cbey-grid-tech-map__data-summary">
            View chart data as a table
          </summary>
          <table className="cbey-grid-tech-map__data-table">
            <caption>
              {`${selected.name}: subcategories with ARL, market size in 2025, market size in 2030, and CAGR.`}
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
              {data.map((row) => (
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

        <div
          style={{
            display: 'grid',
            gap: 16,
            marginTop: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            fontSize: 14,
            color: 'var(--gtm-fg)',
          }}
        >
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>X-Axis: ARL (3-9)</div>
            <div style={{ color: 'var(--gtm-muted)' }}>Adoption Readiness Level. Higher values are closer to widespread adoption.</div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Y-Axis: Market Size 2030</div>
            <div style={{ color: 'var(--gtm-muted)' }}>Projected market size in 2030 (USD billions).</div>
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Shape: 2025-2030 CAGR</div>
            <div style={{ color: 'var(--gtm-muted)' }}>Square (&lt;10%), Circle (10-20%), Triangle (&gt;20%).</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mount the widget into the loader-supplied shadow-root host element.
 *
 * @param shadowHost - the div the React tree renders into.
 * @param shadowRoot - the shadow root (unused; rendering happens inside
 *   shadowHost).
 * @param config - JSON config blob, schema-validated upstream.
 * @returns teardown that unmounts the React root.
 */
const mount = (
  shadowHost: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _shadowRoot: ShadowRoot,
  config: GridTechMapConfig,
): (() => void) => {
  const root = createRoot(shadowHost);
  root.render(<GridTechMapWidget config={config} />);
  return () => {
    root.unmount();
  };
};

export default mount;
