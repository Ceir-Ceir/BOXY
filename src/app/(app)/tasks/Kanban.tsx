"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";
import { updateTask, deleteTask } from "@/app/actions";
import type { Task, Page, TaskStatus, Owner } from "@/lib/types";
import { TASK_LABEL, OWNERS } from "@/lib/types";
import { fmtShort, daysUntil } from "@/lib/format";
import { X } from "lucide-react";

const COLS: TaskStatus[] = ["todo", "doing", "done"];

export default function Kanban({ tasks, pages }: { tasks: Task[]; pages: Pick<Page, "id" | "title" | "kind">[] }) {
  const [opt, setOpt] = useOptimistic(tasks, (state, patch: { id: string; status: TaskStatus }) => state.map((t) => (t.id === patch.id ? { ...t, status: patch.status } : t)));
  const [, start] = useTransition();
  const [over, setOver] = useState<TaskStatus | null>(null);
  const titleOf = (id: string | null) => pages.find((p) => p.id === id)?.title;

  const move = (id: string, status: TaskStatus) => start(async () => { setOpt({ id, status }); await updateTask(id, { status }); });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLS.map((col) => {
        const items = opt.filter((t) => t.status === col);
        return (
          <div key={col} className={`card p-3 min-h-[300px] transition-colors ${over === col ? "border-amber bg-amber-soft/20" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(col); }} onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/task"); if (id) move(id, col); }}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="eyebrow">{TASK_LABEL[col]}</span>
              <span className="num text-muted text-[12px]">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((t) => {
                const d = daysUntil(t.due);
                const dueCls = t.status === "done" ? "text-muted" : d != null && d < 0 ? "text-crit" : d != null && d <= 3 ? "text-amber-ink" : "text-muted";
                return (
                  <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/task", t.id)}
                    className="group bg-raised border border-line rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-line-strong">
                    <div className="flex items-start gap-2">
                      <div className={`text-[13.5px] flex-1 ${t.status === "done" ? "line-through text-muted" : ""}`}>{t.title}</div>
                      <button className="text-muted hover:text-crit opacity-0 group-hover:opacity-100" onClick={() => start(() => deleteTask(t.id))} aria-label="Delete"><X size={13} /></button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[12px]">
                      <select className="bg-transparent text-muted cursor-pointer" value={t.owner ?? ""} onChange={(e) => start(() => updateTask(t.id, { owner: (e.target.value || null) as Owner | null }))}>
                        <option value="" className="bg-raised">Unassigned</option>{OWNERS.map((o) => <option key={o} value={o} className="bg-raised">{o}</option>)}
                      </select>
                      <label className={`${dueCls} num cursor-pointer`}>{t.due ? fmtShort(t.due) : "no date"}<input type="date" className="sr-only" value={t.due ?? ""} onChange={(e) => start(() => updateTask(t.id, { due: e.target.value || null }))} /></label>
                      <select className="bg-transparent text-muted cursor-pointer max-w-[150px] truncate" value={t.page_id ?? ""} onChange={(e) => start(() => updateTask(t.id, { page_id: e.target.value || null }))}>
                        <option value="" className="bg-raised">No phase</option>{pages.map((p) => <option key={p.id} value={p.id} className="bg-raised">{p.title}</option>)}
                      </select>
                    </div>
                    {t.page_id && titleOf(t.page_id) && <Link href={`/p/${t.page_id}`} className="block mt-1.5 text-[11.5px] text-amber-ink/80 hover:text-amber-ink truncate">↗ {titleOf(t.page_id)}</Link>}
                  </div>
                );
              })}
              {!items.length && <div className="text-muted text-[12.5px] px-1 py-6 text-center">Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
