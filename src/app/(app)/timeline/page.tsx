import Link from "next/link";
import { db, safe } from "@/lib/supabase";
import type { Page, Task } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { PageTitle, Pill, Empty } from "@/components/ui";
import { createPageAndGo } from "@/app/actions";
import { fmtShort } from "@/lib/format";
import { addMonths, differenceInCalendarDays, format, startOfMonth, parseISO, min as dmin, max as dmax } from "date-fns";
import { Plus } from "lucide-react";

export const metadata = { title: "Timeline" };

export default async function Timeline() {
  const [phases, tasks] = await Promise.all([
    safe<Page[]>(db().from("bb_pages").select("*").eq("kind", "phase").order("start_date", { ascending: true, nullsFirst: false }).order("position"), []),
    safe<Task[]>(db().from("bb_tasks").select("id,page_id,status").neq("status", "done"), []),
  ]);
  const openBy = (id: string) => tasks.filter((t) => t.page_id === id).length;

  // chart window: first start → last end, padded to month edges
  const dated = phases.filter((p) => p.start_date && p.end_date);
  const today = new Date();
  const start = startOfMonth(dated.length ? dmin([...dated.map((p) => parseISO(p.start_date!)), today]) : today);
  const end = addMonths(startOfMonth(dated.length ? dmax([...dated.map((p) => parseISO(p.end_date!)), today]) : today), 1);
  const total = Math.max(1, differenceInCalendarDays(end, start));
  const months: Date[] = []; for (let d = start; d < end; d = addMonths(d, 1)) months.push(d);
  const pct = (d: Date) => (differenceInCalendarDays(d, start) / total) * 100;

  return (
    <>
      <PageTitle eyebrow="Roadmap" title="Timeline" action={
        <form action={createPageAndGo.bind(null, "phase")}><button className="btn btn-primary"><Plus size={15} />New phase</button></form>
      }>Every phase is a page. Click one to open it, write in it, attach tasks and documents.</PageTitle>

      {phases.length === 0 ? <Empty>No phases yet. Add the first one.</Empty> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              {/* month header */}
              <div className="tl-grid border-b border-line">
                <div className="px-4 py-2 eyebrow">Phase</div>
                <div className="relative h-8">
                  {months.map((m) => (
                    <div key={m.toISOString()} className="absolute top-0 h-full border-l border-line pl-1.5 pt-2 text-[11px] text-muted num whitespace-nowrap" style={{ left: `${pct(m)}%` }}>{format(m, months.length > 14 ? "MMM yy" : "MMM yyyy")}</div>
                  ))}
                </div>
              </div>
              {/* rows */}
              {phases.map((p) => {
                const s = p.start_date ? parseISO(p.start_date) : null, e = p.end_date ? parseISO(p.end_date) : null;
                const left = s ? pct(s) : 0, width = s && e ? Math.max(1.5, pct(e) - pct(s)) : 0;
                const open = openBy(p.id);
                return (
                  <Link key={p.id} href={`/p/${p.id}`} className="tl-grid tl-row border-b border-line last:border-0 hover:bg-hover/50 transition-colors">
                    <div className="px-4 py-2.5 min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{p.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-muted">
                        <Pill kind={p.status} label={STATUS_LABEL[p.status]} />
                        {open > 0 && <span>{open} open task{open > 1 ? "s" : ""}</span>}
                        {p.meta?.cost && <span className="num">· {p.meta.cost}</span>}
                      </div>
                    </div>
                    <div className="relative h-[42px]">
                      {months.map((m) => <div key={m.toISOString()} className="absolute top-0 h-full border-l border-line/60" style={{ left: `${pct(m)}%` }} />)}
                      {s && e && <div className={`tl-bar tl-bar-${p.status}`} style={{ left: `${left}%`, width: `${width}%` }} title={`${fmtShort(p.start_date)} → ${fmtShort(p.end_date)}`}>{p.meta?.summary ? p.meta.summary.split(".")[0] : `${fmtShort(p.start_date)} → ${fmtShort(p.end_date)}`}</div>}
                      {!s && <div className="absolute inset-y-0 left-3 flex items-center text-[12px] text-muted">No dates yet</div>}
                    </div>
                  </Link>
                );
              })}
              {/* today marker */}
              {today >= start && today <= end && (
                <div className="relative h-0"><div className="absolute bottom-0 w-px bg-amber" style={{ left: `calc(260px + (100% - 260px) * ${pct(today) / 100})`, height: `${phases.length * 43 + 32}px` }} /></div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {phases.map((p) => (
          <Link key={p.id} href={`/p/${p.id}`} className="card p-4 hover:border-line-strong transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{p.title}</div>
              <Pill kind={p.status} label={STATUS_LABEL[p.status]} />
            </div>
            <div className="text-muted text-[12.5px] mt-1 num">{fmtShort(p.start_date)} → {fmtShort(p.end_date)}{p.meta?.cost ? ` · ${p.meta.cost}` : ""}</div>
            {p.meta?.summary && <p className="text-ink-2 text-[13px] mt-2 line-clamp-3">{p.meta.summary}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
