"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  Save,
  Copy,
  Trash2,
  RotateCcw,
  Download,
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  TrendingDown,
  HelpCircle,
  FileSpreadsheet,
  Edit2,
  Calendar,
} from "lucide-react";
import {
  calculateCapTable,
  DEFAULT_CONFIG,
  GLOSSARY,
  exportCapTableCsv,
  exportExitTableCsv,
  fmtMoneyExact,
  fmtPricePerShare,
  fmtShares,
  fmtPercent,
  type CapTableConfig,
  type Founder,
  type Round,
  type SafeRound,
  type PricedRound,
} from "@/lib/capTable";
import type { CapScenario } from "@/lib/types";
import {
  saveCapScenario,
  renameCapScenario,
  deleteCapScenario,
} from "@/app/actions";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const PALETTE = [
  "#e0a040", // Amber (Ej)
  "#2fb59b", // Teal (Chris)
  "#7c9bf0", // Blue (Pool)
  "#e27a72", // Crit/Coral
  "#a78bfa", // Purple
  "#f472b6", // Pink
  "#38bdf8", // Sky
  "#fbbf24", // Warm Yellow
  "#34d399", // Mint
];

export default function CapTableModel({
  initialScenarios,
}: {
  initialScenarios: CapScenario[];
}) {
  const [config, setConfig] = useState<CapTableConfig>(DEFAULT_CONFIG);
  const [scenarios, setScenarios] = useState<CapScenario[]>(initialScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    initialScenarios[0]?.id ?? null
  );

  // Modal / Action states
  const [saveName, setSaveName] = useState("");
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [activeTab, setActiveTab] = useState<"table" | "chart" | "waterfall">("table");
  const [, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Pure cap table calculation
  const model = useMemo(() => calculateCapTable(config), [config]);

  // Show status feedback
  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Scenario Handlers
  const handleLoadScenario = (sc: CapScenario) => {
    setSelectedScenarioId(sc.id);
    if (sc.config) {
      setConfig(sc.config);
      notify(`Loaded scenario "${sc.name}"`);
    }
  };

  const handleSaveCurrent = () => {
    if (!selectedScenarioId) {
      setShowSaveAsModal(true);
      return;
    }
    const current = scenarios.find((s) => s.id === selectedScenarioId);
    const name = current ? current.name : "Base Case";
    startTransition(async () => {
      try {
        await saveCapScenario(name, config, selectedScenarioId);
        notify(`Saved scenario "${name}"`);
      } catch (err) {
        console.error(err);
        notify("Saved locally in session");
      }
    });
  };

  const handleSaveAs = (name: string) => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const saved = await saveCapScenario(name.trim(), config);
        const newScenario: CapScenario = {
          id: saved?.id || String(Date.now()),
          name: name.trim(),
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setScenarios([newScenario, ...scenarios]);
        setSelectedScenarioId(newScenario.id);
        setShowSaveAsModal(false);
        notify(`Created scenario "${name.trim()}"`);
      } catch (err) {
        console.error(err);
        const localScenario: CapScenario = {
          id: String(Date.now()),
          name: name.trim(),
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setScenarios([localScenario, ...scenarios]);
        setSelectedScenarioId(localScenario.id);
        setShowSaveAsModal(false);
        notify(`Saved locally as "${name.trim()}"`);
      }
    });
  };

  const handleRename = (name: string) => {
    if (!selectedScenarioId || !name.trim()) return;
    startTransition(async () => {
      try {
        await renameCapScenario(selectedScenarioId, name.trim());
        setScenarios((prev) =>
          prev.map((s) => (s.id === selectedScenarioId ? { ...s, name: name.trim() } : s))
        );
        setShowRenameModal(false);
        notify(`Renamed to "${name.trim()}"`);
      } catch (err) {
        console.error(err);
        setScenarios((prev) =>
          prev.map((s) => (s.id === selectedScenarioId ? { ...s, name: name.trim() } : s))
        );
        setShowRenameModal(false);
        notify(`Renamed locally to "${name.trim()}"`);
      }
    });
  };

  const handleDelete = () => {
    if (!selectedScenarioId) return;
    const toDelete = selectedScenarioId;
    startTransition(async () => {
      try {
        await deleteCapScenario(toDelete);
      } catch (err) {
        console.error(err);
      }
      const remaining = scenarios.filter((s) => s.id !== toDelete);
      setScenarios(remaining);
      setSelectedScenarioId(remaining[0]?.id || null);
      if (remaining[0]) {
        setConfig(remaining[0].config);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
      notify("Scenario deleted");
    });
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setSelectedScenarioId(null);
    notify("Reset model to default parameters");
  };

  // Exports
  const handleExportCapTable = () => {
    const csv = exportCapTableCsv(model);
    downloadCsv(csv, "breadbox-cap-table-by-round.csv");
    notify("Exported Cap Table CSV");
  };

  const handleExportExitTable = () => {
    const csv = exportExitTableCsv(model);
    downloadCsv(csv, "breadbox-exit-waterfall.csv");
    notify("Exported Exit Waterfall CSV");
  };

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Config updates
  const setCompany = (patch: Partial<CapTableConfig["company"]>) => {
    setConfig((c) => ({ ...c, company: { ...c.company, ...patch } }));
  };

  const setFounders = (founders: Founder[]) => {
    setConfig((c) => ({ ...c, founders }));
  };

  const setRounds = (rounds: Round[]) => {
    setConfig((c) => ({ ...c, rounds }));
  };

  const setExit = (patch: Partial<CapTableConfig["exit"]>) => {
    setConfig((c) => ({ ...c, exit: { ...c.exit, ...patch } }));
  };

  // Founder inputs
  const totalFounderShares = config.founders.reduce((s, f) => s + (f.shares || 0), 0);
  const unissuedShares = Math.max(0, config.company.authorizedShares - model.currentPostMoneyShares);
  const totalPurchaseCost = totalFounderShares * config.company.parValue;

  const updateFounderShares = (id: string, newShares: number) => {
    const updated = config.founders.map((f) =>
      f.id === id ? { ...f, shares: Math.max(0, Math.round(newShares)) } : f
    );
    setFounders(updated);
  };

  const updateFounderPercent = (id: string, newPct: number) => {
    // When editing percent: if there are 2 founders, update the target % and derive shares
    const currentTotal = totalFounderShares || 8_000_000;
    const newShares = Math.round((newPct / 100) * currentTotal);
    const updated = config.founders.map((f) =>
      f.id === id ? { ...f, shares: Math.max(0, newShares) } : f
    );
    setFounders(updated);
  };

  const addFounder = () => {
    const newId = `f-${Date.now()}`;
    const newFounder: Founder = {
      id: newId,
      name: `Founder ${config.founders.length + 1}`,
      shares: 1_000_000,
      vestingYears: 4,
      cliffMonths: 12,
      startDate: "2024-01-01",
    };
    setFounders([...config.founders, newFounder]);
  };

  const removeFounder = (id: string) => {
    if (config.founders.length <= 1) return;
    setFounders(config.founders.filter((f) => f.id !== id));
  };

  // Round inputs
  const addSafeRound = () => {
    const newRound: SafeRound = {
      id: `r-${Date.now()}`,
      type: "safe",
      name: `SAFE ${config.rounds.filter((r) => r.type === "safe").length + 1}`,
      amount: 500_000,
      valuationCap: 10_000_000,
      discountPercent: 0,
    };
    setRounds([...config.rounds, newRound]);
  };

  const addPricedRound = () => {
    const newRound: PricedRound = {
      id: `r-${Date.now()}`,
      type: "priced",
      name: `Series ${String.fromCharCode(65 + config.rounds.filter((r) => r.type === "priced").length)}`,
      amount: 5_000_000,
      valuationMode: "pre",
      preMoneyValuation: 20_000_000,
      postMoneyValuation: 25_000_000,
      poolTargetPercent: 10,
      poolTiming: "pre-money",
    };
    setRounds([...config.rounds, newRound]);
  };

  const updateRound = (id: string, patch: Record<string, unknown>) => {
    const updated = config.rounds.map((r) => {
      if (r.id !== id) return r;
      if (r.type === "safe") {
        return { ...r, ...patch } as SafeRound;
      } else {
        const pr = { ...r, ...patch } as PricedRound;
        // Derive pre or post when one is edited
        if ("preMoneyValuation" in patch && patch.preMoneyValuation != null) {
          pr.postMoneyValuation = pr.preMoneyValuation + pr.amount;
        } else if ("postMoneyValuation" in patch && patch.postMoneyValuation != null) {
          pr.preMoneyValuation = Math.max(0, pr.postMoneyValuation - pr.amount);
        } else if ("amount" in patch && patch.amount != null) {
          if (pr.valuationMode === "post") {
            pr.preMoneyValuation = Math.max(0, pr.postMoneyValuation - pr.amount);
          } else {
            pr.postMoneyValuation = pr.preMoneyValuation + pr.amount;
          }
        }
        return pr;
      }
    });
    setRounds(updated);
  };

  const moveRound = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= config.rounds.length) return;
    const copy = [...config.rounds];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setRounds(copy);
  };

  const removeRound = (id: string) => {
    setRounds(config.rounds.filter((r) => r.id !== id));
  };

  // Exit scenarios
  const updateExitValue = (index: number, val: number) => {
    const updated = [...config.exit.exitValues];
    updated[index] = Math.max(0, val);
    setExit({ exitValues: updated });
  };

  const addExitValue = () => {
    const highest = Math.max(...config.exit.exitValues, 100_000_000);
    setExit({ exitValues: [...config.exit.exitValues, highest * 2] });
  };

  const removeExitValue = (index: number) => {
    if (config.exit.exitValues.length <= 1) return;
    const updated = config.exit.exitValues.filter((_, i) => i !== index);
    setExit({ exitValues: updated });
  };

  // Chart setup
  const chartLabels = model.stages.map((s) => s.stageName);
  const chartHolderIds = Object.keys(model.stages[model.stages.length - 1]?.cells || {});

  const chartDatasets = chartHolderIds
    .filter((id) => {
      // Exclude zero-share pending safes from chart
      const lastCell = model.stages[model.stages.length - 1]?.cells[id];
      return !lastCell?.isPendingSafe;
    })
    .map((id, idx) => {
      const firstCell = model.stages.find((s) => s.cells[id])?.cells[id];
      const label = firstCell?.holderName || id;
      const color = PALETTE[idx % PALETTE.length];

      return {
        label,
        data: model.stages.map((s) => s.cells[id]?.ownershipPercent || 0),
        backgroundColor: color,
        borderWidth: 0,
        stack: "ownership",
      };
    });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#ede7dc",
          font: { family: "IBM Plex Sans", size: 12 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "#1b1917",
        titleColor: "#ede7dc",
        bodyColor: "#ede7dc",
        borderColor: "#2e2a24",
        borderWidth: 1,
        callbacks: {
          label: (item: { dataset: { label?: string }; raw: unknown }) =>
            ` ${item.dataset.label}: ${Number(item.raw).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: "#8f867a", font: { family: "IBM Plex Sans" } },
        border: { color: "#2e2a24" },
      },
      y: {
        stacked: true,
        max: 100,
        grid: { color: "#2e2a24" },
        ticks: {
          color: "#8f867a",
          callback: (v: string | number) => `${v}%`,
          font: { family: "IBM Plex Mono" },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {statusMsg && (
        <div className="rounded-lg bg-amber-soft border border-amber/30 px-4 py-2.5 text-[13px] text-amber-ink flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-amber" />
            {statusMsg}
          </span>
          <button onClick={() => setStatusMsg(null)} className="text-muted hover:text-ink text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* TOP SCENARIO CONTROL BAR */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 bg-surface border-line">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow flex items-center gap-1.5 mr-1">
            <FileSpreadsheet size={14} className="text-amber" />
            Scenario:
          </span>

          <select
            className="input !py-1 !px-2.5 !w-auto text-[13px] font-medium"
            value={selectedScenarioId || ""}
            onChange={(e) => {
              const sc = scenarios.find((s) => s.id === e.target.value);
              if (sc) handleLoadScenario(sc);
            }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {scenarios.length === 0 && <option value="">Default (Unsaved)</option>}
          </select>

          <button
            onClick={handleSaveCurrent}
            className="btn btn-sm btn-primary"
            title="Save changes to this scenario"
          >
            <Save size={13} /> Save
          </button>

          <button
            onClick={() => {
              setSaveName(
                (scenarios.find((s) => s.id === selectedScenarioId)?.name || "Base Case") + " (Copy)"
              );
              setShowSaveAsModal(true);
            }}
            className="btn btn-sm"
            title="Duplicate scenario as new entry"
          >
            <Copy size={13} /> Save As
          </button>

          {selectedScenarioId && (
            <button
              onClick={() => {
                const cur = scenarios.find((s) => s.id === selectedScenarioId);
                setRenameValue(cur?.name || "");
                setShowRenameModal(true);
              }}
              className="btn btn-sm btn-ghost"
              title="Rename scenario"
            >
              <Edit2 size={13} /> Rename
            </button>
          )}

          {selectedScenarioId && (
            <button
              onClick={handleDelete}
              className="btn btn-sm btn-ghost btn-danger"
              title="Delete scenario"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}

          <button
            onClick={handleResetDefaults}
            className="btn btn-sm btn-ghost text-muted hover:text-ink"
            title="Reset inputs to defaults"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCapTable} className="btn btn-sm" title="Export Cap Table to CSV">
            <Download size={13} /> Cap Table CSV
          </button>
          <button onClick={handleExportExitTable} className="btn btn-sm" title="Export Exit Table to CSV">
            <Download size={13} /> Exit Table CSV
          </button>
        </div>
      </div>

      {/* SAVE AS MODAL */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="card p-5 max-w-sm w-full space-y-4 border-line-strong shadow-2xl">
            <h3 className="font-semibold text-[15px]">Save Scenario As</h3>
            <p className="text-muted text-[12.5px]">
              Enter a name for this duplicate or custom scenario.
            </p>
            <input
              className="input"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Series A Optimistic"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-ghost" onClick={() => setShowSaveAsModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => handleSaveAs(saveName)}>
                Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="card p-5 max-w-sm w-full space-y-4 border-line-strong shadow-2xl">
            <h3 className="font-semibold text-[15px]">Rename Scenario</h3>
            <input
              className="input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New scenario name"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-ghost" onClick={() => setShowRenameModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => handleRename(renameValue)}>
                Confirm Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SANITY & DILUTION PANEL */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Authorized Check */}
        <div
          className={`card p-3.5 ${
            model.sanity.isAuthorizedExceeded
              ? "border-crit bg-crit-soft/20"
              : "border-line bg-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Authorized Shares</span>
            {model.sanity.isAuthorizedExceeded ? (
              <span className="pill pill-blocked">Over limit</span>
            ) : (
              <span className="pill pill-done">Sufficient</span>
            )}
          </div>
          <div className="num text-[20px] font-semibold mt-1">
            {fmtShares(model.sanity.totalIssued)}{" "}
            <span className="text-muted text-[13px] font-normal">
              / {fmtShares(model.sanity.authorized)}
            </span>
          </div>
          <div className="text-[12px] text-muted mt-0.5">
            {model.sanity.isAuthorizedExceeded ? (
              <span className="text-crit font-medium">
                Exceeded by {fmtShares(model.sanity.sharesToAuthorize)}! Must authorize more.
              </span>
            ) : (
              <span>{fmtShares(unissuedShares)} unissued shares remaining</span>
            )}
          </div>
        </div>

        {/* Card 2: Sum 100% */}
        <div className="card p-3.5 bg-surface border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Percentage Integrity</span>
            <span className="pill pill-done">100.0% Exact</span>
          </div>
          <div className="num text-[20px] font-semibold mt-1 text-good">
            100.0%
          </div>
          <div className="text-[12px] text-muted mt-0.5 truncate">
            All stages balance across fully diluted shares
          </div>
        </div>

        {/* Card 3: Post-Money Shares */}
        <div className="card p-3.5 bg-surface border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow">
              <TermWithTooltip term="fully diluted" label="Fully Diluted Shares" />
            </span>
            <span className="pill pill-pitched">Current</span>
          </div>
          <div className="num text-[20px] font-semibold mt-1">
            {fmtShares(model.currentPostMoneyShares)}
          </div>
          <div className="text-[12px] text-muted mt-0.5">
            Option pool: {fmtShares(model.currentTotalPoolShares)} (
            {fmtShares(model.grantedPoolShares)} granted)
          </div>
        </div>

        {/* Card 4: Plain English Progression */}
        <div className="card p-3.5 bg-surface border-line">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Founder Dilution</span>
            <TrendingDown size={14} className="text-amber-ink" />
          </div>
          <div className="mt-1 space-y-0.5 text-[12px]">
            {model.sanity.founderProgressionText.map((txt, i) => (
              <div key={i} className="text-ink font-medium truncate">
                {txt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INPUTS SECTION: Company, Founders, Rounds */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Column: Company & Founders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Company Card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-semibold text-[14.5px] flex items-center gap-1.5">
                <span>Company Capitalization</span>
              </h3>
              <span className="text-[11px] text-muted">Core Charter</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="eyebrow block mb-1">
                  Authorized Shares
                </label>
                <input
                  type="number"
                  className="input num text-right"
                  value={config.company.authorizedShares}
                  step={100_000}
                  onChange={(e) =>
                    setCompany({ authorizedShares: Math.max(1, parseInt(e.target.value) || 0) })
                  }
                />
              </div>

              <div>
                <label className="eyebrow block mb-1">
                  <TermWithTooltip term="par value" label="Par Value ($)" />
                </label>
                <input
                  type="number"
                  className="input num text-right"
                  value={config.company.parValue}
                  step={0.0001}
                  onChange={(e) =>
                    setCompany({ parValue: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                />
              </div>
            </div>

            <div className="rounded-md bg-raised p-2.5 text-[12px] flex items-center justify-between text-ink-2">
              <span>Total Founder Purchase Cost:</span>
              <span className="num font-semibold text-ink">
                {fmtMoneyExact(totalPurchaseCost)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="eyebrow">
                  Options Granted So Far
                </label>
                <span className="text-[11.5px] text-muted num">
                  Unallocated: {fmtShares(model.unallocatedPoolShares)}
                </span>
              </div>
              <input
                type="number"
                className="input num text-right"
                placeholder="Granted options count"
                value={config.company.grantedPoolShares}
                step={50_000}
                onChange={(e) =>
                  setCompany({ grantedPoolShares: Math.max(0, parseInt(e.target.value) || 0) })
                }
              />
            </div>
          </div>

          {/* Founders Card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <h3 className="font-semibold text-[14.5px]">Founders Equity</h3>
                <span className="text-[11.5px] text-muted">
                  Total Issued: {fmtShares(totalFounderShares)} shares
                </span>
              </div>

              {/* Mode Toggle: Shares vs % */}
              <div className="flex items-center gap-1 rounded-md bg-raised p-1 border border-line">
                <button
                  onClick={() => setConfig((c) => ({ ...c, founderInputMode: "shares" }))}
                  className={`btn btn-sm !py-0.5 !px-2 text-[11.5px] ${
                    config.founderInputMode === "shares" ? "btn-primary font-medium" : "btn-ghost"
                  }`}
                >
                  Shares
                </button>
                <button
                  onClick={() => setConfig((c) => ({ ...c, founderInputMode: "percent" }))}
                  className={`btn btn-sm !py-0.5 !px-2 text-[11.5px] ${
                    config.founderInputMode === "percent" ? "btn-primary font-medium" : "btn-ghost"
                  }`}
                >
                  % Mode
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {config.founders.map((f, i) => {
                const currentPct =
                  totalFounderShares > 0 ? (f.shares / totalFounderShares) * 100 : 0;
                const cost = f.shares * config.company.parValue;

                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg bg-raised border border-line/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ background: PALETTE[i % PALETTE.length] }}
                        />
                        <input
                          className="bg-transparent border-0 font-medium text-[13.5px] text-ink outline-none focus:ring-1 focus:ring-amber rounded px-1"
                          value={f.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFounders(
                              config.founders.map((x) => (x.id === f.id ? { ...x, name: val } : x))
                            );
                          }}
                        />
                      </div>

                      {config.founders.length > 1 && (
                        <button
                          onClick={() => removeFounder(f.id)}
                          className="btn btn-ghost btn-sm !p-1 text-muted hover:text-crit"
                          title="Remove founder"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {config.founderInputMode === "shares" ? (
                        <div>
                          <label className="text-[11px] text-muted block mb-0.5">Shares</label>
                          <input
                            type="number"
                            className="input !py-1 text-[12.5px] num text-right"
                            value={f.shares}
                            step={100_000}
                            onChange={(e) =>
                              updateFounderShares(f.id, parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] text-muted block mb-0.5">
                            % of Initial
                          </label>
                          <input
                            type="number"
                            className="input !py-1 text-[12.5px] num text-right"
                            value={Number(currentPct.toFixed(1))}
                            step={1}
                            onChange={(e) =>
                              updateFounderPercent(f.id, parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      )}

                      <div className="text-right flex flex-col justify-end">
                        <span className="text-[11px] text-muted">
                          {config.founderInputMode === "shares"
                            ? `${currentPct.toFixed(1)}% of initial`
                            : `${fmtShares(f.shares)} shares`}
                        </span>
                        <span className="text-[11px] text-ink-2 num">
                          Cost: {fmtMoneyExact(cost)}
                        </span>
                      </div>
                    </div>

                    {/* Vesting parameters */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-line/50 text-[11px]">
                      <div>
                        <span className="text-muted block">Vesting</span>
                        <input
                          type="number"
                          className="input !py-0.5 !px-1.5 num text-right text-[11.5px]"
                          value={f.vestingYears}
                          step={1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFounders(
                              config.founders.map((x) =>
                                x.id === f.id ? { ...x, vestingYears: val } : x
                              )
                            );
                          }}
                        />
                        <span className="text-muted text-[10px]">years</span>
                      </div>

                      <div>
                        <span className="text-muted block">Cliff</span>
                        <input
                          type="number"
                          className="input !py-0.5 !px-1.5 num text-right text-[11.5px]"
                          value={f.cliffMonths}
                          step={1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFounders(
                              config.founders.map((x) =>
                                x.id === f.id ? { ...x, cliffMonths: val } : x
                              )
                            );
                          }}
                        />
                        <span className="text-muted text-[10px]">months</span>
                      </div>

                      <div>
                        <span className="text-muted block">Start Date</span>
                        <input
                          type="date"
                          className="input !py-0.5 !px-1 text-[11px]"
                          value={f.startDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFounders(
                              config.founders.map((x) =>
                                x.id === f.id ? { ...x, startDate: val } : x
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={addFounder} className="btn btn-sm w-full justify-center">
              <Plus size={13} /> Add Founder
            </button>
          </div>
        </div>

        {/* Right Column: Funding Rounds (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <h3 className="font-semibold text-[14.5px]">Financing Rounds</h3>
                <span className="text-[11.5px] text-muted">
                  Ordered sequence: SAFEs accumulate and convert into the next priced round.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={addSafeRound} className="btn btn-sm">
                  <Plus size={13} /> Add SAFE
                </button>
                <button onClick={addPricedRound} className="btn btn-sm btn-primary">
                  <Plus size={13} /> Add Priced Round
                </button>
              </div>
            </div>

            {config.rounds.length === 0 && (
              <div className="p-8 text-center text-muted text-[13px] border border-dashed border-line rounded-lg">
                No funding rounds configured. Add a SAFE or Priced Round above.
              </div>
            )}

            <div className="space-y-4">
              {config.rounds.map((round, rIndex) => (
                <div
                  key={round.id}
                  className="rounded-xl border border-line bg-raised/80 p-3.5 space-y-3"
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`pill ${
                          round.type === "safe" ? "pill-pitched" : "pill-in_progress"
                        }`}
                      >
                        {round.type === "safe" ? "SAFE" : "Priced"}
                      </span>
                      <input
                        className="bg-transparent border-0 font-medium text-[14px] text-ink outline-none focus:ring-1 focus:ring-amber rounded px-1"
                        value={round.name}
                        onChange={(e) => updateRound(round.id, { name: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveRound(rIndex, "up")}
                        disabled={rIndex === 0}
                        className="btn btn-ghost btn-sm !p-1 text-muted hover:text-ink disabled:opacity-30"
                        title="Move round earlier"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => moveRound(rIndex, "down")}
                        disabled={rIndex === config.rounds.length - 1}
                        className="btn btn-ghost btn-sm !p-1 text-muted hover:text-ink disabled:opacity-30"
                        title="Move round later"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        onClick={() => removeRound(round.id)}
                        className="btn btn-ghost btn-sm !p-1 text-muted hover:text-crit"
                        title="Delete round"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* SAFE ROUND FIELDS */}
                  {round.type === "safe" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="eyebrow block mb-1">Amount ($)</label>
                        <input
                          type="number"
                          className="input num text-right"
                          value={round.amount}
                          step={50_000}
                          onChange={(e) =>
                            updateRound(round.id, {
                              amount: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="eyebrow block mb-1">
                          <TermWithTooltip term="valuation cap" label="Valuation Cap ($)" />
                        </label>
                        <input
                          type="number"
                          className="input num text-right"
                          value={round.valuationCap}
                          step={500_000}
                          onChange={(e) =>
                            updateRound(round.id, {
                              valuationCap: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="eyebrow block mb-1">Discount (%)</label>
                        <input
                          type="number"
                          className="input num text-right"
                          value={round.discountPercent}
                          step={5}
                          min={0}
                          max={99}
                          onChange={(e) =>
                            updateRound(round.id, {
                              discountPercent: Math.max(
                                0,
                                Math.min(99, parseFloat(e.target.value) || 0)
                              ),
                            })
                          }
                        />
                      </div>

                      <div className="sm:col-span-3 text-[11.5px] text-muted bg-surface/70 p-2 rounded border border-line/40">
                        <span className="text-amber font-medium">YC Post-Money Mechanics:</span>{" "}
                        Holder ownership = Amount / Cap ({((round.amount / (round.valuationCap || 1)) * 100).toFixed(1)}%),
                        measured against post-money capitalization at next priced round. Converts at lower of cap or discount price.
                      </div>
                    </div>
                  ) : (
                    /* PRICED ROUND FIELDS */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="eyebrow block mb-1">Amount Raised ($)</label>
                          <input
                            type="number"
                            className="input num text-right"
                            value={round.amount}
                            step={250_000}
                            onChange={(e) =>
                              updateRound(round.id, {
                                amount: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="eyebrow">
                              <TermWithTooltip term="pre-money" label="Pre-Money ($)" />
                            </label>
                            {round.valuationMode === "pre" && (
                              <span className="text-[10px] text-amber font-medium">Entered</span>
                            )}
                          </div>
                          <input
                            type="number"
                            className="input num text-right"
                            value={round.preMoneyValuation}
                            step={500_000}
                            onChange={(e) =>
                              updateRound(round.id, {
                                preMoneyValuation: Math.max(0, parseFloat(e.target.value) || 0),
                                valuationMode: "pre",
                              })
                            }
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="eyebrow">
                              <TermWithTooltip term="post-money" label="Post-Money ($)" />
                            </label>
                            {round.valuationMode === "post" && (
                              <span className="text-[10px] text-amber font-medium">Entered</span>
                            )}
                          </div>
                          <input
                            type="number"
                            className="input num text-right"
                            value={round.postMoneyValuation}
                            step={500_000}
                            onChange={(e) =>
                              updateRound(round.id, {
                                postMoneyValuation: Math.max(0, parseFloat(e.target.value) || 0),
                                valuationMode: "post",
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Option Pool Settings & Shuffle Toggle */}
                      <div className="rounded-lg bg-surface p-3 border border-line/70 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-[12.5px] font-medium text-ink">
                              Target Option Pool %:
                            </label>
                            <input
                              type="number"
                              className="input !w-20 !py-1 num text-right text-[12.5px]"
                              value={round.poolTargetPercent}
                              step={1}
                              min={0}
                              max={50}
                              onChange={(e) =>
                                updateRound(round.id, {
                                  poolTargetPercent: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                            />
                            <span className="text-muted text-[12px]">%</span>
                          </div>

                          {/* Pre vs Post Pool Shuffle Toggle */}
                          <div className="flex items-center gap-1 rounded bg-raised p-1 border border-line">
                            <button
                              onClick={() => updateRound(round.id, { poolTiming: "pre-money" })}
                              className={`btn btn-sm !py-0.5 !px-2 text-[11px] ${
                                round.poolTiming === "pre-money"
                                  ? "btn-primary font-medium"
                                  : "btn-ghost text-muted"
                              }`}
                              title="Dilutes founders only (Standard investor ask)"
                            >
                              Pre-Money Pool
                            </button>
                            <button
                              onClick={() => updateRound(round.id, { poolTiming: "post-money" })}
                              className={`btn btn-sm !py-0.5 !px-2 text-[11px] ${
                                round.poolTiming === "post-money"
                                  ? "btn-primary font-medium"
                                  : "btn-ghost text-muted"
                              }`}
                              title="Dilutes everyone equally"
                            >
                              Post-Money Pool
                            </button>
                          </div>
                        </div>

                        {/* Option Pool Shuffle Callout */}
                        {(() => {
                          const summary = model.roundSummaries.find((s) => s.roundId === round.id);
                          if (!summary) return null;

                          return (
                            <div className="text-[12px] bg-amber-soft/40 border border-amber/30 rounded p-2.5 space-y-1">
                              <div className="flex items-center gap-1.5 font-medium text-amber-ink">
                                <Info size={13} />
                                <TermWithTooltip
                                  term="option pool shuffle"
                                  label="Option Pool Shuffle Effect"
                                />
                              </div>
                              <p className="text-ink-2 leading-relaxed">
                                {round.poolTiming === "pre-money" ? (
                                  <>
                                    Creating the <b>{round.poolTargetPercent}%</b> pool pre-money
                                    dilutes founders before investment. The effective founder
                                    valuation is{" "}
                                    <b className="num text-ink">
                                      {fmtMoneyExact(summary.effectivePreMoneyValuation)}
                                    </b>{" "}
                                    (vs nominal{" "}
                                    <b className="num text-ink">
                                      {fmtMoneyExact(summary.preMoneyValuation)}
                                    </b>
                                    ), creating a{" "}
                                    <b className="text-crit num">
                                      {fmtMoneyExact(summary.poolShuffleImpactDollars)}
                                    </b>{" "}
                                    effective founder dilution discount.
                                  </>
                                ) : (
                                  <>
                                    Creating the <b>{round.poolTargetPercent}%</b> pool post-money
                                    dilutes both founders and new investors proportionally. The
                                    effective pre-money equals the nominal pre-money of{" "}
                                    <b className="num text-ink">
                                      {fmtMoneyExact(summary.preMoneyValuation)}
                                    </b>
                                    .
                                  </>
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROUND SUMMARY STRIP */}
      {model.roundSummaries.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="font-semibold text-[14.5px]">Round Summary Strip</h3>
            <span className="text-[11.5px] text-muted">
              Pre/post valuations, share prices & effective founder pre-money
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {model.roundSummaries.map((s) => (
              <div key={s.roundId} className="card p-3.5 bg-raised/50 border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[14px] text-ink">{s.roundName}</span>
                  <span className="pill pill-pitched">
                    {s.poolTiming === "pre-money" ? "Pre Pool" : "Post Pool"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] pt-1 border-t border-line/60">
                  <div>
                    <span className="text-muted block">Raised</span>
                    <span className="num font-medium text-ink">{fmtMoneyExact(s.amountRaised)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Price / Share</span>
                    <span className="num font-medium text-ink">{fmtPricePerShare(s.pricePerShare)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Pre-Money</span>
                    <span className="num font-medium text-ink">{fmtMoneyExact(s.preMoneyValuation)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Post-Money</span>
                    <span className="num font-medium text-ink">{fmtMoneyExact(s.postMoneyValuation)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Investor %</span>
                    <span className="num font-semibold text-good">{fmtPercent(s.roundOwnershipPercent)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Shares Issued</span>
                    <span className="num text-ink">{fmtShares(s.newSharesIssued)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 text-[11.5px] text-ink-2">
                  <span className="text-muted">Effective Pre-Money: </span>
                  <span className="num font-semibold text-amber-ink">
                    {fmtMoneyExact(s.effectivePreMoneyValuation)}
                  </span>
                  {s.poolShuffleImpactDollars > 0 && (
                    <span className="text-crit text-[11px] block mt-0.5">
                      (−{fmtMoneyExact(s.poolShuffleImpactDollars)} shuffle penalty)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OUTPUT VIEWS TABS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("table")}
              className={`btn btn-sm ${
                activeTab === "table" ? "btn-primary font-medium" : "btn-ghost text-muted"
              }`}
            >
              1. Cap Table By Round
            </button>
            <button
              onClick={() => setActiveTab("chart")}
              className={`btn btn-sm ${
                activeTab === "chart" ? "btn-primary font-medium" : "btn-ghost text-muted"
              }`}
            >
              2. Ownership Chart
            </button>
            <button
              onClick={() => setActiveTab("waterfall")}
              className={`btn btn-sm ${
                activeTab === "waterfall" ? "btn-primary font-medium" : "btn-ghost text-muted"
              }`}
            >
              3. Exit Waterfall & MOIC
            </button>
          </div>

          <div className="text-[12px] text-muted hidden sm:block">
            {activeTab === "table" && "Every cell recalculates live on every change."}
            {activeTab === "chart" && "Stacked ownership distribution across stages."}
            {activeTab === "waterfall" && "1x Non-participating liquidation preference modeling."}
          </div>
        </div>

        {/* TAB 1: CAP TABLE BY ROUND */}
        {activeTab === "table" && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px]">Cap Table By Round</h3>
                <p className="text-muted text-[12.5px]">
                  Fully diluted capitalization across company formation and investment stages.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] num">
                <thead>
                  <tr className="text-muted border-b border-line">
                    <th className="text-left py-2 font-medium px-2 min-w-[160px]">Holder</th>
                    {model.stages.map((stage) => (
                      <th
                        key={stage.stageId}
                        className="text-right py-2 font-medium px-3 border-l border-line/60 min-w-[150px]"
                      >
                        <div className="font-semibold text-ink">{stage.stageName}</div>
                        <div className="text-[10.5px] text-muted font-normal">
                          {stage.pricePerShare ? fmtPricePerShare(stage.pricePerShare) : "At par"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Founders Rows */}
                  {config.founders.map((f, i) => (
                    <tr key={f.id} className="border-b border-line/50 hover:bg-hover/50">
                      <td className="py-2.5 px-2 font-medium text-ink flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ background: PALETTE[i % PALETTE.length] }}
                        />
                        <span>{f.name}</span>
                        <span className="text-[10px] text-muted font-normal">(Founder)</span>
                      </td>

                      {model.stages.map((stage) => {
                        const cell = stage.cells[f.id];
                        if (!cell) return <td key={stage.stageId} className="px-3 py-2 text-right text-muted">—</td>;

                        const dilution = cell.dilutionFromPriorPercent;

                        return (
                          <td
                            key={stage.stageId}
                            className="py-2.5 px-3 text-right border-l border-line/40"
                          >
                            <div className="font-medium text-ink">{fmtShares(cell.shares)}</div>
                            <div className="flex items-center justify-end gap-1.5 text-[11px]">
                              <span className="text-amber-ink font-semibold">
                                {fmtPercent(cell.ownershipPercent)}
                              </span>
                              {dilution != null && dilution !== 0 && (
                                <span
                                  className={`text-[10px] px-1 rounded ${
                                    dilution < 0
                                      ? "text-crit bg-crit-soft"
                                      : "text-good bg-good-soft"
                                  }`}
                                >
                                  {dilution > 0 ? "+" : ""}
                                  {dilution.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Option Pool Rows */}
                  <tr className="border-b border-line/50 hover:bg-hover/50 bg-raised/20">
                    <td className="py-2.5 px-2 font-medium text-ink flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-blue shrink-0" />
                      <span>Option Pool (Total)</span>
                    </td>
                    {model.stages.map((stage) => {
                      const cell = stage.cells["pool"];
                      if (!cell) return <td key={stage.stageId} className="px-3 py-2 text-right text-muted">—</td>;

                      return (
                        <td
                          key={stage.stageId}
                          className="py-2.5 px-3 text-right border-l border-line/40"
                        >
                          <div className="font-medium text-ink">{fmtShares(cell.shares)}</div>
                          <div className="text-blue text-[11px] font-semibold">
                            {fmtPercent(cell.ownershipPercent)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Pool breakdown sub-rows */}
                  <tr className="border-b border-line/30 text-[11.5px] text-muted">
                    <td className="py-1.5 px-6 font-normal">↳ Granted Options</td>
                    {model.stages.map((stage) => (
                      <td key={stage.stageId} className="py-1.5 px-3 text-right border-l border-line/30">
                        {fmtShares(model.grantedPoolShares)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-line/50 text-[11.5px] text-muted">
                    <td className="py-1.5 px-6 font-normal">↳ Unallocated Pool</td>
                    {model.stages.map((stage) => {
                      const poolTotal = stage.cells["pool"]?.shares || 0;
                      const unalloc = Math.max(0, poolTotal - model.grantedPoolShares);
                      return (
                        <td key={stage.stageId} className="py-1.5 px-3 text-right border-l border-line/30">
                          {fmtShares(unalloc)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Investor Rows */}
                  {config.rounds.map((round, rIdx) => {
                    return (
                      <tr key={round.id} className="border-b border-line/50 hover:bg-hover/50">
                        <td className="py-2.5 px-2 font-medium text-ink flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{
                              background: PALETTE[(config.founders.length + 1 + rIdx) % PALETTE.length],
                            }}
                          />
                          <span>{round.name}</span>
                          <span className="text-[10px] text-muted font-normal">
                            ({round.type === "safe" ? "SAFE" : "Investor"})
                          </span>
                        </td>

                        {model.stages.map((stage) => {
                          const cell = stage.cells[round.id];
                          if (!cell) {
                            return (
                              <td
                                key={stage.stageId}
                                className="py-2.5 px-3 text-right text-muted border-l border-line/40"
                              >
                                —
                              </td>
                            );
                          }

                          if (cell.isPendingSafe) {
                            return (
                              <td
                                key={stage.stageId}
                                className="py-2.5 px-3 text-right border-l border-line/40 text-[11px] text-muted"
                              >
                                <div>Unconverted</div>
                                <div className="text-[10px] text-ink-2 truncate max-w-[140px] ml-auto">
                                  {cell.note}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={stage.stageId}
                              className="py-2.5 px-3 text-right border-l border-line/40"
                            >
                              <div className="font-medium text-ink">{fmtShares(cell.shares)}</div>
                              <div className="text-good text-[11px] font-semibold">
                                {fmtPercent(cell.ownershipPercent)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Total Fully Diluted Row */}
                  <tr className="border-t-2 border-line font-semibold text-ink bg-raised/60">
                    <td className="py-3 px-2">Total Fully Diluted</td>
                    {model.stages.map((stage) => (
                      <td
                        key={stage.stageId}
                        className="py-3 px-3 text-right border-l border-line/40"
                      >
                        <div className="text-[13px]">{fmtShares(stage.totalShares)}</div>
                        <div className="text-[11px] text-muted font-normal">100.0%</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: OWNERSHIP CHART */}
        {activeTab === "chart" && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[15px]">Ownership Distribution Across Stages</h3>
                <p className="text-muted text-[12.5px]">
                  Stacked visualization of equity dilution from Formation to final funding round.
                </p>
              </div>
            </div>

            <div className="h-[360px] w-full pt-2">
              <Bar data={{ labels: chartLabels, datasets: chartDatasets }} options={chartOptions} />
            </div>
          </div>
        )}

        {/* TAB 3: EXIT WATERFALL & MOIC */}
        {activeTab === "waterfall" && (
          <div className="card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h3 className="font-semibold text-[15px]">Exit Waterfall & Investor Returns</h3>
                <p className="text-muted text-[12.5px]">
                  <TermWithTooltip term="liquidation preference" label="1x Non-Participating Preferred" />:
                  Preferred series take greater of preference or common share at each exit.
                </p>
              </div>

              {/* Founder Vesting Toggle & Date */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded bg-raised p-1 border border-line">
                  <button
                    onClick={() => setExit({ founderVestingMode: "fully_vested" })}
                    className={`btn btn-sm !py-0.5 !px-2 text-[11.5px] ${
                      config.exit.founderVestingMode === "fully_vested"
                        ? "btn-primary font-medium"
                        : "btn-ghost text-muted"
                    }`}
                  >
                    Fully Vested
                  </button>
                  <button
                    onClick={() => setExit({ founderVestingMode: "as_of_date" })}
                    className={`btn btn-sm !py-0.5 !px-2 text-[11.5px] ${
                      config.exit.founderVestingMode === "as_of_date"
                        ? "btn-primary font-medium"
                        : "btn-ghost text-muted"
                    }`}
                  >
                    Vested As Of Date
                  </button>
                </div>

                {config.exit.founderVestingMode === "as_of_date" && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber" />
                    <input
                      type="date"
                      className="input !py-1 !px-2 text-[12px] !w-auto"
                      value={config.exit.asOfDate}
                      onChange={(e) => setExit({ asOfDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editable Exit Values Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-1">Exit Values:</span>
              {config.exit.exitValues.map((val, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 bg-raised px-2 py-1 rounded border border-line"
                >
                  <span className="num text-[12px] font-medium text-ink">
                    ${(val / 1e6).toFixed(0)}M
                  </span>
                  <input
                    type="number"
                    className="input !w-16 !p-0.5 !text-[11px] num text-right bg-surface"
                    value={val / 1e6}
                    step={25}
                    onChange={(e) => updateExitValue(idx, (parseFloat(e.target.value) || 0) * 1e6)}
                  />
                  {config.exit.exitValues.length > 1 && (
                    <button
                      onClick={() => removeExitValue(idx)}
                      className="text-muted hover:text-crit text-[11px] ml-0.5"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addExitValue} className="btn btn-sm btn-ghost">
                <Plus size={12} /> Add Exit
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] num">
                <thead>
                  <tr className="text-muted border-b border-line">
                    <th className="text-left py-2 px-2 font-medium">Exit Valuation</th>
                    {config.founders.map((f) => (
                      <th key={f.id} className="text-right py-2 px-3 font-medium">
                        {f.name} Proceeds
                      </th>
                    ))}
                    <th className="text-right py-2 px-3 font-medium">Option Pool</th>
                    {config.rounds.map((r) => (
                      <th key={r.id} className="text-right py-2 px-3 font-medium">
                        {r.name} Proceeds
                      </th>
                    ))}
                    <th className="text-right py-2 px-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {model.exitTable.map((row) => (
                    <tr key={row.exitValue} className="border-b border-line/50 hover:bg-hover">
                      <td className="py-2.5 px-2 font-semibold text-amber-ink">
                        {fmtMoneyExact(row.exitValue)}
                      </td>

                      {/* Founders Proceeds */}
                      {config.founders.map((f) => {
                        const h = row.holders[f.id];
                        if (!h) return <td key={f.id} className="py-2.5 px-3 text-right text-muted">—</td>;

                        return (
                          <td key={f.id} className="py-2.5 px-3 text-right">
                            <div className="font-semibold text-ink">
                              {fmtMoneyExact(
                                config.exit.founderVestingMode === "as_of_date"
                                  ? h.vestedProceeds
                                  : h.proceeds
                              )}
                            </div>
                            <div className="text-[11px] text-muted">
                              {h.impliedPricePerShare ? fmtPricePerShare(h.impliedPricePerShare) : "$0.00"}/sh
                              {config.exit.founderVestingMode === "as_of_date" && h.unvestedProceeds ? (
                                <span className="text-[10px] text-crit block">
                                  ({fmtMoneyExact(h.unvestedProceeds)} unvested)
                                </span>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}

                      {/* Option Pool Proceeds */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-medium text-ink">
                          {fmtMoneyExact(row.holders["pool"]?.proceeds)}
                        </div>
                      </td>

                      {/* Investor Rounds Proceeds & MOIC */}
                      {config.rounds.map((r) => {
                        const h = row.holders[r.id];
                        if (!h) return <td key={r.id} className="py-2.5 px-3 text-right text-muted">—</td>;

                        return (
                          <td key={r.id} className="py-2.5 px-3 text-right">
                            <div className="font-semibold text-ink">{fmtMoneyExact(h.proceeds)}</div>
                            <div className="flex items-center justify-end gap-1.5 text-[11px]">
                              <span className="font-medium text-good">
                                <TermWithTooltip term="MOIC" label={`${h.moic?.toFixed(2)}x`} />
                              </span>
                              {h.tookLiquidationPreference && (
                                <span className="pill pill-pitched !text-[9.5px] !py-0 !px-1">
                                  1x Pref
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-2 text-right font-medium text-ink-2">
                        {fmtMoneyExact(row.totalProceedsDistributed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDUCATIONAL GLOSSARY STRIP */}
      <div className="card p-4 space-y-2.5 bg-surface/70 border-line">
        <div className="flex items-center gap-1.5 font-semibold text-[13.5px] text-ink">
          <HelpCircle size={15} className="text-amber" />
          <span>Venture Capital Terminology Quick Reference</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[12px]">
          {Object.entries(GLOSSARY).map(([term, def]) => (
            <div key={term} className="p-2.5 rounded bg-raised border border-line/50">
              <span className="font-semibold capitalize text-amber-ink block mb-0.5">{term}</span>
              <p className="text-muted leading-tight">{def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Clean hover tooltip component with zero external dependencies
 */
function TermWithTooltip({ term, label }: { term: string; label?: string }) {
  const definition = GLOSSARY[term.toLowerCase()] || "";
  const display = label || term;

  return (
    <span className="group relative inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted/80">
      <span>{display}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 p-2.5 rounded-lg bg-surface border border-line-strong text-[11.5px] font-normal text-ink shadow-2xl text-left leading-snug">
        <span className="font-semibold capitalize text-amber-ink block mb-0.5">{term}</span>
        <span>{definition}</span>
      </span>
    </span>
  );
}
