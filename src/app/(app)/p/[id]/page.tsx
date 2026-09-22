import Link from "next/link";
import { notFound } from "next/navigation";
import { db, safe } from "@/lib/supabase";
import type { Page, Task, Doc } from "@/lib/types";
import Editor from "@/components/Editor";
import PageMeta from "@/components/PageMeta";
import { TaskRow, QuickAdd } from "@/components/TaskPanel";
import { Uploader, DocList } from "@/components/Documents";
import { ChevronLeft } from "lucide-react";

const BACK: Record<string, { href: string; label: string }> = {
  phase: { href: "/timeline", label: "Timeline" }, meeting: { href: "/notes", label: "Notes" }, note: { href: "/notes", label: "Notes" },
  investor: { href: "/investors", label: "Investors" }, contact: { href: "/contacts", label: "Contacts" }, page: { href: "/", label: "Overview" },
};

export default async function PageView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await safe<Page | null>(db().from("bb_pages").select("*").eq("id", id).maybeSingle(), null);
  if (!page) notFound();
  const [tasks, docs] = await Promise.all([
    safe<Task[]>(db().from("bb_tasks").select("*").eq("page_id", id).order("status").order("due", { ascending: true, nullsFirst: false }), []),
    safe<Doc[]>(db().from("bb_documents").select("*").eq("page_id", id).order("created_at", { ascending: false }), []),
  ]);
  const back = BACK[page.kind] ?? BACK.page;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <Link href={back.href} className="inline-flex items-center gap-1 text-muted text-[12.5px] hover:text-ink mb-3"><ChevronLeft size={14} />{back.label}</Link>
        <PageMeta page={page} />
        <div className="mt-6">
          <Editor pageId={page.id} initial={page.content} placeholder={page.kind === "meeting" ? "Attendees, what was decided, action items…" : "Details, links, lists, tables — @Ej or @Chris to flag someone."} />
        </div>
      </div>
      <aside className="space-y-6 lg:sticky lg:top-8 self-start">
        <section className="card p-4">
          <div className="eyebrow mb-1">Tasks · {tasks.filter((t) => t.status !== "done").length} open</div>
          {tasks.map((t) => <TaskRow key={t.id} t={t} />)}
          <QuickAdd pageId={page.id} />
        </section>
        <section className="card p-4">
          <div className="eyebrow mb-2">Documents</div>
          <DocList docs={docs} />
          <div className="mt-2"><Uploader pageId={page.id} compact /></div>
        </section>
      </aside>
    </div>
  );
}
