import { db, safe } from "@/lib/supabase";
import type { Scenario } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import GrowthModel from "./GrowthModel";

export const metadata = { title: "Growth model" };

export default async function Growth() {
  const scenarios = await safe<Scenario[]>(db().from("bb_scenarios").select("*").eq("tool", "growth").order("created_at", { ascending: false }), []);
  return (
    <>
      <PageTitle eyebrow="Tools" title="Growth & unit economics">Fund AUM (contributions + growth − fund expenses − early redemptions) and the management company&apos;s cash (mgmt fee + platform fee − marketing − opex − expense-cap waiver). Every slider recomputes.</PageTitle>
      <GrowthModel scenarios={scenarios} />
    </>
  );
}
