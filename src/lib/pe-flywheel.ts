export type PEFlywheelParams = {
  peMacroGapBillion: number;
  targetMarketGenZ: number;
  penetrationPct: number;
  avgUserDepositYr: number;
  pePlacementFeePct: number;
  peCarrySplitPct: number;
  peOutperformancePct: number;
  mgmtFeePct: number;
  viralKFactor: number;
  userRetainedYield: number;
  operatingCostBaseMo: number;
};

export type PEFlywheelYearRow = {
  year: number;
  users: number;
  annualNewCapital: number;
  cumulativeAum: number;
  gapFilledPct: number;
  mgmtFeeRev: number;
  placementFeeRev: number;
  carryRev: number;
  totalRev: number;
  opexCost: number;
  netProfit: number;
  cumUserWealthCreated: number;
};

export type SensitivityCell = {
  peYield: number;
  placementSpread: number;
  netUserYield: number;
  annualRev: number;
  netProfit: number;
};

export type PEFlywheelSummary = {
  finalAum: number;
  finalUsers: number;
  gapFilledPct: number;
  annualRevYr5: number;
  netProfitYr5: number;
  netMarginYr5: number;
  totalUserWealthYr5: number;
  sensitivityMatrix: SensitivityCell[][];
};

export const PE_FLYWHEEL_PRESETS: Record<string, { label: string; desc: string; p: PEFlywheelParams }> = {
  baseCase: {
    label: "Mainstream GenZ Aggregator",
    desc: "1.5% GenZ adoption creating an institutional LP powerhouse with 1.5% placement spread & 15% carry share.",
    p: {
      peMacroGapBillion: 150,
      targetMarketGenZ: 70000000,
      penetrationPct: 1.5,
      avgUserDepositYr: 3000,
      pePlacementFeePct: 1.5,
      peCarrySplitPct: 15,
      peOutperformancePct: 4.0,
      mgmtFeePct: 0.95,
      viralKFactor: 0.35,
      userRetainedYield: 9.8,
      operatingCostBaseMo: 150000,
    },
  },
  institutionalDominance: {
    label: "Institutional LP Powerhouse",
    desc: "Scale to 3% of GenZ retail savings, filling over $10B of PE LP commitments with premium carry share.",
    p: {
      peMacroGapBillion: 150,
      targetMarketGenZ: 70000000,
      penetrationPct: 3.0,
      avgUserDepositYr: 4200,
      pePlacementFeePct: 2.0,
      peCarrySplitPct: 20,
      peOutperformancePct: 5.0,
      mgmtFeePct: 0.95,
      viralKFactor: 0.50,
      userRetainedYield: 11.2,
      operatingCostBaseMo: 250000,
    },
  },
  hyperViral: {
    label: "Viral Robinhood Engine",
    desc: "High viral K-factor (0.75) propelling massive user growth with lean fee spreads.",
    p: {
      peMacroGapBillion: 150,
      targetMarketGenZ: 70000000,
      penetrationPct: 2.2,
      avgUserDepositYr: 2500,
      pePlacementFeePct: 1.0,
      peCarrySplitPct: 12,
      peOutperformancePct: 3.5,
      mgmtFeePct: 0.85,
      viralKFactor: 0.75,
      userRetainedYield: 10.5,
      operatingCostBaseMo: 180000,
    },
  },
};

export const PE_FLYWHEEL_FIELDS: {
  key: keyof PEFlywheelParams;
  label: string;
  min: number;
  max: number;
  step: number;
  group: string;
  hint?: string;
}[] = [
  { key: "peMacroGapBillion", label: "PE Macro LP Deficit ($B)", min: 50, max: 500, step: 25, group: "Macro PE Market Gap", hint: "Estimated annual LP capital shortage facing US private equity funds." },
  { key: "penetrationPct", label: "GenZ Market Penetration (%)", min: 0.2, max: 10.0, step: 0.1, group: "GenZ Aggregation Scale", hint: "Out of 70M GenZ Americans (e.g. 1.5% = 1.05M accounts)." },
  { key: "avgUserDepositYr", label: "Avg Annual Deposit / User ($)", min: 500, max: 12000, step: 250, group: "GenZ Aggregation Scale" },
  { key: "viralKFactor", label: "Viral Referral K-Factor", min: 0.0, max: 1.5, step: 0.05, group: "GenZ Aggregation Scale", hint: "Robinhood achieved K > 0.6 via referral rewards." },

  { key: "pePlacementFeePct", label: "PE Placement / Facilitation Fee (%)", min: 0.5, max: 4.0, step: 0.1, group: "Breadbox PE Economics", hint: "Fee paid by PE managers for institutional LP capital allocation." },
  { key: "peCarrySplitPct", label: "Breadbox Carry Share (%)", min: 5, max: 30, step: 1, group: "Breadbox PE Economics", hint: "% share of GP carry performance fee captured by Breadbox." },
  { key: "peOutperformancePct", label: "PE Outperformance Over Hurdle (%)", min: 1.0, max: 10.0, step: 0.5, group: "Breadbox PE Economics" },
  { key: "mgmtFeePct", label: "Annual Management Fee (%)", min: 0.5, max: 2.0, step: 0.05, group: "Breadbox PE Economics" },

  { key: "userRetainedYield", label: "Net GenZ Yield Delivered (%)", min: 5.0, max: 18.0, step: 0.5, group: "User Yield & Opex" },
  { key: "operatingCostBaseMo", label: "Monthly Mgmt Co Opex ($)", min: 50000, max: 1000000, step: 25000, group: "User Yield & Opex" },
];

export function simulatePEFlywheel(p: PEFlywheelParams): { rows: PEFlywheelYearRow[]; summary: PEFlywheelSummary } {
  const targetUsersYr5 = (p.targetMarketGenZ * (p.penetrationPct / 100));
  const rows: PEFlywheelYearRow[] = [];

  let cumAum = 0;
  let cumUserWealth = 0;

  for (let yr = 1; yr <= 5; yr++) {
    // Ramp users dynamically based on viral coefficient
    const rampFactor = Math.pow(yr / 5, 1.8) * (1 + p.viralKFactor * 0.3 * yr);
    const yearUsers = Math.round(targetUsersYr5 * Math.min(1.2, rampFactor));

    const annualNewCapital = yearUsers * p.avgUserDepositYr;
    
    // AUM growth from new capital + yield delivered
    const yieldGrowth = cumAum * (p.userRetainedYield / 100);
    cumAum = cumAum + annualNewCapital + yieldGrowth;
    cumUserWealth += yieldGrowth;

    const gapFilledPct = Math.min(100, (cumAum / (p.peMacroGapBillion * 1e9)) * 100);

    const mgmtFeeRev = cumAum * (p.mgmtFeePct / 100);
    const placementFeeRev = annualNewCapital * (p.pePlacementFeePct / 100);
    const carryRev = cumAum * (p.peOutperformancePct / 100) * (p.peCarrySplitPct / 100);
    const totalRev = mgmtFeeRev + placementFeeRev + carryRev;

    const opexCost = p.operatingCostBaseMo * 12 * (1 + 0.25 * (yr - 1));
    const netProfit = totalRev - opexCost;

    rows.push({
      year: yr,
      users: yearUsers,
      annualNewCapital,
      cumulativeAum: cumAum,
      gapFilledPct,
      mgmtFeeRev,
      placementFeeRev,
      carryRev,
      totalRev,
      opexCost,
      netProfit,
      cumUserWealthCreated: cumUserWealth,
    });
  }

  const yr5 = rows[4] || rows[rows.length - 1];
  const netMarginYr5 = yr5.totalRev > 0 ? (yr5.netProfit / yr5.totalRev) * 100 : 0;

  // Generate 5x5 Sensitivity Matrix (PE Yield vs Placement Fee)
  const peYieldSteps = [8.0, 10.0, 12.0, 14.0, 16.0];
  const placementSteps = [0.75, 1.25, 1.75, 2.25, 2.75];

  const sensitivityMatrix: SensitivityCell[][] = peYieldSteps.map((peY) =>
    placementSteps.map((plSpread) => {
      const netUserY = peY - p.mgmtFeePct - plSpread;
      const testAum = yr5.cumulativeAum;
      const testNewCap = yr5.annualNewCapital;

      const mRev = testAum * (p.mgmtFeePct / 100);
      const pRev = testNewCap * (plSpread / 100);
      const cRev = testAum * Math.max(0, peY - 8.0) / 100 * (p.peCarrySplitPct / 100);
      const rev = mRev + pRev + cRev;
      const prof = rev - yr5.opexCost;

      return {
        peYield: peY,
        placementSpread: plSpread,
        netUserYield: Math.max(0, netUserY),
        annualRev: rev,
        netProfit: prof,
      };
    })
  );

  const summary: PEFlywheelSummary = {
    finalAum: yr5.cumulativeAum,
    finalUsers: yr5.users,
    gapFilledPct: yr5.gapFilledPct,
    annualRevYr5: yr5.totalRev,
    netProfitYr5: yr5.netProfit,
    netMarginYr5,
    totalUserWealthYr5: yr5.cumUserWealthCreated,
    sensitivityMatrix,
  };

  return { rows, summary };
}
