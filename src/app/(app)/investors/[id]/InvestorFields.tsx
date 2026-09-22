"use client";

import { useState, useTransition } from "react";
import { updateInvestor, deleteInvestor } from "@/app/actions";
import type { Investor, InvestorStage } from "@/lib/types";
import { STAGES, STAGE_LABEL } from "@/lib/types";
import { Trash2 } from "lucide-react";

function FieldInput({
  label,
  k,
  v,
  inv,
  type = "text",
  w = "",
  onChange,
  onSave,
}: {
  label: string;
  k: keyof Investor;
  v: Investor;
  inv: Investor;
  type?: string;
  w?: string;
  onChange: (k: keyof Investor, val: unknown) => void;
  onSave: (k: keyof Investor, val: unknown) => void;
}) {
  return (
    <label className={`block ${w}`}>
      <span className="eyebrow">{label}</span>
      <input
        type={type}
        className={`input mt-1 ${type === "date" || k === "amount" ? "num" : ""}`}
        value={(v[k] as string | number | null) ?? ""}
        onChange={(e) =>
          onChange(
            k,
            k === "amount" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value
          )
        }
        onBlur={() => {
          const val = v[k];
          if (val !== inv[k]) {
            onSave(k, val === "" ? null : val);
          }
        }}
      />
    </label>
  );
}

export default function InvestorFields({ inv }: { inv: Investor }) {
  const [v, setV] = useState(inv);
  const [, start] = useTransition();

  const handleFieldChange = (k: keyof Investor, val: unknown) => {
    setV((prev) => ({ ...prev, [k]: val }));
  };

  const handleFieldSave = (k: keyof Investor, val: unknown) => {
    start(() => updateInvestor(inv.id, { [k]: val } as Parameters<typeof updateInvestor>[1]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <input
          className="title-input"
          value={v.name}
          onChange={(e) => setV((prev) => ({ ...prev, name: e.target.value }))}
          onBlur={() => v.name !== inv.name && start(() => updateInvestor(inv.id, { name: v.name || "Unnamed" }))}
        />
        <button
          className="btn btn-ghost btn-sm btn-danger text-muted shrink-0"
          onClick={() => confirm(`Delete ${inv.name}?`) && start(() => deleteInvestor(inv.id))}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="eyebrow">Stage</span>
          <select
            className="input mt-1"
            value={v.stage}
            onChange={(e) => {
              const newStage = e.target.value as InvestorStage;
              setV((prev) => ({ ...prev, stage: newStage }));
              start(() => updateInvestor(inv.id, { stage: newStage }));
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <FieldInput label="Amount ($)" k="amount" type="number" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
        <FieldInput label="Firm / context" k="firm" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
        <FieldInput label="Email" k="email" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
        <FieldInput label="Phone" k="phone" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
        <FieldInput label="Last contact" k="last_contact" type="date" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
        <FieldInput label="Next step" k="next_step" w="sm:col-span-3" v={v} inv={inv} onChange={handleFieldChange} onSave={handleFieldSave} />
      </div>
    </div>
  );
}
