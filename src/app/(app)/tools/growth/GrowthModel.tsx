"use client";

import { useMemo, useState, useTransition } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { PRESETS, FIELDS, simulate, required, type Params } from "@/lib/growth";
import type { Scenario } from "@/lib/types";
import { fmtMoney, fmtNum } from "@/lib/format";
import { saveScenario, deleteScenario } from "@/app/actions";
import { Save, X } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const C = { amber: "#e0a040", amberSoft: "rgba(224,160,64,.18)", teal: "#2fb59b", tealSoft: "rgba(47,181,155,.18)", blue: "#7c9bf0", blueSoft: "rgba(124,155,240,.18)", crit: "#e27a72", muted: "#8f867a", line: "#2e2a24", ink: "#ede7dc", surface: "#232019" };

function base(yfmt: (v: number) => string) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false as const, interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: C.surface, titleColor: C.ink, bodyColor: C.ink, borderColor: C.line, borderWidth: 1, padding: 10,
        callbacks: { title: (i: { label: string }[]) => "Month " + i[0].label, label: (c: { dataset: { label?: string; fmt?: (v: number) => string }; raw: unknown }) => " " + c.dataset.label + ": " + (c.dataset.fmt || yfmt)(c.raw as number) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: C.muted, maxTicksLimit: 13, font: { family: "IBM Plex Mono" } }, border: { color: C.line } },
      y: { grid: { color: C.line }, ticks: { color: C.muted, font: { family: "IBM Plex Mono" }, callback: (v: string | number) => yfmt(Number(v)), maxTicksLimit: 6 }, border: { display: false } },
    },
  };
}

export default function GrowthModel({ scenarios }: { scenarios: Scenario[] }) {
  const [p, setP] = useState<Params>(PRESETS.robinhood.p);
  const [name, setName] = useState("");
  const [, start] = useTransition();
  const rows = useMemo(() => simulate(p), [p]);
  const labels = rows.map((r) => r.m);
  const set = (k: keyof Params, v: number) => setP((s) => ({ ...s, [k]: v }));

  const atT = rows[Math.min(p.tmonth, rows.length) - 1];
  const hitRow = rows.find((r) => r.aum >= p.target);
  const beRow = rows.find((r) => r.net > 0 && r.m > 1);
  const low = rows.reduce((a, r) => Math.min(a, r.cash), 0);
  const cashPos = rows.find((r) => r.cash >= 0);
  const last = rows[rows.length - 1];
  const hit = !!hitRow && hitRow.m <= p.tmonth;
  const req = required(p);

  const kpis = [
    { l: `AUM at month ${p.tmonth}`, v: fmtMoney(atT.aum), s: `target ${fmtMoney(p.target)}`, cls: hit ? "text-good" : "text-crit" },
    { l: `Hits ${fmtMoney(p.target)}`, v: hitRow ? `Month ${hitRow.m}` : "Never", s: hitRow ? `${fmtNum(hitRow.users)} accounts` : `within ${p.horizon} mo`, cls: hit ? "text-good" : hitRow ? "" : "text-crit" },
    { l: `Users at month ${p.tmonth}`, v: fmtNum(atT.users), s: `${fmtNum(atT.contributors)} still contributing`, cls: "" },
    { l: "Monthly profit from", v: beRow ? `Month ${beRow.m}` : "Never", s: beRow ? `rev ${fmtMoney(beRow.rev)} vs cost ${fmtMoney(beRow.cost)}` : "revenue < costs all horizon", cls: beRow ? "" : "text-crit" },
    { l: "Capital to raise", v: fmtMoney(-low), s: `lowest cash point${cashPos ? `, back to 0 by mo ${cashPos.m}` : ""}`, cls: "text-crit" },
    { l: `AUM at month ${p.horizon}`, v: fmtMoney(last.aum), s: `annual mgmt fee ${fmtMoney((last.aum * p.mgmt) / 100)}`, cls: "" },
  ];

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));
  const aumOpts = base(fmtMoney); (aumOpts.scales.y as { stacked?: boolean }).stacked = true;
  const pnlOpts = base(fmtMoney); (pnlOpts.scales.x as { stacked?: boolean }).stacked = true; (pnlOpts.scales.y as { stacked?: boolean }).stacked = true;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div key={k.l} className="card p-3.5 min-w-0"><div className="eyebrow">{k.l}</div><div className={`num text-[21px] font-semibold mt-1 truncate ${k.cls}`}>{k.v}</div><div className="text-muted text-[12px] mt-0.5 truncate">{k.s}</div></div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr] items-start">
        <aside className="card p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto space-y-4">
          <div>
            <div className="eyebrow mb-2">Presets</div>
            <div className="flex flex-wrap gap-1.5">{Object.entries(PRESETS).map(([k, v]) => <button key={k} className="btn btn-sm" onClick={() => setP(v.p)}>{v.label}</button>)}</div>
          </div>
          {scenarios.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Saved scenarios</div>
              <div className="space-y-1">{scenarios.map((s) => (
                <div key={s.id} className="flex items-center gap-1 group">
                  <button className="btn btn-sm flex-1 justify-start truncate" onClick={() => setP({ ...PRESETS.robinhood.p, ...(s.params as Partial<Params>) })}>{s.name}</button>
                  <button className="btn btn-ghost btn-sm btn-danger opacity-0 group-hover:opacity-100" onClick={() => start(() => deleteScenario(s.id))} aria-label="Delete"><X size={12} /></button>
                </div>))}</div>
            </div>
          )}
          <div className="flex gap-1.5">
            <input className="input !py-1.5 text-[13px]" placeholder="Save current as…" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-sm shrink-0" disabled={!name.trim()} onClick={() => { start(() => saveScenario(name.trim(), "growth", p)); setName(""); }}><Save size={13} />Save</button>
          </div>
          {groups.map((g) => (
            <div key={g}>
              <div className="eyebrow mb-2 mt-2">{g}</div>
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`f-${f.key}`} className="text-[12.5px] text-ink-2">{f.label}</label>
                    <input id={`f-${f.key}`} type="number" className="input !w-24 !py-1 !px-2 num text-[12.5px] text-right" value={p[f.key]} step={f.step} onChange={(e) => set(f.key, parseFloat(e.target.value) || 0)} />
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step} value={p[f.key]} onChange={(e) => set(f.key, parseFloat(e.target.value))} aria-label={f.label} />
                  {f.hint && <div className="text-[11px] text-muted -mt-0.5">{f.hint}</div>}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <div className="space-y-4 min-w-0">
          <div className="rounded-xl bg-amber-soft p-4 text-[13.5px]">
            <div className="font-semibold mb-1">What {fmtMoney(p.target)} in {p.tmonth} months actually takes</div>
            <p className="text-ink-2">At <b className="num text-ink">${p.contrib}/mo</b> per user with a <b className="num text-ink">${p.initdep}</b> opening deposit, users onboarded evenly across {p.tmonth} months average <b className="num text-ink">{fmtMoney(req.perUser)}</b> each by month {p.tmonth}. So you need about <b className="num text-ink">{fmtNum(req.users)}</b> paying users — <b className="num text-ink">{fmtNum(req.perMonth)}</b> signing up every month — which at a <b className="num text-ink">${p.cac}</b> CAC is <b className="num text-ink">{fmtMoney(req.spend)}</b> of marketing (<b className="num text-ink">{fmtMoney(req.mktPerMonth)}</b>/mo). This scenario spends {fmtMoney(p.mkt)}/mo and lands at {fmtMoney(atT.aum)}.</p>
          </div>

          <div className="card p-4">
            <Head title="Fund AUM" legend={[["Contributed capital (net of redemptions)", C.amber], ["Investment growth (net of fund fees)", C.teal], ["Target", C.muted]]} />
            <div className="h-[300px]"><Line data={{ labels, datasets: [
              { label: "Contributed capital", data: rows.map((r) => r.capital), borderColor: C.amber, backgroundColor: C.amberSoft, fill: "origin", borderWidth: 2, pointRadius: 0, stack: "a" },
              { label: "Investment growth", data: rows.map((r) => r.growth), borderColor: C.teal, backgroundColor: C.tealSoft, fill: "-1", borderWidth: 2, pointRadius: 0, stack: "a" },
              { label: "Target", data: rows.map(() => p.target), borderColor: C.muted, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false, stack: "t" },
            ] }} options={aumOpts} /></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <Head title="Users" legend={[["Still contributing", C.amber], ["Total accounts", C.blue]]} />
              <div className="h-[230px]"><Line data={{ labels, datasets: [
                { label: "Total accounts", data: rows.map((r) => r.users), borderColor: C.blue, borderWidth: 2, pointRadius: 0, fmt: fmtNum },
                { label: "Still contributing", data: rows.map((r) => r.contributors), borderColor: C.amber, borderWidth: 2, pointRadius: 0, fmt: fmtNum },
              ] as never }} options={base(fmtNum)} /></div>
            </div>
            <div className="card p-4">
              <Head title="Management co. · monthly P&L" legend={[["Revenue", C.teal], ["Costs", C.crit]]} />
              <div className="h-[230px]"><Bar data={{ labels, datasets: [
                { label: "Revenue", data: rows.map((r) => r.rev), backgroundColor: C.teal, borderRadius: 3, borderSkipped: false },
                { label: "Costs", data: rows.map((r) => -r.cost), backgroundColor: C.crit, borderRadius: 3, borderSkipped: false, fmt: (v: number) => fmtMoney(-v) },
                { label: "Net", data: rows.map((r) => r.net), type: "line", borderColor: C.ink, borderWidth: 1.5, pointRadius: 0, stack: "n" },
              ] as never }} options={pnlOpts} /></div>
            </div>
          </div>

          <div className="card p-4">
            <Head title="Management co. · cumulative cash (what we need to raise)" legend={[["Cumulative cash after launch cost", C.blue]]} />
            <div className="h-[230px]"><Line data={{ labels, datasets: [{ label: "Cumulative cash", data: rows.map((r) => r.cash), borderColor: C.blue, backgroundColor: C.blueSoft, fill: "origin", borderWidth: 2, pointRadius: 0 }] }} options={base(fmtMoney)} /></div>
          </div>

          <details className="card px-4">
            <summary className="py-3 cursor-pointer font-medium text-[13.5px]">Month-by-month table</summary>
            <div className="overflow-x-auto pb-3">
              <table className="w-full text-[12px] num">
                <thead><tr className="text-muted">{["Month", "New users", "Total users", "Contributing", "Deposits", "Growth", "Fund fees", "Waiver", "AUM", "Mgmt fee rev", "Total rev", "Costs", "Net", "Cum. cash"].map((h) => <th key={h} className="text-right first:text-left font-medium px-2 py-1.5 border-b border-line whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.m} className="border-b border-line/60">
                    <td className="px-2 py-1">{r.m}</td><td className="px-2 py-1 text-right">{fmtNum(r.newU)}</td><td className="px-2 py-1 text-right">{fmtNum(r.users)}</td><td className="px-2 py-1 text-right">{fmtNum(r.contributors)}</td>
                    <td className="px-2 py-1 text-right">{fmtMoney(r.contrib)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.gross)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.fundExp)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.waiver)}</td>
                    <td className="px-2 py-1 text-right">{fmtMoney(r.aum)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.mgmtFee)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.rev)}</td><td className="px-2 py-1 text-right">{fmtMoney(r.cost)}</td>
                    <td className={`px-2 py-1 text-right ${r.net < 0 ? "text-crit" : ""}`}>{fmtMoney(r.net)}</td><td className={`px-2 py-1 text-right ${r.cash < 0 ? "text-crit" : ""}`}>{fmtMoney(r.cash)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </details>

          <div className="text-muted text-[12px] max-w-[90ch]">
            <b className="text-ink-2">Not modeled:</b> leverage and its interest expense (pushes Cliffwater-type gross ratios to 2.6–2.9%), return volatility, payment processing on deposits (~0.5–1% card, less on ACH), distribution/12b-1 fees, blue-sky fees, taxes on the management company, and the pre-launch year — the clock starts at the first deposit.
          </div>
        </div>
      </div>
    </div>
  );
}

function Head({ title, legend }: { title: string; legend: [string, string][] }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
      <h3 className="font-semibold text-[14.5px]">{title}</h3>
      <div className="flex flex-wrap gap-3 text-[12px] text-muted">{legend.map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: c }} />{l}</span>)}</div>
    </div>
  );
}
