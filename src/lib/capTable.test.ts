import { test, describe } from "node:test";
import assert from "node:assert";
import {
  calculateCapTable,
  type CapTableConfig,
  calculateVesting,
} from "./capTable.ts";

describe("Cap Table Math Engine Tests", () => {
  /**
   * TEST (a): Single priced round with no pool
   *
   * Hand-worked expected values:
   * - Founders: Ej (4,000,000 shares), Chris (4,000,000 shares) -> 8,000,000 total shares (50% each at formation).
   * - Round: Seed priced round raising $2,000,000 at $8,000,000 pre-money (no option pool, 0%).
   * - Post-money valuation = $8,000,000 + $2,000,000 = $10,000,000.
   * - Investor ownership = $2,000,000 / $10,000,000 = 20.0%.
   * - Round share price = $8,000,000 / 8,000,000 = $1.0000 / share.
   * - New investor shares issued = $2,000,000 / $1.00 = 2,000,000 shares.
   * - Total post-money shares = 8,000,000 + 2,000,000 = 10,000,000 shares.
   * - Ej post-round: 4,000,000 / 10,000,000 = 40.0%.
   * - Chris post-round: 4,000,000 / 10,000,000 = 40.0%.
   * - Investor post-round: 2,000,000 / 10,000,000 = 20.0%.
   */
  test("(a) single priced round with no pool", () => {
    const config: CapTableConfig = {
      company: { authorizedShares: 10_000_000, parValue: 0.0001, grantedPoolShares: 0 },
      founders: [
        { id: "ej", name: "Ej", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
        { id: "chris", name: "Chris", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
      ],
      founderInputMode: "shares",
      rounds: [
        {
          id: "seed",
          type: "priced",
          name: "Seed",
          amount: 2_000_000,
          valuationMode: "pre",
          preMoneyValuation: 8_000_000,
          postMoneyValuation: 10_000_000,
          poolTargetPercent: 0,
          poolTiming: "pre-money",
        },
      ],
      exit: {
        exitValues: [10_000_000],
        founderVestingMode: "fully_vested",
        asOfDate: "2026-01-01",
      },
    };

    const res = calculateCapTable(config);
    const seedStage = res.stages.find((s) => s.stageId === "seed")!;

    assert.ok(seedStage, "Seed stage should exist");
    assert.strictEqual(Math.round(seedStage.totalShares), 10_000_000);
    assert.strictEqual(Math.round(seedStage.cells["ej"].shares), 4_000_000);
    assert.strictEqual(Math.round(seedStage.cells["chris"].shares), 4_000_000);
    assert.strictEqual(Math.round(seedStage.cells["seed"].shares), 2_000_000);

    assert.strictEqual(seedStage.cells["ej"].ownershipPercent.toFixed(1), "40.0");
    assert.strictEqual(seedStage.cells["chris"].ownershipPercent.toFixed(1), "40.0");
    assert.strictEqual(seedStage.cells["seed"].ownershipPercent.toFixed(1), "20.0");
    assert.strictEqual(seedStage.pricePerShare?.toFixed(4), "1.0000");
  });

  /**
   * TEST (b): Pre-money vs post-money pool creation producing different founder %
   *
   * Hand-worked expected values:
   * - Founders: Ej (4M), Chris (4M) -> 8M common shares.
   * - Seed round: $3,000,000 on $12,000,000 pre-money ($15,000,000 post-money). 10% pool target.
   *
   * 1. Under Pre-money pool:
   *    - Investor ownership = $3M / $15M = 20.0%.
   *    - Pool target = 10.0%.
   *    - Founders ownership = 100% - 20% - 10% = 70.0% (Ej 35.0%, Chris 35.0%).
   *    - Total post shares = 8,000,000 / 0.70 = 11,428,571 shares.
   *    - Investor shares = 20% * 11,428,571 = 2,285,714 shares.
   *    - Pool shares = 10% * 11,428,571 = 1,142,857 shares.
   *    - Round price = $3,000,000 / 2,285,714.29 = $1.3125 / share.
   *    - Effective pre-money for founders = 8,000,000 * $1.3125 = $10,500,000.
   *    - Pool shuffle impact on founders = $12,000,000 - $10,500,000 = $1,500,000.
   *
   * 2. Under Post-money pool:
   *    - Round takes place without pool first:
   *      Price = $12,000,000 / 8,000,000 = $1.50 / share.
   *      Investor buys $3,000,000 / $1.50 = 2,000,000 shares.
   *      Pre-pool shares = 8,000,000 + 2,000,000 = 10,000,000.
   *    - Then 10% pool created on post-money:
   *      Total shares = 10,000,000 / (1 - 0.10) = 11,111,111 shares.
   *      Founders ownership = 8,000,000 / 11,111,111 = 72.0% (Ej 36.0%, Chris 36.0%).
   *      Investor ownership = 2,000,000 / 11,111,111 = 18.0%.
   *      Pool ownership = 10.0%.
   *
   * Difference: Founders own 70.0% with pre-money pool vs 72.0% with post-money pool!
   */
  test("(b) pre-money vs post-money pool creation producing different founder %", () => {
    // 1. Pre-money pool configuration
    const preConfig: CapTableConfig = {
      company: { authorizedShares: 15_000_000, parValue: 0.0001, grantedPoolShares: 0 },
      founders: [
        { id: "ej", name: "Ej", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
        { id: "chris", name: "Chris", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
      ],
      founderInputMode: "shares",
      rounds: [
        {
          id: "seed",
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
      exit: { exitValues: [25_000_000], founderVestingMode: "fully_vested", asOfDate: "2026-01-01" },
    };

    const resPre = calculateCapTable(preConfig);
    const stagePre = resPre.stages.find((s) => s.stageId === "seed")!;

    // 2. Post-money pool configuration
    const postConfig: CapTableConfig = {
      ...preConfig,
      rounds: [
        {
          id: "seed",
          type: "priced",
          name: "Seed",
          amount: 3_000_000,
          valuationMode: "pre",
          preMoneyValuation: 12_000_000,
          postMoneyValuation: 15_000_000,
          poolTargetPercent: 10,
          poolTiming: "post-money",
        },
      ],
    };

    const resPost = calculateCapTable(postConfig);
    const stagePost = resPost.stages.find((s) => s.stageId === "seed")!;

    // Verify Pre-money values
    assert.strictEqual(stagePre.cells["ej"].ownershipPercent.toFixed(1), "35.0");
    assert.strictEqual(stagePre.cells["chris"].ownershipPercent.toFixed(1), "35.0");
    assert.strictEqual(stagePre.cells["pool"].ownershipPercent.toFixed(1), "10.0");
    assert.strictEqual(stagePre.cells["seed"].ownershipPercent.toFixed(1), "20.0");
    assert.strictEqual(Math.round(stagePre.totalShares), 11_428_571);
    assert.strictEqual(stagePre.pricePerShare?.toFixed(4), "1.3125");
    assert.strictEqual(Math.round(stagePre.effectivePreMoneyValuation || 0), 10_500_000);
    assert.strictEqual(Math.round(stagePre.poolShuffleImpactDollars || 0), 1_500_000);

    // Verify Post-money values
    assert.strictEqual(stagePost.cells["ej"].ownershipPercent.toFixed(1), "36.0");
    assert.strictEqual(stagePost.cells["chris"].ownershipPercent.toFixed(1), "36.0");
    assert.strictEqual(stagePost.cells["pool"].ownershipPercent.toFixed(1), "10.0");
    assert.strictEqual(stagePost.cells["seed"].ownershipPercent.toFixed(1), "18.0");
    assert.strictEqual(Math.round(stagePost.totalShares), 11_111_111);

    // Founders have different %: 70.0% vs 72.0%
    const totalFoundersPre = stagePre.cells["ej"].ownershipPercent + stagePre.cells["chris"].ownershipPercent;
    const totalFoundersPost = stagePost.cells["ej"].ownershipPercent + stagePost.cells["chris"].ownershipPercent;
    assert.strictEqual(totalFoundersPre.toFixed(1), "70.0");
    assert.strictEqual(totalFoundersPost.toFixed(1), "72.0");
    assert.ok(totalFoundersPost > totalFoundersPre, "Post-money pool must leave founders with higher ownership than pre-money pool");
  });

  /**
   * TEST (c): Post-money SAFE converting at a priced round where cap is below round valuation
   *
   * Hand-worked expected values:
   * - Founders: Ej (4M), Chris (4M) -> 8M shares.
   * - Round 1: Pre-seed SAFE $500,000 on $8,000,000 post-money valuation cap (0% discount).
   * - Round 2: Seed priced round $3,000,000 at $12,000,000 pre / $15,000,000 post. 10% pre-money pool.
   *
   * Cap is $8M, which is below the Seed valuation ($12M pre / $15M post).
   * Under YC post-money SAFE:
   * - SAFE ownership of pre-money capitalization = $500K / $8M = 6.25%.
   * - In post-money terms: w_safe = (500K / 8M) * (12M / 15M) = 0.0625 * 0.80 = 0.0500 (5.0%).
   * - Seed investor ownership = $3M / $15M = 0.2000 (20.0%).
   * - Option pool = 10.0%.
   * - Founders ownership = 1 - 0.20 - 0.10 - 0.05 = 0.6500 (65.0% total, Ej 32.5%, Chris 32.5%).
   * - Total post shares = 8,000,000 / 0.65 = 12,307,692 shares.
   * - SAFE shares = 5.0% * 12,307,692 = 615,385 shares.
   * - SAFE conversion price = $500,000 / 615,384.62 = $0.8125 / share.
   * - Seed round price = $3,000,000 / (20% * 12,307,692) = $1.21875 / share.
   *
   * Because cap $8M < $12M pre, SAFE conversion price ($0.8125) is lower than Seed price ($1.21875).
   */
  test("(c) a post-money SAFE converting at a priced round where the cap is below the round valuation", () => {
    const config: CapTableConfig = {
      company: { authorizedShares: 15_000_000, parValue: 0.0001, grantedPoolShares: 0 },
      founders: [
        { id: "ej", name: "Ej", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
        { id: "chris", name: "Chris", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
      ],
      founderInputMode: "shares",
      rounds: [
        {
          id: "preseed-safe",
          type: "safe",
          name: "Pre-seed SAFE",
          amount: 500_000,
          valuationCap: 8_000_000,
          discountPercent: 0,
        },
        {
          id: "seed",
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
      exit: { exitValues: [25_000_000], founderVestingMode: "fully_vested", asOfDate: "2026-01-01" },
    };

    const res = calculateCapTable(config);
    const seedStage = res.stages.find((s) => s.stageId === "seed")!;

    assert.strictEqual(Math.round(seedStage.totalShares), 12_307_692);
    assert.strictEqual(seedStage.cells["ej"].ownershipPercent.toFixed(1), "32.5");
    assert.strictEqual(seedStage.cells["chris"].ownershipPercent.toFixed(1), "32.5");
    assert.strictEqual(seedStage.cells["preseed-safe"].ownershipPercent.toFixed(1), "5.0");
    assert.strictEqual(seedStage.cells["pool"].ownershipPercent.toFixed(1), "10.0");
    assert.strictEqual(seedStage.cells["seed"].ownershipPercent.toFixed(1), "20.0");

    assert.strictEqual(Math.round(seedStage.cells["preseed-safe"].shares), 615_385);
    assert.strictEqual(Math.round(seedStage.cells["seed"].shares), 2_461_538);

    const safePrice = 500_000 / seedStage.cells["preseed-safe"].shares;
    const seedPrice = seedStage.pricePerShare!;
    assert.strictEqual(safePrice.toFixed(4), "0.8125");
    assert.strictEqual(seedPrice.toFixed(4), "1.2188");
    assert.ok(safePrice < seedPrice, "SAFE price must be lower than priced round price when cap < valuation");
  });

  /**
   * TEST (d): A discount beating the cap
   *
   * Hand-worked expected values:
   * - Founders: 8M shares (Ej 4M, Chris 4M).
   * - SAFE: $500,000 with $20,000,000 cap and 20% discount.
   * - Seed priced round: $2,000,000 at $8,000,000 pre / $10,000,000 post (0% pool).
   *
   * Comparison:
   * - If Cap applied:
   *   w_cap = (500,000 / 20,000,000) * (8M / 10M) = 0.025 * 0.8 = 0.020 (2.0%).
   * - If Discount applied (20% discount => price is 80% of round price):
   *   w_disc = 500,000 / (10,000,000 * 0.8) = 500,000 / 8,000,000 = 0.0625 (6.25%).
   * - Since 6.25% > 2.0%, the discount gives the investor a lower price per share ($0.7375 vs $1.84) and more shares!
   * - Therefore, Discount beats Cap.
   * - Founder fraction = 1 - 0.20 (Seed) - 0.0625 (SAFE) = 0.7375.
   * - Total post-money shares = 8,000,000 / 0.7375 = 10,847,458 shares.
   * - SAFE shares = 0.0625 * 10,847,458 = 677,966 shares (6.25%).
   * - Seed investor shares = 0.20 * 10,847,458 = 2,169,492 shares (20.0%).
   * - Seed round price = $2,000,000 / 2,169,491.5 = $0.921875 / share.
   * - SAFE conversion price = $500,000 / 677,966 = $0.7375 / share.
   *   Notice: $0.7375 / $0.921875 = 0.80 exactly (20% discount)!
   */
  test("(d) a discount beating the cap", () => {
    const config: CapTableConfig = {
      company: { authorizedShares: 15_000_000, parValue: 0.0001, grantedPoolShares: 0 },
      founders: [
        { id: "ej", name: "Ej", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
        { id: "chris", name: "Chris", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
      ],
      founderInputMode: "shares",
      rounds: [
        {
          id: "safe-discount",
          type: "safe",
          name: "Discounted SAFE",
          amount: 500_000,
          valuationCap: 20_000_000, // Very high cap
          discountPercent: 20, // 20% discount
        },
        {
          id: "seed",
          type: "priced",
          name: "Seed",
          amount: 2_000_000,
          valuationMode: "pre",
          preMoneyValuation: 8_000_000,
          postMoneyValuation: 10_000_000,
          poolTargetPercent: 0,
          poolTiming: "pre-money",
        },
      ],
      exit: { exitValues: [25_000_000], founderVestingMode: "fully_vested", asOfDate: "2026-01-01" },
    };

    const res = calculateCapTable(config);
    const seedStage = res.stages.find((s) => s.stageId === "seed")!;

    assert.strictEqual(Math.round(seedStage.totalShares), 10_847_458);
    assert.strictEqual(seedStage.cells["safe-discount"].ownershipPercent.toFixed(2), "6.25");
    assert.strictEqual(Math.round(seedStage.cells["safe-discount"].shares), 677_966);

    const safePrice = 500_000 / seedStage.cells["safe-discount"].shares;
    const seedPrice = seedStage.pricePerShare!;
    // Ratio of SAFE price to Seed price should be exactly 0.80 (20% discount)
    const ratio = safePrice / seedPrice;
    assert.strictEqual(ratio.toFixed(2), "0.80");
  });

  /**
   * TEST (e): Liquidation preference binding at a low exit and converting at a high exit
   *
   * Hand-worked expected values:
   * - Founders: 8,000,000 shares (80.0%).
   * - Seed Investor: 2,000,000 shares (20.0%), invested $2,000,000.
   * - 1x Non-participating liquidation preference = $2,000,000.
   *
   * 1. Low exit scenario ($5,000,000 exit value):
   *    - As common: 20% of $5M = $1,000,000.
   *    - Preference: $2,000,000.
   *    - $2,000,000 > $1,000,000 -> Investor takes 1x liquidation preference! (Preference binds)
   *    - Investor proceeds = $2,000,000 (MOIC = 1.0x).
   *    - Remaining proceeds for common = $5,000,000 - $2,000,000 = $3,000,000.
   *    - Ej proceeds = $1,500,000 ($0.375 / share).
   *    - Chris proceeds = $1,500,000 ($0.375 / share).
   *
   * 2. High exit scenario ($50,000,000 exit value):
   *    - As common: 20% of $50M = $10,000,000.
   *    - Preference: $2,000,000.
   *    - $10,000,000 > $2,000,000 -> Investor converts to common!
   *    - Investor proceeds = $10,000,000 (MOIC = 5.0x).
   *    - Common holders get 80% = $40,000,000.
   *    - Ej proceeds = $20,000,000 ($5.00 / share).
   *    - Chris proceeds = $20,000,000 ($5.00 / share).
   */
  test("(e) liquidation preference binding at a low exit and converting at a high exit", () => {
    const config: CapTableConfig = {
      company: { authorizedShares: 10_000_000, parValue: 0.0001, grantedPoolShares: 0 },
      founders: [
        { id: "ej", name: "Ej", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
        { id: "chris", name: "Chris", shares: 4_000_000, vestingYears: 4, cliffMonths: 12, startDate: "2024-01-01" },
      ],
      founderInputMode: "shares",
      rounds: [
        {
          id: "seed",
          type: "priced",
          name: "Seed",
          amount: 2_000_000,
          valuationMode: "pre",
          preMoneyValuation: 8_000_000,
          postMoneyValuation: 10_000_000,
          poolTargetPercent: 0,
          poolTiming: "pre-money",
        },
      ],
      exit: {
        exitValues: [5_000_000, 50_000_000],
        founderVestingMode: "fully_vested",
        asOfDate: "2026-01-01",
      },
    };

    const res = calculateCapTable(config);

    // 1. Low Exit ($5M)
    const lowExit = res.exitTable.find((row) => row.exitValue === 5_000_000)!;
    assert.ok(lowExit, "Low exit scenario must exist");
    const lowSeed = lowExit.holders["seed"];
    assert.strictEqual(Math.round(lowSeed.proceeds), 2_000_000);
    assert.strictEqual(lowSeed.moic?.toFixed(1), "1.0");
    assert.strictEqual(lowSeed.tookLiquidationPreference, true, "Seed should take preference at $5M exit");

    const lowEj = lowExit.holders["ej"];
    const lowChris = lowExit.holders["chris"];
    assert.strictEqual(Math.round(lowEj.proceeds), 1_500_000);
    assert.strictEqual(Math.round(lowChris.proceeds), 1_500_000);
    assert.strictEqual(lowEj.impliedPricePerShare?.toFixed(3), "0.375");

    // 2. High Exit ($50M)
    const highExit = res.exitTable.find((row) => row.exitValue === 50_000_000)!;
    assert.ok(highExit, "High exit scenario must exist");
    const highSeed = highExit.holders["seed"];
    assert.strictEqual(Math.round(highSeed.proceeds), 10_000_000);
    assert.strictEqual(highSeed.moic?.toFixed(1), "5.0");
    assert.strictEqual(highSeed.tookLiquidationPreference, false, "Seed should convert to common at $50M exit");

    const highEj = highExit.holders["ej"];
    const highChris = highExit.holders["chris"];
    assert.strictEqual(Math.round(highEj.proceeds), 20_000_000);
    assert.strictEqual(Math.round(highChris.proceeds), 20_000_000);
    assert.strictEqual(highEj.impliedPricePerShare?.toFixed(2), "5.00");
  });

  /**
   * TEST (f): Founder vesting calculator
   */
  test("founder vesting before cliff, after cliff, and fully vested", () => {
    // Before 12-month cliff (6 months in)
    const vBeforeCliff = calculateVesting(4_000_000, 4, 12, "2024-01-01", "2024-07-01");
    assert.strictEqual(vBeforeCliff.vestedShares, 0);
    assert.strictEqual(vBeforeCliff.unvestedShares, 4_000_000);

    // At 24 months (50% vested)
    const vHalf = calculateVesting(4_000_000, 4, 12, "2024-01-01", "2026-01-01");
    assert.strictEqual(Math.round(vHalf.vestedShares), 2_000_000);
    assert.strictEqual(Math.round(vHalf.unvestedShares), 2_000_000);
    assert.strictEqual(vHalf.vestedPercent.toFixed(2), "0.50");

    // After 48 months (100% vested)
    const vFull = calculateVesting(4_000_000, 4, 12, "2024-01-01", "2028-02-01");
    assert.strictEqual(vFull.vestedShares, 4_000_000);
    assert.strictEqual(vFull.unvestedShares, 0);
    assert.strictEqual(vFull.vestedPercent, 1);
  });
});
