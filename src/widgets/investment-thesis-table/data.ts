/**
 * @file
 * Default thesis data and signal map for the investment-thesis-table widget.
 *
 * Lifted verbatim from the 2026-05-12 Lovable intake (power-vista-plot) with
 * no value changes. The widget's `config.thesisData` and `config.signalMap`
 * knobs let editors override these defaults; the exports here are the
 * catalog defaults.
 *
 * Notes:
 *   - The signal-map keys must match the `name` field on each
 *     `TechnologyThesis` exactly (the join key is the human-readable
 *     name, including the parenthetical ARL marker). Adding a tech
 *     means adding to both arrays.
 *   - Each `signals` entry pairs an emoji icon with a short label. The
 *     emoji is decorative and is rendered alongside the label; the
 *     widget marks the icon container `aria-hidden="true"` so screen
 *     readers don't read the emoji description verbatim.
 */
export interface TechnologyThesis {
  name: string;
  earlyStage: string;
  lateStage: string;
}

export interface CategoryThesis {
  categoryId: string;
  categoryName: string;
  technologies: TechnologyThesis[];
}

export interface TechSignal {
  emoji: string;
  label: string;
}

export interface TechSignals {
  earlyStage: { signals: TechSignal[]; summary: string };
  lateStage: { signals: TechSignal[]; summary: string };
}

export const defaultThesisData: CategoryThesis[] = [
  {
    categoryId: 'energy-storage',
    categoryName: 'Energy Storage Technologies',
    technologies: [
      {
        name: 'Thermal Energy Storage (ARL 8)',
        earlyStage: "High ARL implies the category itself is already de-risked at a system level. Early-stage investors should assume incumbents and scaled players have a strong first-mover advantage in utility procurement and EPC relationships. Early-stage capital should only back companies with structural differentiation; for example, materially lower LCOS at >10 hour durations, modular designs that reduce siting or permitting friction, or integration advantages with industrial heat or CHP. Incremental improvements are unlikely to survive against scaled players.",
        lateStage: "High ARL makes this a traction-driven category. Late-stage investors should expect multi-project pipelines, repeat utility customers, and demonstrated bankability. Diligence should focus on execution metrics: cost-down trajectory, EPC scalability, project cycle time, and balance-sheet readiness for project finance. Weak traction in a high-ARL category is a red flag rather than a timing issue."
      },
      {
        name: 'Sodium-ion Batteries (ARL 8)',
        earlyStage: "Sodium-ion's high ARL indicates that adoption pathways are opening quickly, driven by large incumbents like CATL. Early-stage VC should avoid \"me-too\" chemistries and instead target materials-level or manufacturing-level disruption (e.g., cathode innovation, energy density uplift, or capex-light production methods) that can meaningfully shift cost or performance not only relative to LFP but also to Na-ion incumbents. The bar for disruption is high, as supply chain and manufacturing advantages already favor large incumbents. However, market is large and growing fast, giving compounding advantage for disruptors.",
        lateStage: "Late-stage VC can underwrite scale-up with confidence if commercial deployments exist. Expect clear evidence of cost competitiveness vs LFP in stationary storage, secured supply chains, and early utility adoption. The focus should be on margin structure, manufacturing yield, and ability to defend position as lithium prices fluctuate. Late-stage sodium-ion investments offer strong exit potential. High adoption readiness and visible commercial traction are driving strategic interest from battery majors, OEMs, and integrators, creating clear acquisition pathways. Companies with cost or performance advantages are also attractive to private equity, given the strong CAGR, scale-up visibility and infrastructure-like market signal."
      },
      {
        name: 'Zinc-based Batteries (ARL 7)',
        earlyStage: "Upper-mid ARL suggests growing adoption but incomplete market lock-in. Pre-seed to Series A investors should back companies that clearly outperform lithium-ion on safety, cycle life, or total cost of ownership; especially in dense urban or fire-restricted deployments. Chemistry or form-factor advantages must translate directly into deployment wins, not just lab performance.",
        lateStage: "For Series B–D, the focus should be on proof of displacement; evidence that zinc systems are replacing Li-ion in safety-critical or regulation-constrained markets. Investors should expect commercial pilots, regulatory pull, and improving gross margins. Defensibility against declining Li-ion prices is essential for underwriting long-term returns."
      },
      {
        name: 'Flow Batteries (ARL 7)',
        earlyStage: "Early-stage investment is viable only if the company uses new materials and novel chemistry that reduce operational and balance-of-plant complexity. Pre-seed to Series A investors should assume long timelines and fund engineering discipline over growth narratives. Vanadium exposure or complex fluid handling without differentiation materially increases risk.",
        lateStage: "Late-stage investors should require long-duration contracts, stable electrolyte sourcing, and multi-year operational performance. Series B–D capital should treat flow batteries as infrastructure-like assets with long lifetimes and predictable cash flows, not fast-scaling product businesses."
      },
      {
        name: 'Flywheels (ARL 7)',
        earlyStage: "Despite strong technical performance, the small addressable market limits venture-scale outcomes. Pre-seed to Series A investors should generally avoid the category, as incumbents can service niche use cases efficiently and battery costs continue to compress flywheel economics.",
        lateStage: "Series B–D investment is rarely justified due to constrained market expansion and high upfront capital costs. Flywheels are better suited for strategic buyers or infrastructure investors rather than venture growth capital."
      },
      {
        name: 'Iron-Air Batteries (ARL 6)',
        earlyStage: "Mid-ARL makes iron-air a classic timing-sensitive early-stage bet. Early-stage investors should either back companies very early (pre-seed, seed), where ARL improvement is expected before commercialization, or avoid the category entirely. Key diligence focus: ability to simplify system architecture, reduce footprint, and improve project deployability. Betting assumes company will capitalize on 20%+ CAGR and that category-level ARL will rise before the company reaches its first scale inflection.",
        lateStage: "Late-stage capital should only enter post–valley of death. Companies must demonstrate first-of-a-kind deployments, reliability data, and credible long-term offtake or capacity contracts. Late-stage investors should underwrite iron-air as a grid reliability asset, not an energy arbitrage play, and avoid funding companies still proving basic bankability. If a company checking all these points has crossed valley of death, it's an excellent opportunity in a highly growing market."
      },
      {
        name: 'Hydrogen Storage (ARL 5)',
        earlyStage: "Low ARL combined with very large market size makes hydrogen storage option-value driven rather than core-portfolio worthy at early stage. Early-stage VC should be patient but opportunistic, selectively spotting and backing technologies that can independently raise adoption readiness, e.g., materially improving round-trip efficiency, modularizing storage, or reducing dependence on bespoke infrastructure. A right bet might be a right entry into a large market at a right time.",
        lateStage: "Late-stage investment is appropriate only under exceptional circumstances: contracted offtake, government-backed infrastructure, or integration with existing industrial hydrogen demand. Capital intensity and infrastructure coupling mean that most hydrogen storage companies remain unsuitable for conventional growth equity without external risk absorption (policy, sovereigns, or balance-sheet sponsors)."
      }
    ]
  },
  {
    categoryId: 'tnd-gets',
    categoryName: 'T&D – Grid Enhancing Technologies',
    technologies: [
      {
        name: 'Advanced Conductors (HTLS) (ARL 9)',
        earlyStage: "Keep the \"incumbent advantage\" lens, but adjust for market timing. The upgrade cycle is long, but the replacement wave (aging grid, reconductoring push, permitting constraints) creates real whitespace even at high ARL. Early-stage VC can back entrants that are better timed and slightly better on metrics utilities care about in a once-per-cycle decision: ampacity uplift per dollar, sag/thermal behavior, install speed, reliability, and warranty profile. More than a chemistry breakthrough, seek low-regret procurement. Prioritize channel strategy (EPCs, utilities, OEM bundles) because distribution is the moat here.",
        lateStage: "Not only \"scale what works\", but \"own the cycle\". Late-stage investors should underwrite companies that have converted the market pull into backlog across multiple utilities and regions. Because this is a long-cycle, large market, low-CAGR category, traction should show up as multi-year framework agreements, repeat reconductoring programs, or preferred vendor status. Diligence should emphasize manufacturing throughput, quality yields, install partner coverage, and working-capital discipline. A high-ARL category still punishes weak commercial execution, but it also rewards entrants that land at the right moment in the replacement supercycle."
      },
      {
        name: 'Dynamic Line Ratings (DLR) (ARL 7)',
        earlyStage: "High CAGR + mid-high ARL creates a window-opening market. Lower capex changes the game: speed and integration win. Early-stage VC should still target cost and performance, but the bigger differentiator is removing adoption friction: accuracy, uptime, cyber posture, fast install, minimal maintenance, and clean integration into EMS/SCADA and planning tools. Focus on teams that can sell well into utilities. Also, look for strategies that align with compliance pull (where DLR is becoming harder to ignore). The CAGR signal says: speed matters; so, companies must build reference corridors and utility case studies early.",
        lateStage: "Late-stage VC should focus on companies with proven PMF in utilities that are culturally and institutionally receptive to DLR. Underwrite expansion within the same utility (miles monitored per customer), renewal rates, and operationalization of DLR insights. The >20% CAGR rewards scale winners, but execution discipline (sales cycle compression, integration cost) is decisive."
      },
      {
        name: 'Grid-forming Inverters (ARL 7)',
        earlyStage: "Mid-high ARL and moderate CAGR indicate a category transitioning from early adoption to standardization. Early-stage VC should back teams aligned with regulatory pull (grid codes, stability mandates) and with defensible performance in weak-grid or high-IBR environments. Differentiation can be algorithmic, but winning requires validation and credibility. Also watch for companies that reduce cost premium without compromising stability.",
        lateStage: "Late-stage VC can underwrite scale once the technology is embedded in OEM or integrator channels. Expect reference projects, repeat orders, and declining integration friction. Exit dynamics are attractive as inverter majors and grid OEMs seek differentiated SKUs rather than greenfield innovation."
      },
      {
        name: 'Power Flow Controllers (FACTS) (ARL 6)',
        earlyStage: "Moderate ARL but low CAGR implies demand exists, yet adoption is constrained by project complexity and lack of standardization. Early-stage VC should avoid funding \"more pilots\" and instead back companies that radically simplify deployment: standardized substation packages, repeatable engineering templates, and reduced planning friction. The venture bet is on making FACTS boring and repeatable.",
        lateStage: "Late-stage investment is justified only if repeatability is already demonstrated. In a <10% CAGR market, growth will not mask execution weaknesses. Underwrite time-to-deploy, utility-to-utility replication, financing structures, and evidence that the solution behaves like infrastructure, not bespoke power engineering."
      },
      {
        name: 'Solid-state Transformers (SST) (ARL 5)',
        earlyStage: "Low ARL combined with a small market size cap venture outcomes. Early-stage investment is justified only in highly selective cases where the technology can expand the addressable market, not merely compete within it. The venture wedge must be performance-driven: materially higher power density, faster response, multifunctionality (conversion, protection, power quality), or native compatibility with emerging paradigms such as DC grids, EV fast-charging hubs, or distributed energy interfaces. Early entry is critical (typically at pre-seed, seed), underwriting that category-level ARL improves by the time commercialization is reached.",
        lateStage: "Late-stage capital is difficult to justify unless the company has already proven category expansion, not just technical viability. Investors should require evidence that deployments are pulling budget from adjacent infrastructure categories rather than competing on transformer replacement alone. Underwrite cost-down visibility, field reliability, and repeatable deployment in at least one non-traditional use case. Absent these signals, SSTs remain better suited to strategic or patient capital than conventional growth equity."
      },
      {
        name: 'Superconducting Grid (ARL 5)',
        earlyStage: "Large market but low ARL means early-stage VC must be wedge-driven, not category-driven. Focus on companies that focus on ultra-dense urban corridors, underground constraints, or right-of-way-limited applications where power density is uniquely monetizable. Early capital should target technologies that offer system-level simplification (cryogenics, installation, operations), not incremental performance.",
        lateStage: "Late-stage VC is appropriate only with external risk absorption (regulated utilities, public capital, or sovereign support). Despite a significant 2030 market, adoption remains conditional. Underwrite contracted projects, public backing, and standardized deployment playbooks. Without these, the category still is a risky bet."
      }
    ]
  }
];

export const defaultSignalMap: Record<string, TechSignals> = {
  'Thermal Energy Storage (ARL 8)': {
    earlyStage: { signals: [{ emoji: '🏗️', label: 'Incumbent advantage' }, { emoji: '🎯', label: 'Structural differentiation required' }], summary: "Only back companies with structural differentiation (lower LCOS at >10hr, modular designs, industrial heat integration). Incremental improvements won't survive." },
    lateStage: { signals: [{ emoji: '💰', label: 'Underwrite with confidence' }, { emoji: '📊', label: 'Traction-driven' }], summary: 'Expect multi-project pipelines, repeat utility customers, demonstrated bankability. Weak traction in high-ARL = red flag.' }
  },
  'Sodium-ion Batteries (ARL 8)': {
    earlyStage: { signals: [{ emoji: '🚀', label: 'Fast adoption' }, { emoji: '⚠️', label: 'Incumbent threat (CATL)' }], summary: 'Avoid "me-too" chemistries. Target materials or manufacturing disruption. Market is large and growing fast, giving compounding advantage.' },
    lateStage: { signals: [{ emoji: '💰', label: 'Underwrite with confidence' }, { emoji: '🚪', label: 'Strong exit pathways' }], summary: 'Expect cost competitiveness vs LFP, secured supply chains. Strong exit potential via acquisition by battery majors, OEMs, integrators, or PE.' }
  },
  'Zinc-based Batteries (ARL 7)': {
    earlyStage: { signals: [{ emoji: '🔓', label: 'Market not locked in' }, { emoji: '🛡️', label: 'Safety differentiation' }], summary: 'Back companies outperforming Li-ion on safety, cycle life, or TCO—especially in fire-restricted deployments. Lab → deployment wins required.' },
    lateStage: { signals: [{ emoji: '⚠️', label: 'Defensibility risk vs Li-ion' }, { emoji: '📋', label: 'Regulatory pull needed' }], summary: 'Focus on proof of displacement: zinc replacing Li-ion in safety-critical markets. Defensibility against declining Li-ion prices is essential.' }
  },
  'Flow Batteries (ARL 7)': {
    earlyStage: { signals: [{ emoji: '⏳', label: 'Long timelines' }, { emoji: '🧪', label: 'Novel chemistry required' }], summary: 'Viable only with new materials/chemistry reducing complexity. Fund engineering discipline over growth narratives. Vanadium exposure increases risk.' },
    lateStage: { signals: [{ emoji: '🏦', label: 'Infrastructure-like asset' }, { emoji: '📄', label: 'Long-duration contracts needed' }], summary: 'Require long-duration contracts, stable electrolyte sourcing, multi-year ops data. Treat as infrastructure with predictable cash flows.' }
  },
  'Flywheels (ARL 7)': {
    earlyStage: { signals: [{ emoji: '🚫', label: 'Limited TAM' }, { emoji: '⚠️', label: 'Generally avoid' }], summary: 'Small addressable market limits venture-scale outcomes. Incumbents efficiently serve niche use cases. Battery cost compression erodes economics.' },
    lateStage: { signals: [{ emoji: '🚫', label: 'Rarely justified' }, { emoji: '🏗️', label: 'Better for strategic buyers' }], summary: 'Constrained market expansion and high capex. Better suited for strategic buyers or infrastructure investors than venture growth capital.' }
  },
  'Iron-Air Batteries (ARL 6)': {
    earlyStage: { signals: [{ emoji: '⏱️', label: 'Timing-sensitive' }, { emoji: '🎲', label: 'Enter early or avoid' }], summary: 'Classic timing bet. Enter at pre-seed/seed or avoid entirely. Focus on system architecture simplification and deployability. Bet on ARL rising before scale.' },
    lateStage: { signals: [{ emoji: '💰', label: 'Post valley-of-death opportunity' }, { emoji: '🔌', label: 'Grid reliability asset' }], summary: 'Only enter post valley-of-death. Require FOAK deployments, reliability data, long-term offtake. Underwrite as grid reliability, not energy arbitrage.' }
  },
  'Hydrogen Storage (ARL 5)': {
    earlyStage: { signals: [{ emoji: '🎰', label: 'Option-value driven' }, { emoji: '⏳', label: 'Patient capital needed' }], summary: 'Large market but low ARL = option-value play. Be patient, selectively back tech improving round-trip efficiency or reducing infrastructure dependency.' },
    lateStage: { signals: [{ emoji: '🏛️', label: 'Needs external risk absorption' }, { emoji: '⚠️', label: 'Exceptional circumstances only' }], summary: 'Appropriate only with contracted offtake, government backing, or industrial hydrogen demand integration. Capital intensity makes most unsuitable for growth equity.' }
  },
  'Advanced Conductors (HTLS) (ARL 9)': {
    earlyStage: { signals: [{ emoji: '🔄', label: 'Replacement supercycle' }, { emoji: '🤝', label: 'Channel strategy is moat' }], summary: 'Upgrade cycle creates whitespace even at high ARL. More than a chemistry breakthrough, seek low-regret procurement. Prioritize channel strategy (EPCs, utilities, OEM bundles).' },
    lateStage: { signals: [{ emoji: '💰', label: 'Underwrite with confidence' }, { emoji: '📋', label: 'Own the cycle' }], summary: 'Expect multi-year framework agreements, repeat programs, preferred vendor status. Diligence: manufacturing throughput, quality yields, install partner coverage.' }
  },
  'Dynamic Line Ratings (DLR) (ARL 7)': {
    earlyStage: { signals: [{ emoji: '🚀', label: 'Fast adoption window' }, { emoji: '🔧', label: 'Integration wins' }], summary: 'High CAGR + mid-high ARL = window opening. Differentiate by removing adoption friction: accuracy, cyber posture, EMS/SCADA integration. Speed matters.' },
    lateStage: { signals: [{ emoji: '📈', label: 'Scale winners rewarded' }, { emoji: '🔄', label: 'Expansion within utilities' }], summary: 'Focus on proven PMF in receptive utilities. Underwrite expansion (miles/customer), renewal rates, operationalization. CAGR rewards scale but execution is decisive.' }
  },
  'Grid-forming Inverters (ARL 7)': {
    earlyStage: { signals: [{ emoji: '📋', label: 'Regulatory pull' }, { emoji: '🔌', label: 'Weak-grid advantage' }], summary: 'Back teams aligned with regulatory mandates and with defensible performance in weak-grid/high-IBR environments. Differentiation can be algorithmic but needs validation.' },
    lateStage: { signals: [{ emoji: '🚪', label: 'Attractive exits' }, { emoji: '🏭', label: 'OEM channel embedding' }], summary: 'Underwrite once embedded in OEM/integrator channels. Expect reference projects, repeat orders, declining integration friction. Inverter majors seek differentiated SKUs.' }
  },
  'Power Flow Controllers (FACTS) (ARL 6)': {
    earlyStage: { signals: [{ emoji: '🔧', label: 'Simplification required' }, { emoji: '📦', label: 'Standardize deployment' }], summary: 'Demand exists but adoption constrained by complexity. Back companies that radically simplify: standardized packages, repeatable engineering, reduced planning friction.' },
    lateStage: { signals: [{ emoji: '⚠️', label: 'Low CAGR exposure' }, { emoji: '🏗️', label: 'Must prove repeatability' }], summary: "Justified only if repeatability demonstrated. <10% CAGR won't mask execution weaknesses. Underwrite time-to-deploy and utility-to-utility replication." }
  },
  'Solid-state Transformers (SST) (ARL 5)': {
    earlyStage: { signals: [{ emoji: '📏', label: 'Small TAM risk' }, { emoji: '🎯', label: 'Must expand TAM' }], summary: 'Low ARL + small market caps outcomes. Justified only if tech expands addressable market (DC grids, EV hubs, distributed energy). Enter at pre-seed/seed.' },
    lateStage: { signals: [{ emoji: '🚫', label: 'Hard to justify' }, { emoji: '🏦', label: 'Better for strategic capital' }], summary: 'Require proof of category expansion, not just technical viability. Must pull budget from adjacent infrastructure categories. Better suited to patient capital.' }
  },
  'Superconducting Grid (ARL 5)': {
    earlyStage: { signals: [{ emoji: '🎯', label: 'Wedge-driven, not category' }, { emoji: '🏙️', label: 'Urban corridor focus' }], summary: 'Must be wedge-driven: ultra-dense urban corridors, underground constraints, right-of-way-limited applications where power density is uniquely monetizable.' },
    lateStage: { signals: [{ emoji: '🏛️', label: 'Needs public/sovereign backing' }, { emoji: '⚠️', label: 'Conditional adoption' }], summary: 'Appropriate only with external risk absorption (regulated utilities, public capital, sovereigns). Require contracted projects and standardized deployment playbooks.' }
  }
};
