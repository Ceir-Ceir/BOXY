"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  PE_FLYWHEEL_PRESETS,
  PE_FLYWHEEL_FIELDS,
  simulatePEFlywheel,
  type PEFlywheelParams,
} from "@/lib/pe-flywheel";
import type { Scenario } from "@/lib/types";
import { fmtMoney, fmtNum } from "@/lib/format";
import { saveScenario, deleteScenario } from "@/app/actions";
import { Save, X, Zap, PieChart, Users, DollarSign, TrendingUp, Grid } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

const C = {
  amber: "#e0a040",
  amberSoft: "rgba(224,160,64,.18)",
  teal: "#2fb59b",
  tealSoft: "rgba(47,181,155,.18)",
  blue: "#7c9bf0",
  blueSoft: "rgba(124,155,240,.18)",
  purple: "#ab7cf0",
  purpleSoft: "rgba(171,124,240,.18)",
  crit: "#e27a72",
  critSoft: "rgba(226,122,114,.18)",
  good: "#5fc38a",
  goodSoft: "rgba(95,195,138,.18)",
  muted: "#8f867a",
  line: "#2e2a24",
  ink: "#ede7dc",
  surface: "#232019",
};

function baseOptions(yfmt: (v: number) => string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.surface,
        titleColor: C.ink,
        bodyColor: C.ink,
        borderColor: C.line,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (i: { label: string }[]) => "Year " + i[0].label,
          label: (c: { dataset: { label?: string; fmt?: (v: number) => string }; raw: unknown }) =>
            " " + c.dataset.label + ": " + (c.dataset.fmt || yfmt)(c.raw as number),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.muted, font: { family: "IBM Plex Mono" } }, border: { color: C.line } },
      y: {
        grid: { color: C.line },
        ticks: { color: C.muted, font: { family: "IBM Plex Mono" }, callback: (v: string | number) => yfmt(Number(v)), maxTicksLimit: 6 },
        border: { display: false },
      },
    },
  };
}

export default function PEFlywheelModel({ scenarios }: { scenarios: Scenario[] }) {
  const [p, setP] = useState<PEFlywheelParams>(PE_FLYWHEEL_PRESETS.baseCase.p);
  const [name, setName] = useState("");
  const [, start] = useTransition();

  const { rows, summary } = useMemo(() => simulatePEFlywheel(p), [p]);
  const labels = rows.map((r) => `Yr ${r.year}`);
  const set = (k: keyof PEFlywheelParams, v: number) => setP((s) => ({ ...s, [k]: v }));

  const kpis = [
    {
      l: "Year 5 Aggregate AUM",
      v: fmtMoney(summary.finalAum),
      s: `from ${fmtNum(summary.finalUsers)} GenZ accounts`,
      cls: "text-amber-ink",
      icon: DollarSign,
    },
    {
      l: "PE LP Gap Filled",
      v: `${summary.gapFilledPct.toFixed(1)}%`,
      s: `of $${p.peMacroGapBillion}B PE LP deficit`,
      cls: "text-teal",
      icon: Zap,
    },
    {
      l: "GenZ Users Onboarded",
      v: fmtNum(summary.finalUsers),
      s: `${p.penetrationPct}% GenZ market share`,
      cls: "text-blue",
      icon: Users,
    },
    {
      l: "Year 5 Annual Revenue",
      v: fmtMoney(summary.annualRevYr5),
      s: `mgmt + placement + carry`,
      cls: "text-good",
      icon: TrendingUp,
    },
    {
      l: "Year 5 Net Profit",
      v: fmtMoney(summary.netProfitYr5),
      s: `${summary.netMarginYr5.toFixed(1)}% net margin`,
      cls: summary.netProfitYr5 >= 0 ? "text-good" : "text-crit",
      icon: PieChart,
    },
    {
      l: "GenZ Wealth Delivered",
      v: fmtMoney(summary.totalUserWealthYr5),
      s: `net compound return paid out`,
      cls: "text-purple",
      icon: DollarSign,
    },
  ];

  const groups = Array.from(new Set(PE_FLYWHEEL_FIELDS.map((f) => f.group)));

  const stackedRevOpts = baseOptions(fmtMoney);
  (stackedRevOpts.scales.y as { stacked?: boolean }).stacked = true;
  (stackedRevOpts.scales.x as { stacked?: boolean }).stacked = true;

  const barOpts = baseOptions(fmtMoney);

  return (
    <div className="space-y-5">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div key={k.l} className="card p-3.5 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="eyebrow truncate">{k.l}</span>
              <k.icon size={14} className="text-muted shrink-0" />
            </div>
            <div className={`num text-[21px] font-semibold truncate ${k.cls}`}>{k.v}</div>
            <div className="text-muted text-[12px] mt-0.5 truncate">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr] items-start">
        {/* Sidebar Controls */}
        <aside className="card p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto space-y-4">
          <div>
            <div className="eyebrow mb-2">Presets</div>
            <div className="space-y-1.5">
              {Object.entries(PE_FLYWHEEL_PRESETS).map(([k, v]) => (
                <button
                  key={k}
                  className="btn btn-sm w-full justify-start text-left flex-col items-start !py-2"
                  onClick={() => setP(v.p)}
                >
                  <span className="font-medium text-[13px]">{v.label}</span>
                  <span className="text-[11px] text-muted line-clamp-1">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {scenarios.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Saved scenarios</div>
              <div className="space-y-1">
                {scenarios.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 group">
                    <button
                      className="btn btn-sm flex-1 justify-start truncate"
                      onClick={() => setP({ ...PE_FLYWHEEL_PRESETS.baseCase.p, ...(s.params as Partial<PEFlywheelParams>) })}
                    >
                      {s.name}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-danger opacity-0 group-hover:opacity-100"
                      onClick={() => start(() => deleteScenario(s.id))}
                      aria-label="Delete"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-1.5">
            <input
              className="input !py-1.5 text-[13px]"
              placeholder="Save current as…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="btn btn-sm shrink-0"
              disabled={!name.trim()}
              onClick={() => {
                start(() => saveScenario(name.trim(), "pe_flywheel", p));
                setName("");
              }}
            >
              <Save size={13} />
              Save
            </button>
          </div>

          {groups.map((g) => (
            <div key={g}>
              <div className="eyebrow mb-2 mt-2">{g}</div>
              {PE_FLYWHEEL_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`pe-${f.key}`} className="text-[12.5px] text-ink-2">
                      {f.label}
                    </label>
                    <input
                      id={`pe-${f.key}`}
                      type="number"
                      className="input !w-24 !py-1 !px-2 num text-[12.5px] text-right"
                      value={p[f.key]}
                      step={f.step}
                      onChange={(e) => set(f.key, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={p[f.key]}
                    onChange={(e) => set(f.key, parseFloat(e.target.value))}
                    aria-label={f.label}
                  />
                  {f.hint && <div className="text-[11px] text-muted -mt-0.5">{f.hint}</div>}
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* Main Content Area */}
        <div className="space-y-4 min-w-0">
          {/* Key Insight Box */}
          <div className="rounded-xl border border-teal/30 bg-teal-soft p-4 text-[13.5px]">
            <div className="font-semibold text-teal mb-1 flex items-center gap-2">
              <Zap size={16} />
              The PE Institutional Gap &amp; Flywheel Opportunity
            </div>
            <p className="text-ink-2">
              Private Equity has been running out of institutional LP capital. By aggregating retail order flow into time-locked pension accounts, Breadbox reaches <b className="num text-ink">{fmtNum(summary.finalUsers)} GenZ accounts</b> (<b className="num text-ink">{p.penetrationPct}%</b> market share) by Year 5, pooling <b className="num text-ink">{fmtMoney(summary.finalAum)}</b> in committed capital. This fills <b className="num text-ink">{summary.gapFilledPct.toFixed(1)}%</b> of the annual PE LP deficit, generating <b className="num text-ink">{fmtMoney(summary.annualRevYr5)}/yr</b> for Breadbox Management Co with a <b className="num text-ink">{summary.netMarginYr5.toFixed(1)}%</b> net margin.
            </p>
          </div>

          {/* Chart 1: Revenue Stack */}
          <div className="card p-4">
            <ChartHead
              title="Breadbox Revenue Stack Split (Management Fee + Placement Fee + Carry)"
              legend={[
                ["Management Fee (0.95%)", C.amber],
                ["Placement Fee Spread", C.teal],
                ["PE Carry Share (15%)", C.purple],
                ["Opex Cost", C.crit],
              ]}
            />
            <div className="h-[280px]">
              <Bar
                data={{
                  labels,
                  datasets: [
                    { label: "Management Fee", data: rows.map((r) => r.mgmtFeeRev), backgroundColor: C.amber, stack: "rev" },
                    { label: "Placement Fee", data: rows.map((r) => r.placementFeeRev), backgroundColor: C.teal, stack: "rev" },
                    { label: "Carry Share", data: rows.map((r) => r.carryRev), backgroundColor: C.purple, stack: "rev" },
                    { label: "Opex Cost", data: rows.map((r) => -r.opexCost), backgroundColor: C.crit, stack: "cost", fmt: (v: number) => fmtMoney(-v) },
                  ] as never,
                }}
                options={stackedRevOpts}
              />
            </div>
          </div>

          {/* Chart 2: Cumulative AUM & Gap Fill */}
          <div className="card p-4">
            <ChartHead
              title="Capital Aggregated vs Annual New LP Inflow"
              legend={[
                ["Cumulative AUM", C.blue],
                ["Annual New Capital Inflow", C.good],
              ]}
            />
            <div className="h-[240px]">
              <Bar
                data={{
                  labels,
                  datasets: [
                    { label: "Cumulative AUM", data: rows.map((r) => r.cumulativeAum), backgroundColor: C.blue },
                    { label: "Annual New Capital", data: rows.map((r) => r.annualNewCapital), backgroundColor: C.good },
                  ],
                }}
                options={barOpts}
              />
            </div>
          </div>

          {/* Interactive Sensitivity Matrix Table */}
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-[14.5px] flex items-center gap-2">
                  <Grid size={16} className="text-amber" />
                  Economics Sensitivity Heatmap (PE Gross Yield vs Placement Spread)
                </h3>
                <p className="text-muted text-[12px] mt-0.5">
                  Cell values display: <b className="text-teal">Net User Yield</b> / <b className="text-good">Breadbox Annual Revenue</b>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] num border-collapse">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="text-left py-2 px-3 bg-surface font-medium">PE Gross Return \ Placement Fee</th>
                    {[0.75, 1.25, 1.75, 2.25, 2.75].map((s) => (
                      <th key={s} className="text-center py-2 px-3 font-medium">
                        {s}% Spread
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.sensitivityMatrix.map((row, idx) => (
                    <tr key={idx} className="border-b border-line/60 hover:bg-hover">
                      <td className="py-2.5 px-3 font-semibold text-ink-2 bg-surface">
                        {row[0].peYield.toFixed(1)}% PE Return
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3 text-center border-l border-line/40">
                          <div className="font-semibold text-teal">{cell.netUserYield.toFixed(1)}% User</div>
                          <div className="text-[11.5px] text-good mt-0.5">{fmtMoney(cell.annualRev)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Year-by-Year Data Table */}
          <details className="card px-4">
            <summary className="py-3 cursor-pointer font-medium text-[13.5px]">
              Year-by-year flywheel table
            </summary>
            <div className="overflow-x-auto pb-3">
              <table className="w-full text-[12px] num">
                <thead>
                  <tr className="text-muted border-b border-line">
                    {[
                      "Year",
                      "Accounts",
                      "New Capital",
                      "Cum AUM",
                      "Gap Filled",
                      "Mgmt Fee",
                      "Placement Fee",
                      "Carry Share",
                      "Total Rev",
                      "Opex Cost",
                      "Net Profit",
                    ].map((h) => (
                      <th key={h} className="text-right first:text-left font-medium px-2 py-1.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.year} className="border-b border-line/60 hover:bg-hover">
                      <td className="px-2 py-1 text-left">Year {r.year}</td>
                      <td className="px-2 py-1 text-right">{fmtNum(r.users)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.annualNewCapital)}</td>
                      <td className="px-2 py-1 text-right font-medium text-amber-ink">{fmtMoney(r.cumulativeAum)}</td>
                      <td className="px-2 py-1 text-right text-teal">{r.gapFilledPct.toFixed(2)}%</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.mgmtFeeRev)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.placementFeeRev)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.carryRev)}</td>
                      <td className="px-2 py-1 text-right font-semibold text-good">{fmtMoney(r.totalRev)}</td>
                      <td className="px-2 py-1 text-right text-muted">{fmtMoney(r.opexCost)}</td>
                      <td className={`px-2 py-1 text-right font-semibold ${r.netProfit >= 0 ? "text-good" : "text-crit"}`}>
                        {fmtMoney(r.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function ChartHead({ title, legend }: { title: string; legend: [string, string][] }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
      <h3 className="font-semibold text-[14.5px]">{title}</h3>
      <div className="flex flex-wrap gap-3 text-[12px] text-muted">
        {legend.map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
