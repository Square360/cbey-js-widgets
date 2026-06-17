/**
 * @file
 * Mount entrypoint for the energy-storage-comparison-table widget.
 *
 * Default export: `(shadowHost, shadowRoot, config) => () => void`.
 *
 * The widget renders a static comparison table showing how each emerging
 * energy-storage technology compares to lithium-ion at its peak
 * suitability duration. No state, no interactive controls — pure
 * tabular content.
 *
 * Accessibility:
 *   - Semantic <table> with a visible <caption> (the heading is part
 *     of the visible chrome, so the caption sits in cbey-sr-only to
 *     avoid duplication while remaining available to AT).
 *   - <th scope="col"> column headers; <th scope="row"> for the
 *     technology name in each row.
 *   - Horizontally scrollable container at narrow viewports; the
 *     surrounding <h3>/<p> remain in flow.
 *   - No animations, so no reduced-motion handling required, but the
 *     styles.css carries the guard for parity.
 */
import { useId } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultEnergyStorageComparisons, type TechComparison } from './data';
import './styles.css';

const costStructure = [
  { level: 'Cell-level', components: 'Cathode, anode, electrolyte, separator' },
  { level: 'Pack/Enclosure-level', components: 'Cells + [BMS (Battery Management System), cooling/HVAC, housing/enclosure, assembly/BoP (Balance of Pack)]' },
  { level: 'Core equipment-level', components: 'Enclosures + [PCS (Power Conversion System: DC-AC inverter), EMS (Energy Management System: optimization/scheduling)]' },
  { level: 'System-level', components: 'Core equipment + [installation/civils, EPC, grid connection/EBOS/SBOS]' },
  { level: 'LCOS', components: 'System + [Opex, accounting for roundtrip efficiency, lifetime energy output]' },
];

export interface EnergyStorageComparisonTableConfig {
  /** Override the bundled comparison rows. */
  rows?: TechComparison[];
  /** Override the visible section heading. */
  title?: string;
  /** Override the visible section subtitle. */
  subtitle?: string;
}

interface WidgetProps {
  config: EnergyStorageComparisonTableConfig;
}

const cssVars: React.CSSProperties = {
  ['--esct-fg' as any]: '#26323d',
  ['--esct-muted' as any]: '#64748b',
  ['--esct-border' as any]: '#dbe2ea',
  ['--esct-card' as any]: '#ffffff',
  ['--esct-row' as any]: '#f1f5f9',
};

const cellStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'top',
  borderBottom: '1px solid var(--esct-border)',
  fontSize: 13,
  color: 'var(--esct-fg)',
  textAlign: 'left',
};

const headStyle: React.CSSProperties = {
  ...cellStyle,
  background: 'var(--esct-row)',
  fontWeight: 600,
};

const EnergyStorageComparisonTableWidget = ({ config }: WidgetProps) => {
  const headingId = useId();
  const rows = config.rows ?? defaultEnergyStorageComparisons;
  const title = config.title ?? 'Technology Cost Comparison vs. Li-Ion';
  const subtitle =
    config.subtitle ??
    'How each energy storage technology compares to lithium-ion at its peak suitability duration.';

  return (
    <div className="cbey-energy-storage-comparison-table" style={cssVars}>
      <div
        style={{
          background: 'var(--esct-card)',
          border: '1px solid var(--esct-border)',
          borderRadius: 12,
          padding: 24,
          color: 'var(--esct-fg)',
        }}
      >
        {/*
          <h3> sits one level below the host page's section <h2>. No
          <h1> or <h2> in the widget body.
        */}
        <h3 id={headingId} style={{ fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--esct-muted)', marginTop: 0, marginBottom: 20 }}>
          {subtitle}
        </p>
        <div
          className="cbey-energy-storage-comparison-table__scroll"
          tabIndex={0}
          role="region"
          aria-labelledby={headingId}
          style={{
            border: '1px solid var(--esct-border)',
            borderRadius: 10,
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <caption className="cbey-sr-only">
              {`${title}. ${subtitle}`}
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ ...headStyle, width: 160 }}>Technology</th>
                <th scope="col" style={{ ...headStyle, width: 160 }}>Peak Suitability</th>
                <th scope="col" style={headStyle}>Li-Ion Cost (Same Duration)</th>
                <th scope="col" style={headStyle}>Tech Cost</th>
                <th scope="col" style={headStyle}>vs. Li-Ion</th>
                <th scope="col" style={headStyle}>Key Advantage at This Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <th scope="row" style={{ ...cellStyle, fontWeight: 500 }}>{r.technology}</th>
                  <td style={cellStyle}>{r.peakSuitability}</td>
                  <td style={cellStyle}>{r.liIonCost}</td>
                  <td style={cellStyle}>{r.techCost}</td>
                  <td style={cellStyle}>{r.vsLiIon}</td>
                  <td style={cellStyle}>{r.keyAdvantage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Li-Ion Cost Structure footnote */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--esct-border)' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--esct-fg)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: 0,
              marginBottom: 12,
            }}
          >
            Typical Li-Ion Battery Cost Structure and Components
          </p>
          <div
            style={{
              border: '1px solid var(--esct-border)',
              borderRadius: 10,
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th scope="col" style={{ ...headStyle, fontSize: 12, width: 180 }}>Cost Level</th>
                  <th scope="col" style={{ ...headStyle, fontSize: 12 }}>Key Components</th>
                </tr>
              </thead>
              <tbody>
                {costStructure.map((row, i) => (
                  <tr key={i}>
                    <th scope="row" style={{ ...cellStyle, fontSize: 12, fontWeight: 500 }}>{row.level}</th>
                    <td style={{ ...cellStyle, fontSize: 12, color: 'var(--esct-muted)' }}>{row.components}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
 * @param shadowRoot - the shadow root (unused).
 * @param config - JSON config blob, schema-validated upstream.
 * @returns teardown that unmounts the React root.
 */
const mount = (
  shadowHost: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _shadowRoot: ShadowRoot,
  config: EnergyStorageComparisonTableConfig,
): (() => void) => {
  const root = createRoot(shadowHost);
  root.render(<EnergyStorageComparisonTableWidget config={config} />);
  return () => {
    root.unmount();
  };
};

export default mount;
