"use client";

import { useState, useTransition } from "react";
import { updatePage, deletePage } from "@/app/actions";
import type { Page, PageStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { Trash2 } from "lucide-react";

export default function PageMeta({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const [meta, setMeta] = useState(page.meta || {});
  const [, start] = useTransition();
  const save = (patch: Parameters<typeof updatePage>[1]) => start(() => updatePage(page.id, patch));
  const isPhase = page.kind === "phase";
  const dated = isPhase || page.kind === "meeting";

  return (
    <div className="space-y-3">
      <input className="title-input" value={title} placeholder="Untitled" onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== page.title && save({ title: title || "Untitled" })} />
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {isPhase && (
          <select className={`pill pill-${page.status} !border-0 !bg-transparent cursor-pointer appearance-none`} defaultValue={page.status} onChange={(e) => save({ status: e.target.value as PageStatus })} style={{ paddingLeft: 8 }}>
            {(Object.keys(STATUS_LABEL) as PageStatus[]).map((s) => <option key={s} value={s} className="bg-raised text-ink">{STATUS_LABEL[s]}</option>)}
          </select>
        )}
        {dated && (
          <label className="flex items-center gap-1.5 text-muted">
            <span>{isPhase ? "Start" : "Date"}</span>
            <input type="date" className="input !w-auto !py-1 !px-2 num text-[12.5px]" defaultValue={page.start_date ?? ""} onChange={(e) => save({ start_date: e.target.value || null })} />
          </label>
        )}
        {isPhase && (
          <label className="flex items-center gap-1.5 text-muted">
            <span>End</span>
            <input type="date" className="input !w-auto !py-1 !px-2 num text-[12.5px]" defaultValue={page.end_date ?? ""} onChange={(e) => save({ end_date: e.target.value || null })} />
          </label>
        )}
        {isPhase && (
          <label className="flex items-center gap-1.5 text-muted">
            <span>Cost</span>
            <input className="input !w-40 !py-1 !px-2 text-[12.5px]" placeholder="$20–50K" value={meta.cost ?? ""} onChange={(e) => setMeta({ ...meta, cost: e.target.value })} onBlur={() => save({ meta })} />
          </label>
        )}
        <button className="btn btn-ghost btn-sm btn-danger ml-auto text-muted" onClick={() => { if (confirm(`Delete "${page.title}"? Linked tasks and documents stay, unlinked.`)) start(() => deletePage(page.id)); }}><Trash2 size={13} />Delete</button>
      </div>
      {isPhase && (
        <textarea className="input text-[13.5px] text-ink-2 min-h-[60px] resize-y" placeholder="One-paragraph summary shown on the timeline" value={meta.summary ?? ""} onChange={(e) => setMeta({ ...meta, summary: e.target.value })} onBlur={() => save({ meta })} />
      )}
    </div>
  );
}
