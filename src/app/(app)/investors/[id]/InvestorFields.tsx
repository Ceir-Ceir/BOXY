"use client";

import { useState, useTransition } from "react";
import { updateInvestor, deleteInvestor } from "@/app/actions";
import type { Investor, InvestorStage } from "@/lib/types";
import { STAGES, STAGE_LABEL } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function InvestorFields({ inv }: { inv: Investor }) {
  const [v, setV] = useState(inv);
  const [, start] = useTransition();
  const save = (patch: Parameters<typeof updateInvestor>[1]) => start(() => updateInvestor(inv.id, patch));
  const F = ({ k, label, type = "text", w = "" }: { k: keyof Investor; label: string; type?: string; w?: string }) => (
    <label className={`block ${w}`}>
      <span className="eyebrow">{label}</span>
      <input type={type} className={`input mt-1 ${type === "date" || k === "amount" ? "num" : ""}`} value={(v[k] as string | number | null) ?? ""}
        onChange={(e) => setV({ ...v, [k]: k === "amount" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value })}
        onBlur={() => { const val = v[k]; if (val !== inv[k]) save({ [k]: val === "" ? null : val } as Parameters<typeof updateInvestor>[1]); }} />
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <input className="title-input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} onBlur={() => v.name !== inv.name && save({ name: v.name || "Unnamed" })} />
        <button className="btn btn-ghost btn-sm btn-danger text-muted shrink-0" onClick={() => confirm(`Delete ${inv.name}?`) && start(() => deleteInvestor(inv.id))}><Trash2 size={13} />Delete</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="eyebrow">Stage</span>
          <select className={`input mt-1`} value={v.stage} onChange={(e) => { setV({ ...v, stage: e.target.value as InvestorStage }); save({ stage: e.target.value as InvestorStage }); }}>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </label>
        <F k="amount" label="Amount ($)" type="number" />
        <F k="firm" label="Firm / context" />
        <F k="email" label="Email" />
        <F k="phone" label="Phone" />
        <F k="last_contact" label="Last contact" type="date" />
        <F k="next_step" label="Next step" w="sm:col-span-3" />
      </div>
    </div>
  );
}
