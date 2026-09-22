import Link from "next/link";
import { db, safe } from "@/lib/supabase";
import type { Page, Task, Investor, Doc } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { PageTitle, Pill, Stat } from "@/components/ui";
import { TaskRow } from "@/components/TaskPanel";
import { fmtMoney, fmtShort, daysUntil, fmtDate } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export default async function Overview() {
  const [phases, tasks, investors, notes, docs] = await Promise.all([
    safe<Page[]>(db().from("bb_pages").select("*").eq("kind", "phase").order("start_date", { ascending: true, nullsFirst: false }), []),
    safe<Task[]>(db().from("bb_tasks").select("*").neq("status", "done").order("due", { ascending: true, nullsFirst: false }).limit(8), []),
    safe<Investor[]>(db().from("bb_investors").select("*"), []),
    safe<Page[]>(db().from("bb_pages").select("id,title,kind,updated_at,start_date").in("kind", ["meeting", "note", "page"]).order("updated_at", { ascending: false }).limit(5), []),
    safe<Doc[]>(db().from("bb_documents").select("id,name,created_at").order("created_at", { ascending: false }).limit(5), []),
  ]);
  const current = phases.find((p) => p.status === "in_progress") ?? phases.find((p) => p.status === "planned");
  const next = phases.filter((p) => p.status === "planned" && p.id !== current?.id).slice(0, 2);
  const overdue = tasks.filter((t) => (daysUntil(t.due) ?? 1) < 0).length;
  const committed = investors.filter((i) => ["soft_commit", "committed", "wired"].includes(i.stage)).reduce((a, i) => a + (i.amount || 0), 0);
  const wired = investors.filter((i) => i.stage === "wired").reduce((a, i) => a + (i.amount || 0), 0);
  const pageTitle = (id: string | null) => phases.find((p) => p.id === id)?.title;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <>
      <PageTitle eyebrow={today} title="Where things stand">One screen: the phase you&apos;re in, what&apos;s due, and how the raise is going.</PageTitle>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Open tasks" value={tasks.length} sub={overdue ? <span className="text-crit">{overdue} overdue</span> : "nothing overdue"} href="/tasks" />
        <Stat label="Raise · soft + committed" value={fmtMoney(committed)} sub={`${fmtMoney(wired)} wired`} href="/investors" />
        <Stat label="Phases done" value={`${phases.filter((p) => p.status === "done").length} / ${phases.length}`} sub={current ? `now: ${current.title}` : "—"} href="/timeline" />
        <Stat label="Investors in pipeline" value={investors.filter((i) => !["wired", "passed"].includes(i.stage)).length} sub={`${investors.length} total`} href="/investors" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          {current && (
            <Link href={`/p/${current.id}`} className="card p-5 block hover:border-line-strong">
              <div className="flex items-center justify-between gap-2 mb-1"><span className="eyebrow">Current phase</span><Pill kind={current.status} label={STATUS_LABEL[current.status]} /></div>
              <div className="text-[19px] font-semibold tracking-tight">{current.title}</div>
              <div className="num text-muted text-[12.5px] mt-0.5">{fmtShort(current.start_date)} → {fmtShort(current.end_date)}{current.meta?.cost ? ` · ${current.meta.cost}` : ""}</div>
              {current.meta?.summary && <p className="text-ink-2 text-[13.5px] mt-2">{current.meta.summary}</p>}
              <div className="mt-3 text-amber-ink text-[13px] inline-flex items-center gap-1">Open phase <ArrowRight size={13} /></div>
            </Link>
          )}
          {next.length > 0 && (
            <div className="card p-4">
              <div className="eyebrow mb-2">Up next</div>
              <div className="divide-y divide-line">{next.map((p) => (
                <Link key={p.id} href={`/p/${p.id}`} className="flex items-center justify-between gap-3 py-2 hover:text-amber-ink">
                  <span className="text-[13.5px] truncate">{p.title}</span><span className="num text-muted text-[12px] shrink-0">{fmtShort(p.start_date)}</span>
                </Link>))}</div>
            </div>
          )}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1"><span className="eyebrow">Due soon</span><Link href="/tasks" className="text-[12px] text-muted hover:text-ink">All tasks →</Link></div>
            {tasks.length ? tasks.map((t) => <TaskRow key={t.id} t={t} showPage pageTitle={pageTitle(t.page_id)} />) : <p className="text-muted text-[13px] py-2">Nothing open.</p>}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1"><span className="eyebrow">Recent notes</span><Link href="/notes" className="text-[12px] text-muted hover:text-ink">All →</Link></div>
            {notes.length ? <div className="divide-y divide-line">{notes.map((n) => (
              <Link key={n.id} href={`/p/${n.id}`} className="flex justify-between gap-3 py-2 hover:text-amber-ink"><span className="text-[13.5px] truncate">{n.title}</span><span className="num text-muted text-[12px] shrink-0">{fmtDate(n.start_date || n.updated_at.slice(0, 10), "MMM d")}</span></Link>))}</div>
              : <p className="text-muted text-[13px] py-2">No notes yet. <Link href="/notes" className="text-amber-ink">Write the first one.</Link></p>}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1"><span className="eyebrow">Recent documents</span><Link href="/documents" className="text-[12px] text-muted hover:text-ink">All →</Link></div>
            {docs.length ? <div className="divide-y divide-line">{docs.map((d) => (
              <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="flex justify-between gap-3 py-2 hover:text-amber-ink"><span className="text-[13.5px] truncate">{d.name}</span><span className="num text-muted text-[12px] shrink-0">{fmtDate(d.created_at, "MMM d")}</span></a>))}</div>
              : <p className="text-muted text-[13px] py-2">Nothing uploaded yet.</p>}
          </div>
          <Link href="/tools/growth" className="card p-4 block hover:border-line-strong">
            <div className="eyebrow mb-1">Tools</div>
            <div className="font-medium text-[14px]">Growth &amp; unit economics model</div>
            <div className="text-muted text-[12.5px]">AUM to $100M, CAC, fee stack, cash to raise.</div>
          </Link>
        </div>
      </div>
    </>
  );
}
