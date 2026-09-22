import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safe } from "@/lib/supabase";
import type { Investor, Page, Doc, Task } from "@/lib/types";
import Editor from "@/components/Editor";
import InvestorFields from "./InvestorFields";
import { Uploader, DocList } from "@/components/Documents";
import { TaskRow, QuickAdd } from "@/components/TaskPanel";
import { ChevronLeft } from "lucide-react";

export default async function InvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await safe<Investor | null>(db().from("bb_investors").select("*").eq("id", id).maybeSingle(), null);
  if (!inv) notFound();
  const [page, docs, tasks] = await Promise.all([
    inv.page_id ? safe<Page | null>(db().from("bb_pages").select("*").eq("id", inv.page_id).maybeSingle(), null) : null,
    inv.page_id ? safe<Doc[]>(db().from("bb_documents").select("*").eq("page_id", inv.page_id).order("created_at", { ascending: false }), []) : [],
    inv.page_id ? safe<Task[]>(db().from("bb_tasks").select("*").eq("page_id", inv.page_id).order("due", { ascending: true, nullsFirst: false }), []) : [],
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <Link href="/investors" className="inline-flex items-center gap-1 text-muted text-[12.5px] hover:text-ink mb-3"><ChevronLeft size={14} />Investors</Link>
        <InvestorFields inv={inv} />
        {page && <div className="mt-6"><Editor pageId={page.id} initial={page.content} placeholder="Background, what they care about, call notes, what they asked for…" /></div>}
      </div>
      <aside className="space-y-6 lg:sticky lg:top-8 self-start">
        {page && (<>
          <section className="card p-4">
            <div className="eyebrow mb-1">Follow-ups</div>
            {tasks.map((t) => <TaskRow key={t.id} t={t} />)}
            <QuickAdd pageId={page.id} />
          </section>
          <section className="card p-4">
            <div className="eyebrow mb-2">Documents</div>
            <DocList docs={docs} />
            <div className="mt-2"><Uploader pageId={page.id} compact /></div>
          </section>
        </>)}
      </aside>
    </div>
  );
}
