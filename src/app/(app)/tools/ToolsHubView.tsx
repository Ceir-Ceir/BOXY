"use client";

import Link from "next/link";
import { LineChart, Lock, Zap, ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import type { Scenario } from "@/lib/types";
import { fmtDate } from "@/lib/format";

const TOOLS = [
  {
    href: "/tools/growth",
    toolKey: "growth",
    title: "Growth & Unit Economics Model",
    desc: "AUM path to $100M, CAC, user churn, fee stack, expense-cap waiver, and cash needed for the management company.",
    badge: "AUM & Runway",
    icon: LineChart,
    highlights: ["Interactive CAC vs Organic growth sliders", "Expense-cap waiver reimbursement math", "Cumulative cash burn calculator"],
  },
  {
    href: "/tools/lock-in",
    toolKey: "lock_in",
    title: "PE Liability Profile & Lock-In Duration Simulator",
    desc: "Model how time-locked GenZ retirement commitments (3, 5, 10, 20 year locks) create an institutional LP liability profile for Private Equity.",
    badge: "Liability & PE Locks",
    icon: Lock,
    highlights: ["Weighted lockup duration calculator", "GenZ PE Yield surplus vs 401(k) benchmark", "PE Asset deployment allocation breakdown"],
  },
  {
    href: "/tools/pe-flywheel",
    toolKey: "pe_flywheel",
    title: "PE Institutional Gap & Flywheel Economics",
    desc: "Model how Breadbox fills Private Equity's LP capital shortage while capturing management fees, placement spreads, and GP carry share.",
    badge: "Flywheel & Carry Spread",
    icon: Zap,
    highlights: ["PE LP Macro gap fill % calculator", "Revenue stack split (Mgmt + Placement + Carry)", "5x5 Sensitivity heatmap matrix"],
  },
];

export default function ToolsHubView({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {TOOLS.map((t) => {
          const toolScenarios = scenarios.filter((s) => s.tool === t.toolKey);
          return (
            <div key={t.href} className="card p-5 flex flex-col justify-between hover:border-line-strong transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="size-10 rounded-lg bg-amber-soft flex items-center justify-center text-amber-ink">
                    <t.icon size={20} />
                  </div>
                  <span className="pill pill-in_progress">{t.badge}</span>
                </div>

                <h3 className="font-semibold text-[16px] group-hover:text-amber-ink transition-colors flex items-center gap-1.5">
                  {t.title}
                </h3>
                <p className="text-muted text-[13px] mt-2 line-clamp-3">{t.desc}</p>

                <div className="mt-4 space-y-1.5">
                  {t.highlights.map((h, i) => (
                    <div key={i} className="text-[12px] text-ink-2 flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-good shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                <span className="text-[12px] text-muted">
                  {toolScenarios.length} saved scenario{toolScenarios.length === 1 ? "" : "s"}
                </span>
                <Link href={t.href} className="btn btn-sm btn-primary">
                  Open Model <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Scenarios Comparison Hub */}
      {scenarios.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[15px] flex items-center gap-2">
              <Layers size={17} className="text-amber" />
              Saved Scenario Library Across All Models
            </h3>
            <span className="text-[12px] text-muted">{scenarios.length} total saved</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="text-left py-2 font-medium">Scenario Name</th>
                  <th className="text-left py-2 font-medium">Tool Model</th>
                  <th className="text-left py-2 font-medium">Key Parameters Saved</th>
                  <th className="text-right py-2 font-medium">Created</th>
                  <th className="text-right py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const toolInfo = TOOLS.find((t) => t.toolKey === s.tool);
                  const paramKeys = Object.keys(s.params || {}).slice(0, 4).join(", ");
                  return (
                    <tr key={s.id} className="border-b border-line/60 hover:bg-hover">
                      <td className="py-2.5 font-medium text-amber-ink">{s.name}</td>
                      <td className="py-2.5">
                        <span className="pill pill-pitched">{toolInfo?.badge || s.tool}</span>
                      </td>
                      <td className="py-2.5 text-muted text-[12px] max-w-[280px] truncate">
                        {paramKeys}...
                      </td>
                      <td className="py-2.5 text-right text-muted num text-[12px]">
                        {fmtDate(s.created_at, "MMM d, yyyy")}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link href={toolInfo?.href || "/tools/growth"} className="btn btn-sm">
                          Load in {toolInfo?.badge || "Model"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
