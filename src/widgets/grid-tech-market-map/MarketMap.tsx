/**
 * @file
 * Scatter-chart visualisation: ARL vs. Market Size 2030, grouped by CAGR.
 *
 * Lifted from cbey-grid-navigator/src/components/MarketMap.tsx with
 * intake-recipe edits applied:
 *   - data import switched from the `@/` alias to a local relative path,
 *     so this folder is self-contained when the catalog is composer-installed
 *   - no other behavioural changes; visual output matches source.
 *
 * Accessibility notes are in this folder's README.md and are reviewed by
 * Aria at PR time. The hidden data table is rendered alongside this chart
 * by index.tsx — keeping the screen-reader fallback at the widget root
 * means it stays present even if the chart fails to mount.
 */
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
import type { SubCategory } from './data/gridTechData';

interface MarketMapProps {
  data: SubCategory[];
  categoryName: string;
  yAxisMax?: number;
}

type CAGRBucket = 'low' | 'medium' | 'high';

const getCAGRBucket = (cagr: number): CAGRBucket => {
  if (cagr < 10) return 'low';
  if (cagr <= 20) return 'medium';
  return 'high';
};

const getShapeForCAGR = (
  bucket: CAGRBucket,
): 'square' | 'circle' | 'triangle' => {
  switch (bucket) {
    case 'low':
      return 'square';
    case 'medium':
      return 'circle';
    case 'high':
      return 'triangle';
  }
};

// Colours for each CAGR bucket.
//
// Tuned to meet WCAG 1.4.11 (non-text contrast, 3:1 minimum) against the
// white card background (`--cbey-card` → #FFFFFF in the v1 theme). Shape
// redundancy (square / circle / triangle) handles WCAG 1.4.1; these
// colours are paired with each shape, not relied on alone.
//
// Measured ratios against #FFFFFF (computed with the WCAG relative-
// luminance formula; see this file's accompanying README for the audit
// trail):
//   - low (#3B82F6, blue):    3.68:1  passes 1.4.11
//   - medium (#B45309, amber): 4.66:1 passes 1.4.11 and 1.4.3 body
//   - high (#15803D, green):  4.54:1  passes 1.4.11 and 1.4.3 body
//
// If the design system rotates `--cbey-card` away from pure white, these
// values need re-measuring. The README a11y section is the canonical
// audit log — update both together.
const CAGR_COLORS = {
  low: '#3B82F6',
  medium: '#B45309',
  high: '#15803D',
};

interface TooltipPayloadEntry {
  payload: SubCategory & { x: number; y: number };
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="cbey-bg-card cbey-border cbey-border-border cbey-rounded-lg cbey-p-4 cbey-shadow-lg">
        <p className="cbey-font-semibold cbey-text-foreground cbey-mb-2">
          {data.name}
        </p>
        <div className="cbey-space-y-1 cbey-text-sm">
          <p className="cbey-text-muted-foreground">
            ARL:{' '}
            <span className="cbey-font-medium cbey-text-foreground">
              {data.arl}
            </span>
          </p>
          <p className="cbey-text-muted-foreground">
            Market Size 2025:{' '}
            <span className="cbey-font-medium cbey-text-foreground">
              ${data.marketSize2025}B
            </span>
          </p>
          <p className="cbey-text-muted-foreground">
            Market Size 2030:{' '}
            <span className="cbey-font-medium cbey-text-foreground">
              ${data.marketSize2030}B
            </span>
          </p>
          <p className="cbey-text-muted-foreground">
            CAGR:{' '}
            <span className="cbey-font-medium cbey-text-foreground">
              {data.cagr}%
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const LABEL_POSITIONS: Record<
  string,
  'left' | 'right' | 'top' | 'bottom' | 'top-right'
> = {
  'Hydrogen Storage': 'right',
  'Iron-Air Batteries': 'top',
  'Sodium-ion Batteries': 'top',
  'Thermal Energy Storage': 'top',
  'Zinc-based Batteries': 'left',
  'Flow Batteries': 'right',
  Flywheels: 'left',
  'Grid-forming Inverters': 'left',
  'Dynamic Line Ratings Systems (DLR)': 'right',
  'Solid State Transformers (SST)': 'right',
  'Superconducting Power Lines': 'top',
  'Advanced Conductors (HTLS)': 'top',
  'Power Flow Controllers (FACTS)': 'top',
};

interface CustomShapeProps {
  cx?: number;
  cy?: number;
  payload?: SubCategory;
}

const renderCustomShape = (props: CustomShapeProps) => {
  const { cx, cy, payload } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
    return <g />;
  }
  const bucket = getCAGRBucket(payload.cagr);
  const shape = getShapeForCAGR(bucket);
  const color = CAGR_COLORS[bucket];
  const size = 8;
  const labelPosition = LABEL_POSITIONS[payload.name] || 'top';

  const shapeElement = (() => {
    switch (shape) {
      case 'square':
        return (
          <rect
            x={cx - size}
            y={cy - size}
            width={size * 2}
            height={size * 2}
            fill={color}
            stroke={color}
            strokeWidth={1.5}
          />
        );
      case 'triangle': {
        const triangleSize = size * 1.2;
        return (
          <polygon
            points={`${cx},${cy - triangleSize} ${cx - triangleSize},${
              cy + triangleSize * 0.7
            } ${cx + triangleSize},${cy + triangleSize * 0.7}`}
            fill={color}
            stroke={color}
            strokeWidth={1.5}
          />
        );
      }
      case 'circle':
      default:
        return (
          <circle
            cx={cx}
            cy={cy}
            r={size}
            fill={color}
            stroke={color}
            strokeWidth={1.5}
          />
        );
    }
  })();

  const getLabelProps = () => {
    switch (labelPosition) {
      case 'left':
        return {
          x: cx - 14,
          y: cy,
          textAnchor: 'end' as const,
          dominantBaseline: 'middle' as const,
        };
      case 'right':
        return {
          x: cx + 14,
          y: cy,
          textAnchor: 'start' as const,
          dominantBaseline: 'middle' as const,
        };
      case 'bottom':
        return {
          x: cx,
          y: cy + 18,
          textAnchor: 'middle' as const,
          dominantBaseline: 'hanging' as const,
        };
      case 'top-right':
        return {
          x: cx + 14,
          y: cy - 14,
          textAnchor: 'start' as const,
          dominantBaseline: 'auto' as const,
        };
      case 'top':
      default:
        return {
          x: cx,
          y: cy - 14,
          textAnchor: 'middle' as const,
          dominantBaseline: 'auto' as const,
        };
    }
  };

  const labelProps = getLabelProps();

  return (
    <g>
      {shapeElement}
      <text
        {...labelProps}
        fill="hsl(var(--cbey-foreground))"
        fontSize={13}
        fontWeight={500}
      >
        {payload.name}
      </text>
    </g>
  );
};

const ShapeLegend = () => (
  <div className="cbey-flex cbey-items-center cbey-gap-4 cbey-text-sm">
    <div className="cbey-flex cbey-items-center cbey-gap-1.5">
      <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill={CAGR_COLORS.low} />
      </svg>
      <span className="cbey-text-muted-foreground">CAGR &lt;10%</span>
    </div>
    <div className="cbey-flex cbey-items-center cbey-gap-1.5">
      <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="5" fill={CAGR_COLORS.medium} />
      </svg>
      <span className="cbey-text-muted-foreground">CAGR 10-20%</span>
    </div>
    <div className="cbey-flex cbey-items-center cbey-gap-1.5">
      <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
        <polygon points="6,1 1,11 11,11" fill={CAGR_COLORS.high} />
      </svg>
      <span className="cbey-text-muted-foreground">CAGR &gt;20%</span>
    </div>
  </div>
);

const MarketMap = ({
  data,
  categoryName,
  yAxisMax: customYAxisMax,
}: MarketMapProps) => {
  const chartData = data.map((item) => ({
    ...item,
    x: item.arl,
    y: item.marketSize2030,
  }));

  const maxMarketSize = Math.max(...data.map((d) => d.marketSize2030));
  const yAxisMax = customYAxisMax || Math.ceil(maxMarketSize / 5) * 5 + 5;
  const yAxisMid = yAxisMax / 2;
  const xAxisMid = 7;

  return (
    <div className="cbey-w-full cbey-h-full cbey-flex cbey-flex-col">
      <div className="cbey-flex cbey-items-center cbey-justify-between cbey-px-4 cbey-py-2">
        {/*
          Demoted from <h2> to <h3> alongside the removal of the outer
          widget <h1> (Aria audit Finding 3, WCAG 2.4.6). The widget is
          embedded inside a paragraph whose <figure> caption sits at the
          host page's section level; the category name is one level below.
        */}
        <h3 className="cbey-text-xl cbey-font-semibold cbey-text-foreground">
          {categoryName}
        </h3>
        <ShapeLegend />
      </div>

      <div
        className="cbey-flex-1"
        role="img"
        aria-label={`Scatter chart: ${categoryName}, ARL versus market size 2030.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 70 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--cbey-border))"
              opacity={0.5}
            />

            <ReferenceLine
              x={xAxisMid}
              stroke="hsl(var(--cbey-muted-foreground))"
              strokeWidth={1}
              strokeDasharray="8 4"
              opacity={0.6}
            />
            <ReferenceLine
              y={yAxisMid}
              stroke="hsl(var(--cbey-muted-foreground))"
              strokeWidth={1}
              strokeDasharray="8 4"
              opacity={0.6}
            />

            <XAxis
              type="number"
              dataKey="x"
              name="ARL"
              domain={[4.5, 9.5]}
              ticks={[5, 6, 7, 8, 9]}
              tick={{
                fill: 'hsl(var(--cbey-muted-foreground))',
                fontSize: 17,
              }}
              stroke="hsl(var(--cbey-border))"
              tickLine={false}
              axisLine={{ strokeWidth: 1 }}
            >
              <Label
                value="Adoption Readiness Level (ARL)"
                position="bottom"
                offset={20}
                style={{
                  fill: 'hsl(var(--cbey-foreground))',
                  fontSize: 17,
                  fontWeight: 500,
                  textAnchor: 'middle',
                }}
              />
            </XAxis>

            <YAxis
              type="number"
              dataKey="y"
              name="Market Size 2030"
              domain={[0, yAxisMax]}
              tick={{
                fill: 'hsl(var(--cbey-muted-foreground))',
                fontSize: 17,
              }}
              stroke="hsl(var(--cbey-border))"
              tickLine={false}
              axisLine={{ strokeWidth: 1 }}
            >
              <Label
                value="Market Size 2030 ($B)"
                angle={-90}
                position="left"
                offset={15}
                style={{
                  fill: 'hsl(var(--cbey-foreground))',
                  fontSize: 17,
                  fontWeight: 500,
                  textAnchor: 'middle',
                }}
              />
            </YAxis>

            <ZAxis type="number" range={[200, 200]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'hsl(var(--cbey-muted-foreground))',
                strokeDasharray: '3 3',
                opacity: 0.5,
              }}
            />
            <Scatter
              name={categoryName}
              data={chartData}
              shape={renderCustomShape}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketMap;
