/**
 * @file
 * Mount entrypoint for the investment-thesis-table widget.
 *
 * Default export: `(shadowHost, shadowRoot, config) => () => void`.
 *
 * The widget renders a per-technology investment-thesis matrix and a
 * companion set of long-form thesis cards. A native `<select>` switches
 * between top-level categories (Energy Storage, T&D – GETs).
 *
 * Accessibility:
 *   - Native `<select>` with a `<label>` and id binding via useId.
 *   - Two semantic <table>s with <caption>, <th scope="col"> column
 *     headers, and <th scope="row"> first-column row headers.
 *   - Emoji "signals" are decorative; the container span carries
 *     aria-hidden="true" so SR users hear the label text only.
 *   - Headings: <h3> for the section title, <h4> for the "Detailed
 *     Thesis" block, <h5> for each technology card title. No <h1>
 *     or <h2> emitted by the widget itself.
 */
import { useId, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  defaultThesisData,
  defaultSignalMap,
  type CategoryThesis,
  type TechSignals,
} from './data';
import './styles.css';

export interface InvestmentThesisTableConfig {
  /** Override the bundled thesis content. */
  thesisData?: CategoryThesis[];
  /** Override the bundled per-tech signal/summary map. */
  signalMap?: Record<string, TechSignals>;
  /** Initial selected category id. Falls back to the first entry. */
  initialCategoryId?: string;
  /** Hide the category `<select>` when true. */
  hideCategorySelector?: boolean;
}

interface WidgetProps {
  config: InvestmentThesisTableConfig;
}

const cssVars: React.CSSProperties = {
  ['--itt-fg' as any]: '#26323d',
  ['--itt-muted' as any]: '#64748b',
  ['--itt-border' as any]: '#dbe2ea',
  ['--itt-card' as any]: '#ffffff',
  ['--itt-row' as any]: '#f1f5f9',
  ['--itt-primary' as any]: '#0c6f9a',
};

const cellStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'top',
  borderBottom: '1px solid var(--itt-border)',
  fontSize: 13,
  color: 'var(--itt-fg)',
};

const headStyle: React.CSSProperties = {
  ...cellStyle,
  background: 'var(--itt-row)',
  fontWeight: 600,
  textAlign: 'left',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  padding: '2px 8px',
  border: '1px solid var(--itt-border)',
  borderRadius: 999,
  marginRight: 6,
  marginBottom: 6,
  whiteSpace: 'nowrap',
  color: 'var(--itt-fg)',
  background: 'var(--itt-card)',
};

const InvestmentThesisTableWidget = ({ config }: WidgetProps) => {
  const selectorId = useId();
  const captionId = useId();
  const headingId = useId();

  const thesisData = config.thesisData ?? defaultThesisData;
  const signalMap = config.signalMap ?? defaultSignalMap;

  const [selectedId, setSelectedId] = useState<string>(
    config.initialCategoryId ?? thesisData[0]?.categoryId ?? '',
  );

  const selected = useMemo(
    () => thesisData.find((t) => t.categoryId === selectedId) ?? thesisData[0],
    [thesisData, selectedId],
  );

  if (!selected) {
    return (
      <div style={{ padding: 16, fontSize: 14, color: 'var(--itt-muted)' }}>
        No investment-thesis data available.
      </div>
    );
  }

  const hideSelector = config.hideCategorySelector === true;

  return (
    <div className="cbey-investment-thesis-table" style={cssVars}>
      <div
        style={{
          background: 'var(--itt-card)',
          border: '1px solid var(--itt-border)',
          borderRadius: 12,
          padding: 24,
          color: 'var(--itt-fg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/*
            <h3> sits one level below the host page's section <h2>.
            The widget never emits an <h1> or <h2>; the wrapping
            <figure>'s <figcaption> (or aria-label fallback) carries
            the widget's own name at the paragraph level.
          */}
          <h3 id={headingId} style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            Investment Thesis by Technology Category
          </h3>
          {!hideSelector && thesisData.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label
                htmlFor={selectorId}
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--itt-fg)' }}
              >
                Select Domain:
              </label>
              <select
                id={selectorId}
                value={selected.categoryId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  background: 'var(--itt-card)',
                  color: 'var(--itt-fg)',
                  border: '1px solid var(--itt-border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 14,
                  minWidth: 280,
                }}
              >
                {thesisData.map((t) => (
                  <option key={t.categoryId} value={t.categoryId}>
                    {t.categoryName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div
          className="cbey-investment-thesis-table__scroll"
          tabIndex={0}
          role="region"
          aria-labelledby={headingId}
          style={{
            border: '1px solid var(--itt-border)',
            borderRadius: 10,
            overflowX: 'auto',
            marginBottom: 32,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <caption id={captionId} className="cbey-sr-only">
              {`Investment-thesis signals for ${selected.categoryName}. Columns: technology, early-stage VC signals, late-stage VC signals.`}
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ ...headStyle, width: 220 }}>Technology (ARL)</th>
                <th scope="col" style={headStyle}>Early-Stage VC Signals</th>
                <th scope="col" style={headStyle}>Late-Stage VC Signals</th>
              </tr>
            </thead>
            <tbody>
              {selected.technologies.map((tech, i) => {
                const sig = signalMap[tech.name];
                return (
                  <tr key={i}>
                    <th
                      scope="row"
                      style={{ ...cellStyle, fontWeight: 500, textAlign: 'left' }}
                    >
                      {tech.name}
                    </th>
                    <td style={cellStyle}>
                      <div style={{ marginBottom: 6 }}>
                        {sig?.earlyStage.signals.map((s, j) => (
                          <span key={j} style={badgeStyle}>
                            <span aria-hidden="true">{s.emoji}</span> {s.label}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--itt-muted)', lineHeight: 1.5 }}>
                        {sig?.earlyStage.summary}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ marginBottom: 6 }}>
                        {sig?.lateStage.signals.map((s, j) => (
                          <span key={j} style={badgeStyle}>
                            <span aria-hidden="true">{s.emoji}</span> {s.label}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--itt-muted)', lineHeight: 1.5 }}>
                        {sig?.lateStage.summary}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h4 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Detailed Thesis</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected.technologies.map((tech, i) => (
            <article
              key={i}
              style={{
                border: '1px solid var(--itt-border)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <h5 style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{tech.name}</h5>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--itt-primary)' }}>
                  Early-Stage VC (Pre-Seed / Seed / Series A)
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 4, marginBottom: 14 }}>
                  {tech.earlyStage}
                </p>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--itt-primary)' }}>
                  Late-Stage VC (Series B / C / D)
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 4, marginBottom: 0 }}>
                  {tech.lateStage}
                </p>
              </div>
            </article>
          ))}
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
  config: InvestmentThesisTableConfig,
): (() => void) => {
  const root = createRoot(shadowHost);
  root.render(<InvestmentThesisTableWidget config={config} />);
  return () => {
    root.unmount();
  };
};

export default mount;
