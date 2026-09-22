import Link from "next/link";
import { db, safe } from "@/lib/supabase";
import type { Investor } from "@/lib/types";
import { STAGES, STAGE_LABEL } from "@/lib/types";
import { PageTitle, Pill, Stat } from "@/components/ui";
import { createInvestor } from "@/app/actions";
import { fmtMoney, fmtShort, daysUntil } from "@/lib/format";
import { Plus } from "lucide-react";

export const metadata = { title: "Investors" };

export default async function Investors() {
  const inv = await safe<Investor[]>(db().from("bb_investors").select("*").order("updated_at", { ascending: false }), []);
  const sum = (stages: string[]) => inv.filter((i) => stages.includes(i.stage)).reduce((a, i) => a + (i.amount || 0), 0);
  const stale = inv.filter((i) => !["wired", "passed"].includes(i.stage) && (daysUntil(i.last_contact) ?? -99) < -14);

  return (
    <>
      <PageTitle eyebrow="Fundraising" title="Investors">Pipeline for the angel + seed round. Each investor has a page for notes, calls and documents.</PageTitle>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Soft commits" value={fmtMoney(sum(["soft_commit"]))} sub={`${inv.filter((i) => i.stage === "soft_commit").length} investors`} />
        <Stat label="Committed" value={fmtMoney(sum(["committed"]))} sub={`${inv.filter((i) => i.stage === "committed").length} investors`} />
        <Stat label="Wired" value={fmtMoney(sum(["wired"]))} sub="in the bank" />
        <Stat label="Need a touch" value={stale.length} sub="no contact in 14+ days" />
      </div>

      <form action={createInvestor} className="card p-3 mb-6 flex flex-wrap gap-2 items-center">
        <input name="name" className="input flex-1 min-w-[160px]" placeholder="Investor name" required />
        <input name="firm" className="input !w-44" placeholder="Firm / where" />
        <select name="stage" className="input !w-36" defaultValue="lead">{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select>
        <input name="amount" className="input !w-32 num" placeholder="$ target" />
        <button className="btn btn-primary"><Plus size={15} />Add</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((s) => {
          const items = inv.filter((i) => i.stage === s);
          return (
            <div key={s} className="card p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <Pill kind={s} label={STAGE_LABEL[s]} />
                <span className="num text-muted text-[12px]">{items.length} · {fmtMoney(items.reduce((a, i) => a + (i.amount || 0), 0))}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((i) => {
                  const d = daysUntil(i.last_contact);
                  return (
                    <Link key={i.id} href={`/investors/${i.id}`} className="block bg-raised border border-line rounded-lg p-3 hover:border-line-strong">
                      <div className="flex justify-between gap-2">
                        <div className="font-medium text-[13.5px] truncate">{i.name}</div>
                        <div className="num text-[13px] text-ink-2">{fmtMoney(i.amount)}</div>
                      </div>
                      <div className="text-muted text-[12px] mt-0.5 flex gap-2 flex-wrap">
                        {i.firm && <span className="truncate">{i.firm}</span>}
                        <span className={`num ${d != null && d < -14 && !["wired", "passed"].includes(s) ? "text-crit" : ""}`}>last: {fmtShort(i.last_contact)}</span>
                      </div>
                      {i.next_step && <div className="text-[12.5px] text-amber-ink/90 mt-1 truncate">→ {i.next_step}</div>}
                    </Link>
                  );
                })}
                {!items.length && <div className="text-muted text-[12.5px] px-1 py-4 text-center">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
