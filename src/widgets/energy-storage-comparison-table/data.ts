/**
 * @file
 * Default comparison rows for the energy-storage-comparison-table widget.
 *
 * Lifted verbatim from the 2026-05-12 Lovable intake (power-vista-plot)
 * with no value changes. The widget's `config.rows` knob lets editors
 * override these rows.
 */
export interface TechComparison {
  technology: string;
  peakSuitability: string;
  liIonCost: string;
  techCost: string;
  vsLiIon: string;
  keyAdvantage: string;
}

export const defaultEnergyStorageComparisons: TechComparison[] = [
  {
    technology: 'Sodium-ion Batteries',
    peakSuitability: 'Short-duration (<4 hrs)',
    liIonCost: '$40/kWh cell-level; $125/kWh system-level (4-hr, Ember 2025)',
    techCost: '$59/kWh cell-level (Wood Mackenzie, Nov 2025); $19/kWh (CATL unverified)',
    vsLiIon: '~1.5× more expensive at cell level today; potential parity or cheaper if CATL figures hold',
    keyAdvantage: 'No Li/Co/Ni dependency; 10,000 cycle life vs. 2,000–4,000 for LFP; wider temp range (−40°C to 70°C vs. 15–35°C); drop-in replacement using existing Li-ion BoP',
  },
  {
    technology: 'Flywheels',
    peakSuitability: 'Short-duration (<4 hrs)',
    liIonCost: '$125/kWh system-level; LCOS $65/MWh (4-hr, Ember 2025)',
    techCost: '$1,200–1,500/kWh capex; LCOS ~$60/MWh (Amber Kinetics)',
    vsLiIon: '~10–12× more expensive on capex; LCOS cheaper (~$60 vs. $65/MWh)',
    keyAdvantage: 'Near-unlimited cycles with zero degradation and 25-year lifespan — Li-ion degrades rapidly at high cycle frequency, making flywheels cheaper on LCOS for frequency regulation',
  },
  {
    technology: 'Zinc-based Batteries',
    peakSuitability: 'Medium-duration (4–8 hrs)',
    liIonCost: '$125/kWh system-level; rises non-linearly beyond 4 hrs',
    techCost: '~$160/kWh system-level',
    vsLiIon: '~1.3× more expensive at equivalent duration',
    keyAdvantage: 'Inherently non-flammable aqueous electrolyte; 100% depth of discharge; no thermal management or fire suppression needed; easier urban permitting vs. Li-ion fire risk',
  },
  {
    technology: 'Flow Batteries (VRFB)',
    peakSuitability: 'Medium–Long duration (4–12 hrs)',
    liIonCost: '$125/kWh at 4 hrs; $300–400/kWh at 10 hrs',
    techCost: 'LCOS $181/MWh at 4 hrs; $166/MWh at 8 hrs (VSUN Energy, Nov 2024)',
    vsLiIon: 'More expensive at 4 hrs; economics converge and improve vs. Li-ion beyond 8–10 hrs',
    keyAdvantage: 'Zero capacity degradation over 20-year lifespan; costs improve as duration scales due to fully decoupled power/energy sizing — Li-ion scales non-linearly and uneconomically beyond 8–10 hrs',
  },
  {
    technology: 'Thermal Energy Storage',
    peakSuitability: 'Long-duration (>8 hrs)',
    liIonCost: '$304/kWh system-level at 4 hrs (BNEF 2024); $300–400/kWh at 10 hrs',
    techCost: '$232/kWh capex (BNEF 2024 global avg); target $25/kWh by 2028 (Fourth Power)',
    vsLiIon: '~0.76× cheaper today at long duration; target ~0.06–0.08× by 2028',
    keyAdvantage: 'Already cheaper than Li-ion at the long-duration benchmark used by BNEF; proven 10–15 hr discharge; bankable like a conventional power plant; mature industrial supply chains; no fire risk',
  },
  {
    technology: 'Iron-Air Batteries',
    peakSuitability: 'Long-duration (>8 hrs, typically 100+ hrs)',
    liIonCost: '$300–400/kWh at 10 hrs; Li-ion unviable beyond this',
    techCost: '~$100/kWh in pilots; target $20/kWh at scale',
    vsLiIon: "~0.25–0.33× cheaper in pilots; target ~$20/kWh would be ~0.05× of Li-ion's 10-hr cost",
    keyAdvantage: 'Only technology designed for 100+ hour multi-day discharge; earth-abundant iron and salt; non-flammable; lowest long-duration cost target of any technology',
  },
  {
    technology: 'Hydrogen Storage',
    peakSuitability: 'Long-duration (multi-day to seasonal)',
    liIonCost: 'Li-ion not viable at this duration',
    techCost: '$200–350/kWh unsubsidized',
    vsLiIon: 'No direct comparison — different duration class entirely',
    keyAdvantage: 'Only technology viable for multi-day to seasonal/strategic reserve storage; leverages O&G infrastructure; can serve as industrial hydrogen feedstock simultaneously',
  },
];
