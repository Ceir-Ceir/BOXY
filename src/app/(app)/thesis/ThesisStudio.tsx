"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtMoney, fmtNum } from "@/lib/format";
import {
  Flame,
  ShieldAlert,
  Lock,
  TrendingUp,
  Copy,
  Check,
  Building2,
  Sparkles,
  Sliders,
} from "lucide-react";

export default function ThesisStudio() {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"deck" | "memo">("deck");

  // Interactive Thesis Controls
  const [genzTarget] = useState(70000000);
  const [marketShare, setMarketShare] = useState(2.0);
  const [annualContrib, setAnnualContrib] = useState(3000);
  const [peNetYield, setPeNetYield] = useState(12.5);
  const [publicYield] = useState(7.5);
  const [peGapBillion, setPeGapBillion] = useState(150);

  // Live Metric Calculations
  const activeAccounts = Math.round(genzTarget * (marketShare / 100));
  const annualNewCapital = activeAccounts * annualContrib;
  const aumYr5 = annualNewCapital * 4.2; // Compound approximation
  const gapFilledPct = Math.min(100, (aumYr5 / (peGapBillion * 1e9)) * 100);
  const userExcessYield = peNetYield - publicYield;
  const userWealthSurplus = aumYr5 * (userExcessYield / 100) * 3; // 3 year compounding surplus
  const breadboxAnnualRevYr5 = aumYr5 * 0.015 + annualNewCapital * 0.015; // Mgmt + Placement spread

  const pitchText = `BredBox Thesis:
Pensions are dead, leaving 70 million GenZ Americans told to fund their own retirement with a product that locks money until 59.5, holds only public stocks, and that most of them don't even have. Retirement products assume you'll wait 40+ years to access your money, and traditional retail products cannot offer the commitment of a Pension without breaking the model. No one owns the committed investment account for people under 30.

Robinhood was successful because they were able to offer Market Makers with the order flow from retail investors. Similarly, PE has been running out of institutional money for years. BredBox offers time-based lock-in periods which give us a liability profile no one has — we become the institutional money for PE powered by individual investors. We become the missing capital gap for PE, which leads to higher returns for our users and greater cooperation from the rest of the street, propelling a cycle of growth.`;

  const copyThesis = () => {
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Mode Switcher */}
      <div className="card p-6 border-amber/30 bg-gradient-to-r from-raised via-surface to-raised relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame size={180} className="text-amber" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="pill pill-in_progress flex items-center gap-1">
                <Sparkles size={12} /> Master Thesis
              </span>
              <span className="text-[12px] text-muted">BredBox Core Pitch &amp; Strategy</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              The Breadbox Thesis &amp; Strategic War Room
            </h1>
            <p className="text-ink-2 text-[13.5px] mt-1 max-w-[75ch]">
              We own the committed investment account for under-30s by aggregating GenZ time-locked retirement savings into institutional LP capital for Private Equity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`btn btn-sm ${viewMode === "deck" ? "btn-primary" : ""}`}
              onClick={() => setViewMode("deck")}
            >
              Interactive Deck
            </button>
            <button
              className={`btn btn-sm ${viewMode === "memo" ? "btn-primary" : ""}`}
              onClick={() => setViewMode("memo")}
            >
              Executive Memo
            </button>
            <button className="btn btn-sm" onClick={copyThesis}>
              {copied ? <Check size={14} className="text-good" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Pitch"}
            </button>
          </div>
        </div>
      </div>

      {/* Live Thesis Calculator Sandbox */}
      <div className="card p-5 border-amber/20 bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[15px] flex items-center gap-2 text-amber-ink">
              <Sliders size={17} />
              Interactive Breadbox TAM &amp; Capital Sandbox
            </h3>
            <p className="text-muted text-[12px] mt-0.5">
              Adjust parameters live to see how GenZ adoption scales into an institutional PE LP capital pool.
            </p>
          </div>
          <Link href="/tools/pe-flywheel" className="text-[12.5px] text-amber-ink hover:underline inline-flex items-center gap-1">
            Full PE Model →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-2">GenZ Population</span>
              <span className="num font-semibold text-ink">70M</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-2">Breadbox Share</span>
              <span className="num font-semibold text-amber-ink">{marketShare}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10.0}
              step={0.5}
              value={marketShare}
              onChange={(e) => setMarketShare(parseFloat(e.target.value))}
            />
            <div className="text-[11px] text-muted">Accounts: {fmtNum(activeAccounts)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-2">Avg Annual Deposit</span>
              <span className="num font-semibold text-amber-ink">${annualContrib}</span>
            </div>
            <input
              type="range"
              min={500}
              max={10000}
              step={250}
              value={annualContrib}
              onChange={(e) => setAnnualContrib(parseFloat(e.target.value))}
            />
            <div className="text-[11px] text-muted">New Capital/yr: {fmtMoney(annualNewCapital)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-2">PE Net Yield</span>
              <span className="num font-semibold text-teal">{peNetYield}%</span>
            </div>
            <input
              type="range"
              min={8.0}
              max={18.0}
              step={0.5}
              value={peNetYield}
              onChange={(e) => setPeNetYield(parseFloat(e.target.value))}
            />
            <div className="text-[11px] text-muted">Spread over 401(k): +{userExcessYield.toFixed(1)}%</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-2">PE Macro LP Deficit</span>
              <span className="num font-semibold text-purple">${peGapBillion}B</span>
            </div>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={peGapBillion}
              onChange={(e) => setPeGapBillion(parseFloat(e.target.value))}
            />
            <div className="text-[11px] text-muted">BredBox Gap Fill: {gapFilledPct.toFixed(1)}%</div>
          </div>
        </div>

        {/* Live Output Banner */}
        <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-raised rounded-lg p-2.5">
            <div className="eyebrow">Yr 5 Aggregated AUM</div>
            <div className="num text-[18px] font-semibold text-amber-ink mt-0.5">{fmtMoney(aumYr5)}</div>
          </div>
          <div className="bg-raised rounded-lg p-2.5">
            <div className="eyebrow">PE LP Gap Satisfied</div>
            <div className="num text-[18px] font-semibold text-teal mt-0.5">{gapFilledPct.toFixed(1)}%</div>
          </div>
          <div className="bg-raised rounded-lg p-2.5">
            <div className="eyebrow">GenZ Wealth Surplus</div>
            <div className="num text-[18px] font-semibold text-good mt-0.5">+{fmtMoney(userWealthSurplus)}</div>
          </div>
          <div className="bg-raised rounded-lg p-2.5">
            <div className="eyebrow">Breadbox Annual Rev</div>
            <div className="num text-[18px] font-semibold text-purple mt-0.5">{fmtMoney(breadboxAnnualRevYr5)}</div>
          </div>
        </div>
      </div>

      {viewMode === "deck" ? (
        /* Deck Mode View */
        <div className="grid gap-5 md:grid-cols-2">
          {/* Pillar 1 */}
          <div className="card p-5 border-crit/20 hover:border-crit/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg bg-crit-soft text-crit flex items-center justify-center">
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className="eyebrow text-crit">Pillar 1 · The Broken Status Quo</span>
                <h3 className="font-semibold text-[16px]">Pensions Are Dead (70M GenZ Left Behind)</h3>
              </div>
            </div>
            <p className="text-ink-2 text-[13.5px] leading-relaxed">
              Traditional pensions provided guaranteed, committed retirement growth. Today, 70 million GenZ Americans are told to fund their own retirement using archaic products that lock money until 59.5, restrict investments to public stocks only, and that most young adults don&apos;t even own. Traditional retail accounts fail because they cannot offer pension-like commitment without breaking liquidity models.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] text-muted flex items-center justify-between">
              <span>Target Market: 70 Million GenZ</span>
              <span className="text-crit font-medium">Unowned Market Category</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="card p-5 border-amber/20 hover:border-amber/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg bg-amber-soft text-amber-ink flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <span className="eyebrow text-amber">Pillar 2 · Product Innovation</span>
                <h3 className="font-semibold text-[16px]">Time-Based Lock-In Periods</h3>
              </div>
            </div>
            <p className="text-ink-2 text-[13.5px] leading-relaxed">
              Instead of forcing users to wait 40+ years until 59.5 or providing instant liquid access, Breadbox offers flexible time-locked vaults (3, 5, 10, 20 year commitments). This creates a unique, highly predictable liability duration profile that no liquid brokerage can match, protecting capital while unlocking private markets.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] text-muted flex items-center justify-between">
              <span>Predictable Duration Profile</span>
              <Link href="/tools/lock-in" className="text-amber-ink hover:underline">
                Simulate Lock Duration →
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="card p-5 border-blue/20 hover:border-blue/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg bg-blue-soft text-blue flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <span className="eyebrow text-blue">Pillar 3 · The Robinhood Analogy</span>
                <h3 className="font-semibold text-[16px]">Institutional Money for PE</h3>
              </div>
            </div>
            <p className="text-ink-2 text-[13.5px] leading-relaxed">
              Robinhood succeeded by aggregating retail order flow to become essential to Market Makers. Private Equity has been running out of traditional institutional LP capital for years. Breadbox aggregates retail GenZ time-locked deposits to become the institutional LP capital pool for Private Equity &amp; Private Credit.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] text-muted flex items-center justify-between">
              <span>Retail Aggregation → Institutional Power</span>
              <span className="text-blue font-medium">$150B PE LP Deficit</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="card p-5 border-good/20 hover:border-good/40 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-9 rounded-lg bg-good-soft text-good flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <span className="eyebrow text-good">Pillar 4 · Self-Reinforcing Growth</span>
                <h3 className="font-semibold text-[16px]">Propelling Cycle of Growth</h3>
              </div>
            </div>
            <p className="text-ink-2 text-[13.5px] leading-relaxed">
              Filling Private Equity&apos;s missing capital gap unlocks premium private returns (11–14% PE/Credit vs 7.5% public 401k) for GenZ users. Higher returns lead to viral word-of-mouth referral loops and greater deal allocation cooperation from Wall Street, accelerating a powerful flywheel cycle of growth.
            </p>
            <div className="mt-4 pt-3 border-t border-line text-[12px] text-muted flex items-center justify-between">
              <span>Viral Growth Loop</span>
              <Link href="/tools/pe-flywheel" className="text-good hover:underline">
                Explore Flywheel Model →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Executive Memo View */
        <div className="card p-6 space-y-5 text-[14.5px] text-ink-2 leading-relaxed max-w-[90ch]">
          <h2 className="text-xl font-bold text-ink">BredBox Executive Pitch Memo</h2>
          
          <div className="p-4 bg-raised rounded-lg border-l-4 border-amber font-mono text-[13.5px] text-ink whitespace-pre-wrap">
            {pitchText}
          </div>

          <h3 className="text-lg font-semibold text-ink pt-3">Strategic Context &amp; Market Dynamics</h3>
          <p>
            1. <b>The Retail Retirement Gap:</b> The traditional 401(k) and IRA models were designed for a era when workers stayed at companies for decades. GenZ job mobility, lack of company pensions, and strict 59.5 withdrawal penalties have left young adults disenfranchised with traditional retirement products.
          </p>
          <p>
            2. <b>The Private Equity Liquidity Crunch:</b> Sovereign wealth funds, university endowments, and pension funds have hit overallocation limits in private markets (the denominator effect). PE fund managers face a massive fundraising deficit and desperately need long-term, non-volatile LP capital.
          </p>
          <p>
            3. <b>The Breadbox Solution:</b> Breadbox bridges these two macro trends. By giving under-30s time-locked pension accounts (e.g. 5–10 year lockups with yield multipliers), Breadbox creates a sticky liability structure. We aggregate millions of $200–$500/mo contributions into billion-dollar LP tranches for top-tier private equity and credit funds.
          </p>
        </div>
      )}
    </div>
  );
}
