import Link from "next/link";
import { db, safe } from "@/lib/supabase";
import type { Page } from "@/lib/types";
import { PageTitle, Empty } from "@/components/ui";
import { createPageAndGo } from "@/app/actions";
import { fmtDate } from "@/lib/format";
import { Plus, FileText, Users } from "lucide-react";

export const metadata = { title: "Notes" };

function excerpt(content: unknown): string {
  const out: string[] = [];
  const walk = (n: unknown) => { if (!n || typeof n !== "object") return; const node = n as { text?: string; content?: unknown[] }; if (node.text) out.push(node.text); node.content?.forEach(walk); };
  walk(content);
  return out.join(" ").slice(0, 160);
}

export default async function Notes() {
  const pages = await safe<Page[]>(db().from("bb_pages").select("*").in("kind", ["meeting", "note", "page"]).order("updated_at", { ascending: false }), []);
  const meetings = pages.filter((p) => p.kind === "meeting"), notes = pages.filter((p) => p.kind !== "meeting");

  const List = ({ items }: { items: Page[] }) => items.length === 0 ? <Empty>Nothing here yet.</Empty> : (
    <div className="card divide-y divide-line">
      {items.map((p) => (
        <Link key={p.id} href={`/p/${p.id}`} className="flex gap-3 px-4 py-3 hover:bg-hover/50">
          {p.kind === "meeting" ? <Users size={16} className="text-amber mt-0.5 shrink-0" /> : <FileText size={16} className="text-blue mt-0.5 shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[13.5px] truncate">{p.title}</div>
            <div className="text-muted text-[12.5px] truncate">{excerpt(p.content) || <span className="italic">Empty</span>}</div>
          </div>
          <div className="num text-muted text-[12px] shrink-0">{fmtDate(p.start_date || p.updated_at.slice(0, 10), "MMM d")}</div>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <PageTitle eyebrow="Knowledge" title="Notes" action={<>
        <form action={createPageAndGo.bind(null, "meeting")}><input type="hidden" name="title" value={`Meeting — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`} /><button className="btn btn-primary"><Plus size={15} />Meeting notes</button></form>
        <form action={createPageAndGo.bind(null, "page")}><button className="btn"><Plus size={15} />Blank page</button></form>
      </>}>Meeting notes, research, decisions, anything that needs a page.</PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><div className="eyebrow mb-2">Meetings · {meetings.length}</div><List items={meetings} /></div>
        <div><div className="eyebrow mb-2">Pages · {notes.length}</div><List items={notes} /></div>
      </div>
    </>
  );
}
