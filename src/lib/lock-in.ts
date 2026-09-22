export type LockInParams = {
  users: number;
  monthlyContrib: number;
  userGrowthMo: number;
  lock3yr: number;
  lock5yr: number;
  lock10yr: number;
  lock20yr: number;
  peNetYield: number;
  publicYield: number;
  earlyRedemptionRate: number;
  earlyRedemptionPenalty: number;
  breadboxSpread: number;
  horizonYears: number;
};

export type LockInRow = {
  m: number;
  year: number;
  users: number;
  monthlyDeposits: number;
  totalAum: number;
  locked3y: number;
  locked5y: number;
  locked10y: number;
  locked20y: number;
  unlockingNext12m: number;
  stickyRatio: number;
  publicAum: number;
  peYieldAdded: number;
  breadboxRevMo: number;
};

export type LockInSummary = {
  finalAum: number;
  publicAumComparison: number;
  userWealthSurplus: number;
  userWealthSurplusPct: number;
  weightedAvgLockYears: number;
  stickyCapitalRatio: number;
  peAllocations: {
    privateCredit: number;
    buyouts: number;
    realAssets: number;
    growthEquity: number;
  };
  totalBreadboxAnnualRev: number;
  totalPEGapFilled: number;
};

export const LOCK_IN_PRESETS: Record<string, { label: string; desc: string; p: LockInParams }> = {
  genzDefault: {
    label: "GenZ Pension Standard",
    desc: "Balanced 3–20 year time-lock mix yielding 12% PE return vs 7.5% public stocks.",
    p: {
      users: 50000,
      monthlyContrib: 250,
      userGrowthMo: 3.5,
      lock3yr: 20,
      lock5yr: 40,
      lock10yr: 30,
      lock20yr: 10,
      peNetYield: 12.0,
      publicYield: 7.5,
      earlyRedemptionRate: 2.0,
      earlyRedemptionPenalty: 10.0,
      breadboxSpread: 1.25,
      horizonYears: 10,
    },
  },
  institutionalPE: {
    label: "Long-Duration PE Vault",
    desc: "Maximized 10–20 year commitments providing PE funds with ultra-sticky LP capital.",
    p: {
      users: 100000,
      monthlyContrib: 350,
      userGrowthMo: 4.0,
      lock3yr: 10,
      lock5yr: 30,
      lock10yr: 40,
      lock20yr: 20,
      peNetYield: 13.5,
      publicYield: 7.5,
      earlyRedemptionRate: 1.0,
      earlyRedemptionPenalty: 12.0,
      breadboxSpread: 1.5,
      horizonYears: 10,
    },
  },
  privateCredit: {
    label: "Private Credit Income",
    desc: "Shorter 3–5 year lockups feeding private credit & direct lending for faster liquidity rotation.",
    p: {
      users: 75000,
      monthlyContrib: 200,
      userGrowthMo: 3.0,
      lock3yr: 45,
      lock5yr: 40,
      lock10yr: 15,
      lock20yr: 0,
      peNetYield: 10.5,
      publicYield: 7.5,
      earlyRedemptionRate: 3.0,
      earlyRedemptionPenalty: 8.0,
      breadboxSpread: 1.1,
      horizonYears: 10,
    },
  },
};

export const LOCK_IN_FIELDS: {
  key: keyof LockInParams;
  label: string;
  min: number;
  max: number;
  step: number;
  group: string;
  hint?: string;
}[] = [
  { key: "users", label: "Initial GenZ accounts", min: 10000, max: 1000000, step: 10000, group: "GenZ Capital Pool" },
  { key: "monthlyContrib", label: "Monthly contribution / user ($)", min: 50, max: 1000, step: 25, group: "GenZ Capital Pool" },
  { key: "userGrowthMo", label: "Monthly user growth (%)", min: 0.5, max: 10, step: 0.5, group: "GenZ Capital Pool" },
  
  { key: "lock3yr", label: "3-Year Lockup share (%)", min: 0, max: 100, step: 5, group: "Time-Based Lock Duration" },
  { key: "lock5yr", label: "5-Year Lockup share (%)", min: 0, max: 100, step: 5, group: "Time-Based Lock Duration" },
  { key: "lock10yr", label: "10-Year Lockup share (%)", min: 0, max: 100, step: 5, group: "Time-Based Lock Duration" },
  { key: "lock20yr", label: "20-Year Lockup share (%)", min: 0, max: 100, step: 5, group: "Time-Based Lock Duration" },

  { key: "peNetYield", label: "Private Asset Net Annual Return (%)", min: 6.0, max: 20.0, step: 0.5, group: "PE Returns & Spread", hint: "Private Equity & Private Credit target 11–14% net." },
  { key: "publicYield", label: "Traditional 401(k) Benchmark (%)", min: 4.0, max: 12.0, step: 0.5, group: "PE Returns & Spread", hint: "S&P 500 historical average ~7.5% net of fees." },
  { key: "breadboxSpread", label: "Breadbox LP Spread / Carry (%)", min: 0.5, max: 3.0, step: 0.1, group: "PE Returns & Spread", hint: "Margin captured by Breadbox as institutional LP provider." },

  { key: "earlyRedemptionRate", label: "Early exit requests (% of AUM / yr)", min: 0.5, max: 10, step: 0.5, group: "Liquidity Guardrails" },
  { key: "earlyRedemptionPenalty", label: "Early exit penalty haircut (%)", min: 0, max: 20, step: 1, group: "Liquidity Guardrails", hint: "Penalty charged on un-matured early withdrawals." },
  { key: "horizonYears", label: "Simulation Horizon (Years)", min: 3, max: 20, step: 1, group: "Target & Horizon" },
];

export function simulateLockIn(p: LockInParams): { rows: LockInRow[]; summary: LockInSummary } {
  // Normalize lockup weights so they total 100%
  const totalWeight = (p.lock3yr + p.lock5yr + p.lock10yr + p.lock20yr) || 100;
  const w3 = p.lock3yr / totalWeight;
  const w5 = p.lock5yr / totalWeight;
  const w10 = p.lock10yr / totalWeight;
  const w20 = p.lock20yr / totalWeight;

  const totalMonths = p.horizonYears * 12;
  const rows: LockInRow[] = [];

  let currentUsers = p.users;
  let totalAum = 0;
  let publicAum = 0;

  // Track deposit tranches added each month
  const tranches3y: number[] = new Array(totalMonths + 1).fill(0);
  const tranches5y: number[] = new Array(totalMonths + 1).fill(0);
  const tranches10y: number[] = new Array(totalMonths + 1).fill(0);
  const tranches20y: number[] = new Array(totalMonths + 1).fill(0);

  const peMonthlyRate = Math.pow(1 + p.peNetYield / 100, 1 / 12) - 1;
  const publicMonthlyRate = Math.pow(1 + p.publicYield / 100, 1 / 12) - 1;
  const earlyRedeemMoRate = p.earlyRedemptionRate / 100 / 12;
  const spreadMoRate = p.breadboxSpread / 100 / 12;

  for (let m = 1; m <= totalMonths; m++) {
    const year = Math.ceil(m / 12);
    // User growth
    if (m > 1) {
      currentUsers *= 1 + p.userGrowthMo / 100;
    }

    const monthlyDeposits = currentUsers * p.monthlyContrib;

    // Distribute monthly deposits across tranches
    tranches3y[m] = monthlyDeposits * w3;
    tranches5y[m] = monthlyDeposits * w5;
    tranches10y[m] = monthlyDeposits * w10;
    tranches20y[m] = monthlyDeposits * w20;

    // Grow existing AUM with PE net yield minus early redemptions & spread
    const grossPeGrowth = totalAum * peMonthlyRate;
    const earlyRedeemVal = totalAum * earlyRedeemMoRate;
    const netRedeemVal = earlyRedeemVal * (1 - p.earlyRedemptionPenalty / 100);
    const breadboxSpreadRev = totalAum * spreadMoRate + earlyRedeemVal * (p.earlyRedemptionPenalty / 100);

    totalAum = totalAum + monthlyDeposits + grossPeGrowth - netRedeemVal - breadboxSpreadRev;

    // Grow public benchmark 401(k)
    publicAum = publicAum + monthlyDeposits + publicAum * publicMonthlyRate;

    // Calculate active locked capital per bucket based on elapsed time vs duration
    let l3 = 0, l5 = 0, l10 = 0, l20 = 0;
    let unlockingNext12m = 0;

    for (let t = 1; t <= m; t++) {
      const ageMo = m - t;
      const tAum3 = tranches3y[t] * Math.pow(1 + peMonthlyRate, ageMo);
      const tAum5 = tranches5y[t] * Math.pow(1 + peMonthlyRate, ageMo);
      const tAum10 = tranches10y[t] * Math.pow(1 + peMonthlyRate, ageMo);
      const tAum20 = tranches20y[t] * Math.pow(1 + peMonthlyRate, ageMo);

      if (ageMo < 36) {
        l3 += tAum3;
        if (36 - ageMo <= 12) unlockingNext12m += tAum3;
      }
      if (ageMo < 60) {
        l5 += tAum5;
        if (60 - ageMo <= 12) unlockingNext12m += tAum5;
      }
      if (ageMo < 120) {
        l10 += tAum10;
        if (120 - ageMo <= 12) unlockingNext12m += tAum10;
      }
      if (ageMo < 240) {
        l20 += tAum20;
        if (240 - ageMo <= 12) unlockingNext12m += tAum20;
      }
    }

    const stickyRatio = totalAum > 0 ? ((totalAum - unlockingNext12m) / totalAum) * 100 : 100;

    rows.push({
      m,
      year,
      users: Math.round(currentUsers),
      monthlyDeposits,
      totalAum: Math.max(0, totalAum),
      locked3y: Math.max(0, l3),
      locked5y: Math.max(0, l5),
      locked10y: Math.max(0, l10),
      locked20y: Math.max(0, l20),
      unlockingNext12m: Math.max(0, unlockingNext12m),
      stickyRatio: Math.min(100, Math.max(0, stickyRatio)),
      publicAum: Math.max(0, publicAum),
      peYieldAdded: grossPeGrowth,
      breadboxRevMo: breadboxSpreadRev,
    });
  }

  const finalRow = rows[rows.length - 1];
  const finalAum = finalRow ? finalRow.totalAum : 0;
  const finalPublic = finalRow ? finalRow.publicAum : 0;
  const userWealthSurplus = finalAum - finalPublic;
  const userWealthSurplusPct = finalPublic > 0 ? (userWealthSurplus / finalPublic) * 100 : 0;

  const weightedAvgLockYears = w3 * 3 + w5 * 5 + w10 * 10 + w20 * 20;
  const totalBreadboxAnnualRev = finalAum * (p.breadboxSpread / 100);

  // Allocation to PE partner funds
  const peAllocations = {
    privateCredit: finalAum * 0.35,
    buyouts: finalAum * 0.35,
    realAssets: finalAum * 0.15,
    growthEquity: finalAum * 0.15,
  };

  const summary: LockInSummary = {
    finalAum,
    publicAumComparison: finalPublic,
    userWealthSurplus,
    userWealthSurplusPct,
    weightedAvgLockYears,
    stickyCapitalRatio: finalRow ? finalRow.stickyRatio : 95,
    peAllocations,
    totalBreadboxAnnualRev,
    totalPEGapFilled: finalAum,
  };

  return { rows, summary };
}
