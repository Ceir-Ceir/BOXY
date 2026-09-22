import { db, safe } from "@/lib/supabase";
import type { Scenario } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import LockInModel from "./LockInModel";

export const metadata = { title: "PE Lock-In & Liability Simulator" };

export default async function LockInPage() {
  const scenarios = await safe<Scenario[]>(
    db().from("bb_scenarios").select("*").eq("tool", "lock_in").order("created_at", { ascending: false }),
    []
  );

  return (
    <>
      <PageTitle
        eyebrow="Tools"
        title="PE Liability Profile & Lock-In Duration Simulator"
      >
        Model how GenZ time-locked retirement commitments (3, 5, 10, 20 year locks) transform retail deposits into predictable institutional LP capital for Private Equity &amp; Private Credit while delivering premium returns.
      </PageTitle>
      <LockInModel scenarios={scenarios} />
    </>
  );
}
