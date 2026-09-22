import { db, safe } from "@/lib/supabase";
import type { Doc, Page } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import { Uploader, DocList } from "@/components/Documents";
import { fmtBytes } from "@/lib/format";

export const metadata = { title: "Documents" };

export default async function Documents() {
  const [docs, pages] = await Promise.all([
    safe<Doc[]>(db().from("bb_documents").select("*").order("created_at", { ascending: false }), []),
    safe<Pick<Page, "id" | "title" | "kind">[]>(db().from("bb_pages").select("id,title,kind").order("kind").order("position"), []),
  ]);
  const total = docs.reduce((a, d) => a + (d.size || 0), 0);
  return (
    <>
      <PageTitle eyebrow="Files" title="Documents">{docs.length} files · {fmtBytes(total)}. Private bucket; links expire after 5 minutes. Attach a file to a phase, investor or note so it shows on that page.</PageTitle>
      <div className="mb-6"><Uploader /></div>
      <div className="card px-4"><DocList docs={docs} pages={pages} showAttach /></div>
    </>
  );
}
