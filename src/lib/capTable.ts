/**
 * Pure, framework-free cap table modeling module.
 * Typed inputs and outputs for capitalization, option pool shuffle, SAFE conversion, and liquidation waterfall.
 */

export interface Founder {
  id: string;
  name: string;
  shares: number;
  ownershipPercent?: number; // Used when in percent input mode
  vestingYears: number; // default 4
  cliffMonths: number; // default 12
  startDate: string; // ISO date YYYY-MM-DD
}

export type RoundType = "safe" | "priced";
export type PoolTiming = "pre-money" | "post-money";

export interface SafeRound {
  id: string;
  type: "safe";
  name: string; // e.g. "Pre-seed"
  amount: number; // e.g. 500,000
  valuationCap: number; // e.g. 8,000,000
  discountPercent: number; // 0 to 100, e.g. 0 or 20
}

export interface PricedRound {
  id: string;
  type: "priced";
  name: string; // e.g. "Seed"
  amount: number; // e.g. 3,000,000
  valuationMode: "pre" | "post";
  preMoneyValuation: number; // e.g. 12,000,000
  postMoneyValuation: number; // e.g. 15,000,000
  poolTargetPercent: number; // e.g. 10 (10%)
  poolTiming: PoolTiming; // "pre-money" | "post-money"
}

export type Round = SafeRound | PricedRound;

export interface CompanyConfig {
  authorizedShares: number; // default 10,000,000
  parValue: number; // default 0.0001
  grantedPoolShares: number; // options granted so far (default 0)
}

export interface ExitConfig {
  exitValues: number[]; // default [25M, 50M, 100M, 250M, 500M, 1B]
  founderVestingMode: "fully_vested" | "as_of_date";
  asOfDate: string; // ISO date YYYY-MM-DD
}

export interface CapTableConfig {
  company: CompanyConfig;
  founders: Founder[];
  founderInputMode: "shares" | "percent";
  rounds: Round[];
  exit: ExitConfig;
}

// Stage output types
export interface HolderCell {
  holderId: string;
  holderName: string;
  category: "founder" | "pool" | "safe" | "investor";
  shares: number;
  ownershipPercent: number; // 0 to 100
  dilutionFromPriorPercent?: number; // e.g. -12.1%
  isPendingSafe?: boolean;
  note?: string;
}

export interface CapTableStage {
  stageId: string;
  stageName: string;
  roundType?: RoundType;
  totalShares: number;
  cells: Record<string, HolderCell>; // keyed by holderId
  sharesIssuedThisRound: number;
  pricePerShare?: number;
  preMoneyValuation?: number;
  postMoneyValuation?: number;
  effectivePreMoneyValuation?: number;
  poolShuffleImpactDollars?: number;
  poolShuffleImpactPercent?: number;
}

export interface RoundSummary {
  roundId: string;
  roundName: string;
  roundType: RoundType;
  amountRaised: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  pricePerShare: number;
  newSharesIssued: number;
  roundOwnershipPercent: number;
  effectivePreMoneyValuation: number;
  poolShuffleImpactDollars: number;
  poolTiming: PoolTiming;
  poolTargetPercent: number;
  safeNotes?: string[];
}

export interface HolderExitProceeds {
  holderId: string;
  holderName: string;
  category: "founder" | "pool" | "investor";
  proceeds: number;
  moic?: number; // for investors: proceeds / amountInvested
  impliedPricePerShare?: number; // for founders
  vestedProceeds?: number; // for founders under vesting
  unvestedProceeds?: number; // for founders under vesting
  tookLiquidationPreference?: boolean;
}

export interface ExitScenarioRow {
  exitValue: number;
  holders: Record<string, HolderExitProceeds>;
  totalProceedsDistributed: number;
}

export interface SanityCheck {
  totalIssued: number;
  authorized: number;
  isAuthorizedExceeded: boolean;
  sharesToAuthorize: number;
  stageSums100: { stageName: string; sum: number; is100: boolean }[];
  founderProgressionText: string[];
}

export interface CapTableResult {
  stages: CapTableStage[];
  roundSummaries: RoundSummary[];
  exitTable: ExitScenarioRow[];
  sanity: SanityCheck;
  currentPostMoneyShares: number;
  currentTotalPoolShares: number;
  unallocatedPoolShares: number;
  grantedPoolShares: number;
}

/** Default model configurations */
export const DEFAULT_CONFIG: CapTableConfig = {
  company: {
    authorizedShares: 10_000_000,
    parValue: 0.0001,
    grantedPoolShares: 0,
  },
  founders: [
    {
      id: "f-ej",
      name: "Ej",
      shares: 4_000_000,
      vestingYears: 4,
      cliffMonths: 12,
      startDate: "2024-01-01",
    },
    {
      id: "f-chris",
      name: "Chris",
      shares: 4_000_000,
      vestingYears: 4,
      cliffMonths: 12,
      startDate: "2024-01-01",
    },
  ],
  founderInputMode: "shares",
  rounds: [
    {
      id: "r-preseed-safe",
      type: "safe",
      name: "Pre-seed SAFE",
      amount: 500_000,
      valuationCap: 8_000_000,
      discountPercent: 0,
    },
    {
      id: "r-seed",
      type: "priced",
      name: "Seed",
      amount: 3_000_000,
      valuationMode: "pre",
      preMoneyValuation: 12_000_000,
      postMoneyValuation: 15_000_000,
      poolTargetPercent: 10,
      poolTiming: "pre-money",
    },
  ],
  exit: {
    exitValues: [25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 1_000_000_000],
    founderVestingMode: "fully_vested",
    asOfDate: new Date().toISOString().slice(0, 10),
  },
};

/**
 * Glossary of terms with exact plain-sentence definitions.
 */
export const GLOSSARY: Record<string, string> = {
  "pre-money": "The agreed valuation of the company immediately before receiving new cash in this round.",
  "post-money": "The total company valuation immediately after the round closes, equal to pre-money plus cash raised.",
  "fully diluted": "The total share count assuming all stock options, warrants, and convertible securities are fully exercised.",
  "option pool shuffle": "The investor practice of creating the employee option pool out of pre-money valuation, shifting 100% of the dilution onto existing founders.",
  "MOIC": "Multiple on Invested Capital: total exit proceeds received divided by initial cash invested.",
  "liquidation preference": "A contractual guarantee that preferred investors recover their original investment (or a multiple) before common shareholders receive any exit proceeds.",
  "par value": "The nominal accounting value per share, used to calculate the founders' initial cash purchase price.",
  "valuation cap": "The maximum effective company valuation at which a SAFE converts into preferred shares at the next priced round.",
};

/**
 * Calculate founder vesting progress as of a specific date.
 */
export function calculateVesting(
  totalShares: number,
  vestingYears: number,
  cliffMonths: number,
  startDateStr: string,
  asOfDateStr: string
): { vestedShares: number; unvestedShares: number; vestedPercent: number } {
  if (vestingYears <= 0) return { vestedShares: totalShares, unvestedShares: 0, vestedPercent: 1 };
  const start = new Date(startDateStr);
  const asOf = new Date(asOfDateStr);

  if (isNaN(start.getTime()) || isNaN(asOf.getTime()) || asOf < start) {
    return { vestedShares: 0, unvestedShares: totalShares, vestedPercent: 0 };
  }

  // Calculate elapsed months with fractional precision based on calendar days
  const yearsDiff = asOf.getFullYear() - start.getFullYear();
  const monthsDiff = asOf.getMonth() - start.getMonth();
  const daysDiff = asOf.getDate() - start.getDate();
  const totalMonths = yearsDiff * 12 + monthsDiff + (daysDiff >= 0 ? daysDiff / 30.4375 : -((start.getDate() - asOf.getDate()) / 30.4375));

  if (totalMonths < cliffMonths) {
    return { vestedShares: 0, unvestedShares: totalShares, vestedPercent: 0 };
  }

  const totalVestingMonths = vestingYears * 12;
  const vestedPercent = Math.min(1, Math.max(0, totalMonths / totalVestingMonths));
  const vestedShares = Math.round(totalShares * vestedPercent);
  const unvestedShares = Math.max(0, totalShares - vestedShares);

  return { vestedShares, unvestedShares, vestedPercent };
}

/**
 * Main pure computation function for cap table modeling.
 */
export function calculateCapTable(config: CapTableConfig): CapTableResult {
  const { company, founders, rounds, exit } = config;

  // 1. Formation Stage
  const formationShares = founders.reduce((sum, f) => sum + (f.shares || 0), 0);
  const stages: CapTableStage[] = [];
  const roundSummaries: RoundSummary[] = [];

  const formationCells: Record<string, HolderCell> = {};
  for (const f of founders) {
    const pct = formationShares > 0 ? (f.shares / formationShares) * 100 : 0;
    formationCells[f.id] = {
      holderId: f.id,
      holderName: f.name,
      category: "founder",
      shares: f.shares,
      ownershipPercent: pct,
    };
  }

  // Initial Option Pool is 0 at formation
  formationCells["pool"] = {
    holderId: "pool",
    holderName: "Option Pool",
    category: "pool",
    shares: 0,
    ownershipPercent: 0,
  };

  stages.push({
    stageId: "formation",
    stageName: "Formation",
    totalShares: formationShares,
    cells: formationCells,
    sharesIssuedThisRound: formationShares,
    preMoneyValuation: formationShares * company.parValue,
    postMoneyValuation: formationShares * company.parValue,
    effectivePreMoneyValuation: formationShares * company.parValue,
  });

  // Track holders across stages
  // holderId -> shares count at the start of current stage
  const currentSharesByHolder: Record<string, number> = {};
  for (const f of founders) {
    currentSharesByHolder[f.id] = f.shares;
  }
  currentSharesByHolder["pool"] = 0;

  // Unconverted SAFEs queue
  let pendingSafes: SafeRound[] = [];

  for (let rIndex = 0; rIndex < rounds.length; rIndex++) {
    const round = rounds[rIndex];
    const prevStage = stages[stages.length - 1];

    if (round.type === "safe") {
      // SAFE Round: Does not convert until the next priced round
      pendingSafes.push(round);

      const stageCells: Record<string, HolderCell> = {};
      const currentTotalShares = Object.values(currentSharesByHolder).reduce((a, b) => a + b, 0);

      // Existing holders keep their shares
      for (const [holderId, shares] of Object.entries(currentSharesByHolder)) {
        const prevPct = prevStage.cells[holderId]?.ownershipPercent ?? 0;
        const currentPct = currentTotalShares > 0 ? (shares / currentTotalShares) * 100 : 0;
        const holderName = prevStage.cells[holderId]?.holderName || holderId;
        const category = prevStage.cells[holderId]?.category || "founder";

        stageCells[holderId] = {
          holderId,
          holderName,
          category,
          shares,
          ownershipPercent: currentPct,
          dilutionFromPriorPercent: currentPct - prevPct,
        };
      }

      // Add SAFE line note
      stageCells[round.id] = {
        holderId: round.id,
        holderName: round.name,
        category: "safe",
        shares: 0,
        ownershipPercent: 0,
        isPendingSafe: true,
        note: `$${(round.amount).toLocaleString()} SAFE ($${(round.valuationCap).toLocaleString()} cap${round.discountPercent > 0 ? `, ${round.discountPercent}% discount` : ""})`,
      };

      stages.push({
        stageId: round.id,
        stageName: round.name,
        roundType: "safe",
        totalShares: currentTotalShares,
        cells: stageCells,
        sharesIssuedThisRound: 0,
        preMoneyValuation: round.valuationCap,
        postMoneyValuation: round.valuationCap + round.amount,
      });

    } else {
      // PRICED ROUND
      // 1. Calculate valuations
      const amount = round.amount || 0;
      let preVal = round.preMoneyValuation || 0;
      let postVal = round.postMoneyValuation || (preVal + amount);

      if (round.valuationMode === "post") {
        postVal = round.postMoneyValuation || 0;
        preVal = Math.max(0, postVal - amount);
      } else {
        postVal = preVal + amount;
      }

      const poolTargetPct = (round.poolTargetPercent || 0) / 100;
      const isPreMoneyPool = round.poolTiming === "pre-money";

      // Shares existing before this priced round (excluding pending SAFEs, which convert now)
      // Founder shares + already existing pool shares
      const existingCommonShares = Object.entries(currentSharesByHolder)
        .filter(([id]) => id !== "pool" || currentSharesByHolder[id] > 0)
        .reduce((sum, [, s]) => sum + s, 0);

      // Converting SAFEs calculation
      // Under YC Post-Money SAFE:
      // SAFE holder ownership of pre-financing capitalization = amount / cap.
      // In post-money terms relative to postVal:
      // w_cap_k = (amount / cap) * (preVal / postVal)
      // w_disc_k = amount / (postVal * (1 - discount))
      // Investor takes max(w_cap, w_disc) (which corresponds to min price per share)
      const convertingSafesData: {
        safe: SafeRound;
        weight: number;
        mode: "cap" | "discount";
        capPriceFraction: number;
        discountPriceFraction: number;
      }[] = [];

      for (const s of pendingSafes) {
        const cap = s.valuationCap > 0 ? s.valuationCap : postVal;
        const discountFrac = s.discountPercent > 0 ? (1 - s.discountPercent / 100) : 1;

        // Cap weight: fraction of total post-money shares
        const wCap = postVal > 0 && cap > 0 ? (s.amount / cap) * (preVal / postVal) : 0;
        // Discount weight
        const wDisc = postVal > 0 && discountFrac > 0 ? s.amount / (postVal * discountFrac) : 0;

        const useDiscount = wDisc > wCap && s.discountPercent > 0;
        const weight = useDiscount ? wDisc : wCap;

        convertingSafesData.push({
          safe: s,
          weight,
          mode: useDiscount ? "discount" : "cap",
          capPriceFraction: wCap,
          discountPriceFraction: wDisc,
        });
      }

      const totalSafeWeight = convertingSafesData.reduce((sum, d) => sum + d.weight, 0);
      const investorWeight = postVal > 0 ? amount / postVal : 0;

      let postRoundTotalShares = 0;
      let newPoolShares = 0;
      let newInvestorShares = 0;
      const safeSharesMap: Record<string, number> = {};

      if (isPreMoneyPool) {
        // Pre-money pool: pool is created out of pre-money valuation (dilutes founders & previous common)
        // S_post = S_existing / (1 - investorWeight - poolTargetPct - totalSafeWeight)
        const denominator = 1 - investorWeight - poolTargetPct - totalSafeWeight;
        if (denominator > 0.0001) {
          postRoundTotalShares = existingCommonShares / denominator;
        } else {
          postRoundTotalShares = existingCommonShares * 2; // fallback protection against extreme inputs
        }

        newPoolShares = Math.round(postRoundTotalShares * poolTargetPct);
        newInvestorShares = Math.round(postRoundTotalShares * investorWeight);

        for (const d of convertingSafesData) {
          safeSharesMap[d.safe.id] = Math.round(postRoundTotalShares * d.weight);
        }
      } else {
        // Post-money pool: pool is created on post-money (dilutes new investor and founders equally)
        // 1. Priced round without pool:
        const prePoolDenom = 1 - investorWeight - totalSafeWeight;
        const prePoolShares = prePoolDenom > 0.0001 ? existingCommonShares / prePoolDenom : existingCommonShares * 1.5;
        // 2. Add pool on top:
        postRoundTotalShares = poolTargetPct < 1 ? prePoolShares / (1 - poolTargetPct) : prePoolShares;

        newPoolShares = Math.round(postRoundTotalShares * poolTargetPct);
        newInvestorShares = Math.round(prePoolShares * investorWeight);

        for (const d of convertingSafesData) {
          safeSharesMap[d.safe.id] = Math.round(prePoolShares * d.weight);
        }
      }

      // Exact round share price
      const roundPrice = postRoundTotalShares > 0 ? postVal / postRoundTotalShares : 0;

      // Calculate Option Pool Shuffle impact:
      // What would founder ownership be if pool was post-money instead of pre-money?
      const prePoolDenomBaseline = 1 - investorWeight - totalSafeWeight;
      const baselinePrePoolShares = prePoolDenomBaseline > 0.0001 ? existingCommonShares / prePoolDenomBaseline : existingCommonShares;
      const postMoneyPoolTotalShares = poolTargetPct < 1 ? baselinePrePoolShares / (1 - poolTargetPct) : baselinePrePoolShares;
      const founderSharesTotal = founders.reduce((sum, f) => sum + (f.shares || 0), 0);

      const founderPctUnderPre = postRoundTotalShares > 0 ? (founderSharesTotal / postRoundTotalShares) * 100 : 0;
      const founderPctUnderPost = postMoneyPoolTotalShares > 0 ? (founderSharesTotal / postMoneyPoolTotalShares) * 100 : 0;

      // Effective Pre-Money Valuation:
      // What founders' equity is actually valued at under the deal price per share
      const effectivePreMoney = roundPrice * existingCommonShares;
      const poolShuffleDollars = Math.max(0, preVal - effectivePreMoney);
      const poolShufflePercent = Math.max(0, founderPctUnderPost - founderPctUnderPre);

      // Build stage cells
      const stageCells: Record<string, HolderCell> = {};

      // 1. Founders
      for (const f of founders) {
        const prevPct = prevStage.cells[f.id]?.ownershipPercent ?? 0;
        const currentPct = postRoundTotalShares > 0 ? (f.shares / postRoundTotalShares) * 100 : 0;
        stageCells[f.id] = {
          holderId: f.id,
          holderName: f.name,
          category: "founder",
          shares: f.shares,
          ownershipPercent: currentPct,
          dilutionFromPriorPercent: currentPct - prevPct,
        };
        currentSharesByHolder[f.id] = f.shares;
      }

      // 2. Option Pool
      const poolPct = postRoundTotalShares > 0 ? (newPoolShares / postRoundTotalShares) * 100 : 0;
      const prevPoolPct = prevStage.cells["pool"]?.ownershipPercent ?? 0;
      stageCells["pool"] = {
        holderId: "pool",
        holderName: "Option Pool",
        category: "pool",
        shares: newPoolShares,
        ownershipPercent: poolPct,
        dilutionFromPriorPercent: poolPct - prevPoolPct,
      };
      currentSharesByHolder["pool"] = newPoolShares;

      // 3. Converted SAFEs
      for (const d of convertingSafesData) {
        const sShares = safeSharesMap[d.safe.id] || 0;
        const sPct = postRoundTotalShares > 0 ? (sShares / postRoundTotalShares) * 100 : 0;
        const sPrice = sShares > 0 ? d.safe.amount / sShares : 0;

        stageCells[d.safe.id] = {
          holderId: d.safe.id,
          holderName: d.safe.name,
          category: "investor",
          shares: sShares,
          ownershipPercent: sPct,
          note: `Converted at $${sPrice.toFixed(4)}/sh (${d.mode === "discount" ? `${d.safe.discountPercent}% discount` : `$${d.safe.valuationCap.toLocaleString()} cap`})`,
        };
        currentSharesByHolder[d.safe.id] = sShares;
      }

      // Clear converted SAFEs from pending
      pendingSafes = [];

      // 4. New Priced Investor
      const investorPct = postRoundTotalShares > 0 ? (newInvestorShares / postRoundTotalShares) * 100 : 0;
      stageCells[round.id] = {
        holderId: round.id,
        holderName: `${round.name} Investor`,
        category: "investor",
        shares: newInvestorShares,
        ownershipPercent: investorPct,
      };
      currentSharesByHolder[round.id] = newInvestorShares;

      stages.push({
        stageId: round.id,
        stageName: round.name,
        roundType: "priced",
        totalShares: postRoundTotalShares,
        cells: stageCells,
        sharesIssuedThisRound: newInvestorShares + Object.values(safeSharesMap).reduce((a, b) => a + b, 0) + newPoolShares,
        pricePerShare: roundPrice,
        preMoneyValuation: preVal,
        postMoneyValuation: postVal,
        effectivePreMoneyValuation: isPreMoneyPool ? effectivePreMoney : preVal,
        poolShuffleImpactDollars: isPreMoneyPool ? poolShuffleDollars : 0,
        poolShuffleImpactPercent: isPreMoneyPool ? poolShufflePercent : 0,
      });

      roundSummaries.push({
        roundId: round.id,
        roundName: round.name,
        roundType: "priced",
        amountRaised: amount,
        preMoneyValuation: preVal,
        postMoneyValuation: postVal,
        pricePerShare: roundPrice,
        newSharesIssued: newInvestorShares,
        roundOwnershipPercent: investorPct,
        effectivePreMoneyValuation: isPreMoneyPool ? effectivePreMoney : preVal,
        poolShuffleImpactDollars: isPreMoneyPool ? poolShuffleDollars : 0,
        poolTiming: round.poolTiming,
        poolTargetPercent: round.poolTargetPercent,
        safeNotes: convertingSafesData.map(
          (d) => `${d.safe.name}: converted into ${(safeSharesMap[d.safe.id] || 0).toLocaleString()} shares via ${d.mode}`
        ),
      });
    }
  }

  // Final Stage state
  const finalStage = stages[stages.length - 1];
  const finalTotalShares = finalStage.totalShares;
  const currentTotalPoolShares = finalStage.cells["pool"]?.shares ?? 0;
  const grantedPoolShares = Math.min(company.grantedPoolShares || 0, currentTotalPoolShares);
  const unallocatedPoolShares = Math.max(0, currentTotalPoolShares - grantedPoolShares);

  // 2. EXIT WATERFALL & SCENARIOS
  // Preferred series investors: priced rounds + converted SAFEs
  interface PreferredSeries {
    id: string;
    name: string;
    amount: number;
    shares: number;
  }

  const preferredSeriesList: PreferredSeries[] = [];
  for (const r of rounds) {
    if (r.type === "priced") {
      const shares = finalStage.cells[r.id]?.shares || 0;
      preferredSeriesList.push({
        id: r.id,
        name: `${r.name} Investor`,
        amount: r.amount,
        shares,
      });
    } else if (r.type === "safe") {
      const shares = finalStage.cells[r.id]?.shares || 0;
      if (shares > 0) {
        preferredSeriesList.push({
          id: r.id,
          name: r.name,
          amount: r.amount,
          shares,
        });
      }
    }
  }

  const exitTable: ExitScenarioRow[] = [];

  for (const exitVal of exit.exitValues) {
    const holdersProceeds: Record<string, HolderExitProceeds> = {};
    const totalPrefAmount = preferredSeriesList.reduce((s, p) => s + p.amount, 0);

    // Solve 1x Non-Participating Preferred Equilibrium:
    // A preferred series converts if and only if (shares / convertedTotalShares) * remainder >= preferenceAmount
    let convertingSeries = new Set<string>();

    if (exitVal > totalPrefAmount && finalTotalShares > 0) {
      // Find the stable set of converting preferred investors
      // Check all 2^N subsets (N is typically <= 4)
      let bestConverting = new Set<string>();

      const N = preferredSeriesList.length;
      const numCombos = 1 << N;

      for (let mask = 0; mask < numCombos; mask++) {
        const trialConverting = new Set<string>();
        let prefTaken = 0;
        let commonPlusConvertedShares = finalTotalShares; // start with all common shares

        for (let i = 0; i < N; i++) {
          if ((mask & (1 << i)) !== 0) {
            trialConverting.add(preferredSeriesList[i].id);
          } else {
            prefTaken += preferredSeriesList[i].amount;
            commonPlusConvertedShares -= preferredSeriesList[i].shares;
          }
        }

        const remainder = Math.max(0, exitVal - prefTaken);
        let valid = true;

        for (const p of preferredSeriesList) {
          if (trialConverting.has(p.id)) {
            // Must beat or tie preference
            const asCommonPayout = commonPlusConvertedShares > 0 ? (p.shares / commonPlusConvertedShares) * remainder : 0;
            if (asCommonPayout < p.amount - 0.01) {
              valid = false;
              break;
            }
          } else {
            // Non-converting should not do better by converting
            const hypotheticShares = commonPlusConvertedShares + p.shares;
            const hypotheticRemainder = remainder + p.amount;
            const hypotheticPayout = hypotheticShares > 0 ? (p.shares / hypotheticShares) * hypotheticRemainder : 0;
            if (hypotheticPayout > p.amount + 0.01) {
              valid = false;
              break;
            }
          }
        }

        if (valid) {
          bestConverting = trialConverting;
          break;
        }
      }

      convertingSeries = bestConverting;
    }

    // Now distribute proceeds based on the equilibrium
    let prefDistributed = 0;
    for (const p of preferredSeriesList) {
      if (!convertingSeries.has(p.id)) {
        prefDistributed += p.amount;
      }
    }

    const remainder = Math.max(0, exitVal - prefDistributed);
    let commonAndConvertedShares = 0;

    for (const [id, cell] of Object.entries(finalStage.cells)) {
      if (cell.category === "founder" || cell.category === "pool" || convertingSeries.has(id)) {
        commonAndConvertedShares += cell.shares;
      }
    }

    // If exit is less than total preference, preference is distributed pro-rata among non-converting
    if (exitVal <= totalPrefAmount) {
      for (const p of preferredSeriesList) {
        const shareOfPref = totalPrefAmount > 0 ? (p.amount / totalPrefAmount) * exitVal : 0;
        holdersProceeds[p.id] = {
          holderId: p.id,
          holderName: p.name,
          category: "investor",
          proceeds: shareOfPref,
          moic: p.amount > 0 ? shareOfPref / p.amount : 0,
          tookLiquidationPreference: true,
        };
      }

      // Common gets 0
      for (const f of founders) {
        holdersProceeds[f.id] = {
          holderId: f.id,
          holderName: f.name,
          category: "founder",
          proceeds: 0,
          impliedPricePerShare: 0,
          vestedProceeds: 0,
          unvestedProceeds: 0,
        };
      }

      holdersProceeds["pool"] = {
        holderId: "pool",
        holderName: "Option Pool",
        category: "pool",
        proceeds: 0,
      };

    } else {
      // Normal distribution
      // 1. Preferred Series
      for (const p of preferredSeriesList) {
        if (convertingSeries.has(p.id)) {
          const payout = commonAndConvertedShares > 0 ? (p.shares / commonAndConvertedShares) * remainder : 0;
          holdersProceeds[p.id] = {
            holderId: p.id,
            holderName: p.name,
            category: "investor",
            proceeds: payout,
            moic: p.amount > 0 ? payout / p.amount : 0,
            tookLiquidationPreference: false,
          };
        } else {
          holdersProceeds[p.id] = {
            holderId: p.id,
            holderName: p.name,
            category: "investor",
            proceeds: p.amount,
            moic: 1.0,
            tookLiquidationPreference: true,
          };
        }
      }

      // 2. Founders
      for (const f of founders) {
        const payout = commonAndConvertedShares > 0 ? (f.shares / commonAndConvertedShares) * remainder : 0;
        const impliedPps = f.shares > 0 ? payout / f.shares : 0;

        let vestedPayout = payout;
        let unvestedPayout = 0;

        if (exit.founderVestingMode === "as_of_date") {
          const vest = calculateVesting(f.shares, f.vestingYears, f.cliffMonths, f.startDate, exit.asOfDate);
          vestedPayout = payout * vest.vestedPercent;
          unvestedPayout = payout - vestedPayout;
        }

        holdersProceeds[f.id] = {
          holderId: f.id,
          holderName: f.name,
          category: "founder",
          proceeds: payout,
          impliedPricePerShare: impliedPps,
          vestedProceeds: vestedPayout,
          unvestedProceeds: unvestedPayout,
        };
      }

      // 3. Option Pool
      const poolShares = finalStage.cells["pool"]?.shares ?? 0;
      const poolPayout = commonAndConvertedShares > 0 ? (poolShares / commonAndConvertedShares) * remainder : 0;
      holdersProceeds["pool"] = {
        holderId: "pool",
        holderName: "Option Pool",
        category: "pool",
        proceeds: poolPayout,
      };
    }

    const totalDistributed = Object.values(holdersProceeds).reduce((s, h) => s + h.proceeds, 0);

    exitTable.push({
      exitValue: exitVal,
      holders: holdersProceeds,
      totalProceedsDistributed: totalDistributed,
    });
  }

  // 3. SANITY PANEL & WARNINGS
  const isAuthorizedExceeded = finalTotalShares > company.authorizedShares;
  const sharesToAuthorize = Math.max(0, Math.ceil(finalTotalShares - company.authorizedShares));

  const stageSums100 = stages.map((st) => {
    const sum = Object.values(st.cells).reduce((acc, c) => acc + (c.isPendingSafe ? 0 : c.ownershipPercent), 0);
    return {
      stageName: st.stageName,
      sum: Math.round(sum * 10) / 10,
      is100: Math.abs(sum - 100) < 0.2,
    };
  });

  const founderProgressionText: string[] = [];
  const firstStage = stages[0];
  const lastPricedStage = stages.slice().reverse().find((s) => s.roundType === "priced") || finalStage;

  for (const f of founders) {
    const startPct = firstStage.cells[f.id]?.ownershipPercent ?? 0;
    const endPct = lastPricedStage.cells[f.id]?.ownershipPercent ?? 0;
    const dilution = endPct - startPct;
    founderProgressionText.push(
      `${f.name}: ${startPct.toFixed(1)}% at Formation → ${endPct.toFixed(1)}% after ${lastPricedStage.stageName} (${dilution >= 0 ? "+" : ""}${dilution.toFixed(1)}%)`
    );
  }

  return {
    stages,
    roundSummaries,
    exitTable,
    sanity: {
      totalIssued: finalTotalShares,
      authorized: company.authorizedShares,
      isAuthorizedExceeded,
      sharesToAuthorize,
      stageSums100,
      founderProgressionText,
    },
    currentPostMoneyShares: finalTotalShares,
    currentTotalPoolShares,
    unallocatedPoolShares,
    grantedPoolShares,
  };
}

/**
 * Format helpers for currency, shares, and percentages
 */
export function fmtMoneyExact(v?: number | null): string {
  if (v == null || isNaN(v)) return "$0";
  return "$" + Math.round(v).toLocaleString("en-US");
}

export function fmtPricePerShare(v?: number | null): string {
  if (v == null || isNaN(v)) return "$0.00";
  if (v < 0.01) return "$" + v.toFixed(4);
  return "$" + v.toFixed(2);
}

export function fmtShares(v?: number | null): string {
  if (v == null || isNaN(v)) return "0";
  return Math.round(v).toLocaleString("en-US");
}

export function fmtPercent(v?: number | null): string {
  if (v == null || isNaN(v)) return "0.0%";
  return v.toFixed(1) + "%";
}

/**
 * CSV Generation for Cap Table by Round
 */
export function exportCapTableCsv(result: CapTableResult): string {
  const { stages } = result;
  if (!stages.length) return "";

  const headers = ["Holder", "Category"];
  for (const s of stages) {
    headers.push(`${s.stageName} Shares`, `${s.stageName} %`);
  }

  const rows: string[][] = [headers];

  // Unique holder IDs preserving order
  const holderIds = new Set<string>();
  for (const s of stages) {
    for (const id of Object.keys(s.cells)) {
      holderIds.add(id);
    }
  }

  for (const id of holderIds) {
    const firstCell = stages.find((s) => s.cells[id])?.cells[id];
    const row: string[] = [firstCell?.holderName || id, firstCell?.category || ""];

    for (const s of stages) {
      const cell = s.cells[id];
      if (!cell) {
        row.push("—", "—");
      } else if (cell.isPendingSafe) {
        row.push(cell.note || "Pending", "0.0%");
      } else {
        row.push(Math.round(cell.shares).toString(), cell.ownershipPercent.toFixed(1) + "%");
      }
    }
    rows.push(row);
  }

  // Total row
  const totalRow = ["Total Fully Diluted", ""];
  for (const s of stages) {
    totalRow.push(Math.round(s.totalShares).toString(), "100.0%");
  }
  rows.push(totalRow);

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}

/**
 * CSV Generation for Exit Scenarios Table
 */
export function exportExitTableCsv(result: CapTableResult): string {
  const { exitTable } = result;
  if (!exitTable.length) return "";

  const sample = exitTable[0];
  const holderKeys = Object.keys(sample.holders);

  const headers = ["Exit Valuation"];
  for (const k of holderKeys) {
    const h = sample.holders[k];
    headers.push(`${h.holderName} Proceeds`);
    if (h.category === "investor") {
      headers.push(`${h.holderName} MOIC`);
    } else if (h.category === "founder") {
      headers.push(`${h.holderName} $/Share`);
    }
  }
  headers.push("Total Distributed");

  const rows: string[][] = [headers];

  for (const row of exitTable) {
    const r: string[] = [fmtMoneyExact(row.exitValue)];
    for (const k of holderKeys) {
      const h = row.holders[k];
      if (!h) {
        r.push("$0");
        continue;
      }
      r.push(fmtMoneyExact(h.proceeds));
      if (h.category === "investor") {
        r.push(h.moic != null ? `${h.moic.toFixed(2)}x` : "—");
      } else if (h.category === "founder") {
        r.push(h.impliedPricePerShare != null ? fmtPricePerShare(h.impliedPricePerShare) : "—");
      }
    }
    r.push(fmtMoneyExact(row.totalProceedsDistributed));
    rows.push(r);
  }

  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
