import { db, safe } from "@/lib/supabase";
import type { Task, Page, TaskStatus } from "@/lib/types";
import { TASK_LABEL } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import { TaskRow, QuickAdd } from "@/components/TaskPanel";
import Kanban from "./Kanban";

export const metadata = { title: "Tasks" };

export default async function Tasks({ searchParams }: { searchParams: Promise<{ view?: string; owner?: string }> }) {
  const sp = await searchParams;
  const [tasks, pages] = await Promise.all([
    safe<Task[]>(db().from("bb_tasks").select("*").order("position"), []),
    safe<Pick<Page, "id" | "title" | "kind">[]>(db().from("bb_pages").select("id,title,kind").in("kind", ["phase", "meeting", "investor"]).order("position"), []),
  ]);
  const titleOf = (id: string | null) => pages.find((p) => p.id === id)?.title;
  const cols: TaskStatus[] = ["todo", "doing", "done"];
  const list = sp.view === "list";

  return (
    <>
      <PageTitle eyebrow="Project management" title="Tasks" action={
        <div className="flex gap-1 card p-1">
          <a href="/tasks" className={`btn btn-sm ${!list ? "btn-primary" : "btn-ghost"}`}>Board</a>
          <a href="/tasks?view=list" className={`btn btn-sm ${list ? "btn-primary" : "btn-ghost"}`}>List</a>
        </div>
      }>Drag cards between columns. Tasks attached to a phase also show up on that phase&apos;s page.</PageTitle>

      <div className="card p-3 mb-5"><QuickAdd /></div>

      {list ? (
        <div className="card px-4">
          {cols.map((c) => (
            <div key={c} className="py-3 border-b border-line last:border-0">
              <div className="eyebrow mb-1">{TASK_LABEL[c]} · {tasks.filter((t) => t.status === c).length}</div>
              {tasks.filter((t) => t.status === c).map((t) => <TaskRow key={t.id} t={t} showPage pageTitle={titleOf(t.page_id)} />)}
            </div>
          ))}
        </div>
      ) : (
        <Kanban tasks={tasks} pages={pages} />
      )}
    </>
  );
}
