"use client";

import { useState, useTransition } from "react";
import { createTask, updateTask, deleteTask } from "@/app/actions";
import type { Task, Owner, TaskStatus } from "@/lib/types";
import { OWNERS } from "@/lib/types";
import { fmtShort, daysUntil } from "@/lib/format";
import { Plus, X } from "lucide-react";

export function TaskRow({ t, showPage, pageTitle }: { t: Task; showPage?: boolean; pageTitle?: string }) {
  const [, start] = useTransition();
  const d = daysUntil(t.due);
  const dueCls = t.status === "done" ? "text-muted" : d != null && d < 0 ? "text-crit" : d != null && d <= 3 ? "text-amber-ink" : "text-muted";
  return (
    <div className="group flex items-start gap-2.5 py-2 border-b border-line last:border-0">
      <input type="checkbox" className="mt-1 accent-amber size-3.5" checked={t.status === "done"} onChange={(e) => start(() => updateTask(t.id, { status: e.target.checked ? "done" : "todo" }))} />
      <div className="min-w-0 flex-1">
        <div className={`text-[13.5px] ${t.status === "done" ? "line-through text-muted" : ""}`}>{t.title}</div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] mt-0.5">
          <select className="bg-transparent text-muted cursor-pointer" value={t.owner ?? ""} onChange={(e) => start(() => updateTask(t.id, { owner: (e.target.value || null) as Owner | null }))}>
            <option value="" className="bg-raised">Unassigned</option>
            {OWNERS.map((o) => <option key={o} value={o} className="bg-raised">{o}</option>)}
          </select>
          <label className={`${dueCls} num`}>
            {t.due ? fmtShort(t.due) : "no date"}
            <input type="date" className="sr-only" value={t.due ?? ""} onChange={(e) => start(() => updateTask(t.id, { due: e.target.value || null }))} />
          </label>
          <select className="bg-transparent text-muted cursor-pointer" value={t.status} onChange={(e) => start(() => updateTask(t.id, { status: e.target.value as TaskStatus }))}>
            <option value="todo" className="bg-raised">To do</option><option value="doing" className="bg-raised">Doing</option><option value="done" className="bg-raised">Done</option>
          </select>
          {showPage && pageTitle && <span className="text-muted truncate">· {pageTitle}</span>}
        </div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 text-muted hover:text-crit" onClick={() => start(() => deleteTask(t.id))} aria-label="Delete task"><X size={14} /></button>
    </div>
  );
}

export function QuickAdd({ pageId, status }: { pageId?: string | null; status?: TaskStatus }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<Owner | "">("");
  const [due, setDue] = useState("");
  const [, start] = useTransition();
  const submit = () => {
    if (!title.trim()) return;
    start(() => createTask({ title: title.trim(), owner: owner || null, due: due || null, page_id: pageId ?? null, status }));
    setTitle(""); setDue("");
  };
  return (
    <div className="flex flex-wrap gap-1.5 items-center pt-2">
      <input className="input flex-1 min-w-[160px] !py-1.5" placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <select className="input !w-auto !py-1.5" value={owner} onChange={(e) => setOwner(e.target.value as Owner | "")}><option value="">Who</option>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
      <input type="date" className="input !w-auto !py-1.5 num" value={due} onChange={(e) => setDue(e.target.value)} />
      <button className="btn btn-sm" onClick={submit}><Plus size={13} />Add</button>
    </div>
  );
}
