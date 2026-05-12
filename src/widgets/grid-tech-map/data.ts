/**
 * @file
 * Default dataset for the grid-tech-map widget.
 *
 * Lifted verbatim from the 2026-05-12 Lovable intake (power-vista-plot)
 * with no value changes. The widget's `config.categories` knob lets editors
 * override this dataset; the export here is the catalog default.
 *
 * Schema: see `./index.tsx` for the runtime types and the JSON Schema at
 * `../../schemas/grid-tech-map.json` for the editor-facing config contract.
 */

export interface SubCategory {
  name: string;
  arl: number;
  marketSize2025: number;
  marketSize2030: number;
  cagr: number;
}

export interface Category {
  id: string;
  name: string;
  yAxisMax?: number;
  subCategories: SubCategory[];
}

export const defaultCategories: Category[] = [
  {
    id: 'energy-storage',
    name: 'Energy Storage Technologies',
    yAxisMax: 28,
    subCategories: [
      { name: 'Thermal Energy Storage', arl: 8, marketSize2025: 6.24, marketSize2030: 11.21, cagr: 12.4 },
      { name: 'Sodium-ion Batteries', arl: 8, marketSize2025: 1.82, marketSize2030: 6.80, cagr: 30.1 },
      { name: 'Zinc-based Batteries', arl: 7, marketSize2025: 1.10, marketSize2030: 2.50, cagr: 17.8 },
      { name: 'Flywheels', arl: 7, marketSize2025: 0.48, marketSize2030: 0.68, cagr: 7.2 },
      { name: 'Flow Batteries', arl: 7, marketSize2025: 1.05, marketSize2030: 1.70, cagr: 10.1 },
      { name: 'Iron-Air Batteries', arl: 6, marketSize2025: 1.50, marketSize2030: 5.40, cagr: 29.2 },
      { name: 'Hydrogen Storage', arl: 5, marketSize2025: 17.50, marketSize2030: 26.94, cagr: 9.0 },
    ],
  },
  {
    id: 'tnd-gets',
    name: 'T&D – Grid Enhancing Technologies',
    yAxisMax: 8,
    subCategories: [
      { name: 'Advanced Conductors (HTLS)', arl: 9, marketSize2025: 4.50, marketSize2030: 6.00, cagr: 5.9 },
      { name: 'Grid-forming Inverters', arl: 7, marketSize2025: 0.86, marketSize2030: 1.50, cagr: 11.8 },
      { name: 'Dynamic Line Ratings Systems (DLR)', arl: 7, marketSize2025: 0.25, marketSize2030: 0.73, cagr: 23.6 },
      { name: 'Power Flow Controllers (FACTS)', arl: 6, marketSize2025: 1.40, marketSize2030: 2.00, cagr: 7.4 },
      { name: 'Solid State Transformers (SST)', arl: 5, marketSize2025: 0.12, marketSize2030: 0.25, cagr: 15.8 },
      { name: 'Superconducting Power Lines', arl: 5, marketSize2025: 1.30, marketSize2030: 2.20, cagr: 11.1 },
    ],
  },
];

export const labelPositions: Record<string, 'left' | 'right' | 'top' | 'bottom' | 'top-right'> = {
  'Hydrogen Storage': 'right',
  'Iron-Air Batteries': 'top',
  'Sodium-ion Batteries': 'top',
  'Thermal Energy Storage': 'top',
  'Zinc-based Batteries': 'left',
  'Flow Batteries': 'right',
  'Flywheels': 'left',
  'Grid-forming Inverters': 'left',
  'Dynamic Line Ratings Systems (DLR)': 'right',
  'Solid State Transformers (SST)': 'right',
  'Superconducting Power Lines': 'top',
  'Advanced Conductors (HTLS)': 'top',
  'Power Flow Controllers (FACTS)': 'top',
};
