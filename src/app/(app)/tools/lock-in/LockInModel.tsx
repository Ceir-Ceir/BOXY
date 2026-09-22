"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  LOCK_IN_PRESETS,
  LOCK_IN_FIELDS,
  simulateLockIn,
  type LockInParams,
} from "@/lib/lock-in";
import type { Scenario } from "@/lib/types";
import { fmtMoney, fmtNum } from "@/lib/format";
import { saveScenario, deleteScenario } from "@/app/actions";
import { Save, X, ShieldCheck, TrendingUp, Lock, Award, Building2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
          title: (i: { label: string }[]) => "Month " + i[0].label,
          label: (c: { dataset: { label?: string; fmt?: (v: number) => string }; raw: unknown }) =>
            " " + c.dataset.label + ": " + (c.dataset.fmt || yfmt)(c.raw as number),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.muted, maxTicksLimit: 12, font: { family: "IBM Plex Mono" } }, border: { color: C.line } },
      y: {
        grid: { color: C.line },
        ticks: { color: C.muted, font: { family: "IBM Plex Mono" }, callback: (v: string | number) => yfmt(Number(v)), maxTicksLimit: 6 },
        border: { display: false },
      },
    },
  };
}

export default function LockInModel({ scenarios }: { scenarios: Scenario[] }) {
  const [p, setP] = useState<LockInParams>(LOCK_IN_PRESETS.genzDefault.p);
  const [name, setName] = useState("");
  const [, start] = useTransition();

  const { rows, summary } = useMemo(() => simulateLockIn(p), [p]);
  const labels = rows.map((r) => r.m);
  const set = (k: keyof LockInParams, v: number) => setP((s) => ({ ...s, [k]: v }));

  const kpis = [
    {
      l: `AUM at Year ${p.horizonYears}`,
      v: fmtMoney(summary.finalAum),
      s: `vs ${fmtMoney(summary.publicAumComparison)} 401(k)`,
      cls: "text-amber-ink",
      icon: TrendingUp,
    },
    {
      l: "Weighted Lockup",
      v: `${summary.weightedAvgLockYears.toFixed(1)} Years`,
      s: "predictable liability duration",
      cls: "text-blue",
      icon: Lock,
    },
    {
      l: "Institutional Retention",
      v: `${summary.stickyCapitalRatio.toFixed(1)}%`,
      s: "locked capital safe from run",
      cls: "text-good",
      icon: ShieldCheck,
    },
    {
      l: "GenZ Wealth Surplus",
      v: `+${fmtMoney(summary.userWealthSurplus)}`,
      s: `+${summary.userWealthSurplusPct.toFixed(1)}% excess PE yield`,
      cls: "text-teal",
      icon: Award,
    },
    {
      l: "PE Capital Gap Filled",
      v: fmtMoney(summary.totalPEGapFilled),
      s: "institutional LP pool created",
      cls: "text-purple",
      icon: Building2,
    },
    {
      l: "Breadbox Annual Revenue",
      v: fmtMoney(summary.totalBreadboxAnnualRev),
      s: `at ${p.breadboxSpread}% LP spread`,
      cls: "",
      icon: TrendingUp,
    },
  ];

  const groups = Array.from(new Set(LOCK_IN_FIELDS.map((f) => f.group)));

  const stackedOpts = baseOptions(fmtMoney);
  (stackedOpts.scales.y as { stacked?: boolean }).stacked = true;
  (stackedOpts.scales.x as { stacked?: boolean }).stacked = true;

  const lineOpts = baseOptions(fmtMoney);

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
              {Object.entries(LOCK_IN_PRESETS).map(([k, v]) => (
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
                      onClick={() => setP({ ...LOCK_IN_PRESETS.genzDefault.p, ...(s.params as Partial<LockInParams>) })}
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
                start(() => saveScenario(name.trim(), "lock_in", p));
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
              {LOCK_IN_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`lock-${f.key}`} className="text-[12.5px] text-ink-2">
                      {f.label}
                    </label>
                    <input
                      id={`lock-${f.key}`}
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
          <div className="rounded-xl border border-amber/30 bg-amber-soft p-4 text-[13.5px]">
            <div className="font-semibold text-amber-ink mb-1 flex items-center gap-2">
              <Lock size={16} />
              The Breadbox Liability Advantage
            </div>
            <p className="text-ink-2">
              By locking GenZ contributions across <b className="num text-ink">3 to 20 years</b>, Breadbox builds a predictable institutional capital pool of <b className="num text-ink">{fmtMoney(summary.finalAum)}</b> with a weighted lockup duration of <b className="num text-ink">{summary.weightedAvgLockYears.toFixed(1)} years</b>. Private Equity managers get locked LP commitments they desperately need, while GenZ users earn an additional <b className="num text-ink">{fmtMoney(summary.userWealthSurplus)}</b> (+{summary.userWealthSurplusPct.toFixed(1)}%) in wealth compared to traditional public stock 401(k)s.
            </p>
          </div>

          {/* Chart 1: Lockup Duration Waterfall */}
          <div className="card p-4">
            <ChartHead
              title="Liability Profile & Lockup Duration Waterfall"
              legend={[
                ["3-Year Lock", C.amber],
                ["5-Year Lock", C.teal],
                ["10-Year Lock", C.blue],
                ["20-Year Lock", C.purple],
              ]}
            />
            <div className="h-[300px]">
              <Bar
                data={{
                  labels,
                  datasets: [
                    { label: "3-Yr Lock", data: rows.map((r) => r.locked3y), backgroundColor: C.amber, stack: "l" },
                    { label: "5-Yr Lock", data: rows.map((r) => r.locked5y), backgroundColor: C.teal, stack: "l" },
                    { label: "10-Yr Lock", data: rows.map((r) => r.locked10y), backgroundColor: C.blue, stack: "l" },
                    { label: "20-Yr Lock", data: rows.map((r) => r.locked20y), backgroundColor: C.purple, stack: "l" },
                  ],
                }}
                options={stackedOpts}
              />
            </div>
          </div>

          {/* Chart 2 & 3 Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Wealth Comparison */}
            <div className="card p-4">
              <ChartHead
                title="Wealth Compounder: PE Vault vs 401(k)"
                legend={[
                  ["Breadbox PE Vault", C.amber],
                  ["Standard 401(k) Index", C.muted],
                ]}
              />
              <div className="h-[240px]">
                <Line
                  data={{
                    labels,
                    datasets: [
                      {
                        label: "Breadbox PE Vault",
                        data: rows.map((r) => r.totalAum),
                        borderColor: C.amber,
                        backgroundColor: C.amberSoft,
                        fill: "origin",
                        borderWidth: 2,
                        pointRadius: 0,
                      },
                      {
                        label: "Standard 401(k)",
                        data: rows.map((r) => r.publicAum),
                        borderColor: C.muted,
                        borderDash: [4, 4],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                      },
                    ],
                  }}
                  options={lineOpts}
                />
              </div>
            </div>

            {/* PE Capital Asset Deployment */}
            <div className="card p-4">
              <ChartHead
                title="PE Capital Deployment Allocation"
                legend={[
                  ["Private Credit", C.teal],
                  ["PE Buyouts", C.blue],
                  ["Real Assets", C.purple],
                  ["Growth Equity", C.amber],
                ]}
              />
              <div className="h-[240px] flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ["Private Credit (35%)", "PE Buyouts (35%)", "Real Assets (15%)", "Growth Equity (15%)"],
                    datasets: [
                      {
                        data: [
                          summary.peAllocations.privateCredit,
                          summary.peAllocations.buyouts,
                          summary.peAllocations.realAssets,
                          summary.peAllocations.growthEquity,
                        ],
                        backgroundColor: [C.teal, C.blue, C.purple, C.amber],
                        borderColor: C.surface,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: "right", labels: { color: C.ink, font: { family: "IBM Plex Sans", size: 11.5 } } },
                      tooltip: {
                        backgroundColor: C.surface,
                        borderColor: C.line,
                        borderWidth: 1,
                        callbacks: {
                          label: (c) => ` ${c.label}: ${fmtMoney(c.raw as number)}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Month-by-Month Data Table */}
          <details className="card px-4">
            <summary className="py-3 cursor-pointer font-medium text-[13.5px]">
              Month-by-month trajectory table ({rows.length} months)
            </summary>
            <div className="overflow-x-auto pb-3">
              <table className="w-full text-[12px] num">
                <thead>
                  <tr className="text-muted border-b border-line">
                    {[
                      "Mo",
                      "Accounts",
                      "Monthly Dep",
                      "Total AUM",
                      "3y Lock",
                      "5y Lock",
                      "10y Lock",
                      "20y Lock",
                      "12m Unlock",
                      "Sticky %",
                      "401(k) Bench",
                      "BB Rev/mo",
                    ].map((h) => (
                      <th key={h} className="text-right first:text-left font-medium px-2 py-1.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.m} className="border-b border-line/60 hover:bg-hover">
                      <td className="px-2 py-1 text-left">{r.m}</td>
                      <td className="px-2 py-1 text-right">{fmtNum(r.users)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.monthlyDeposits)}</td>
                      <td className="px-2 py-1 text-right font-medium text-amber-ink">{fmtMoney(r.totalAum)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.locked3y)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.locked5y)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.locked10y)}</td>
                      <td className="px-2 py-1 text-right">{fmtMoney(r.locked20y)}</td>
                      <td className="px-2 py-1 text-right text-muted">{fmtMoney(r.unlockingNext12m)}</td>
                      <td className="px-2 py-1 text-right text-good">{r.stickyRatio.toFixed(1)}%</td>
                      <td className="px-2 py-1 text-right text-muted">{fmtMoney(r.publicAum)}</td>
                      <td className="px-2 py-1 text-right text-teal">{fmtMoney(r.breadboxRevMo)}</td>
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
