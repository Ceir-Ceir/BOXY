import { db, safe } from "@/lib/supabase";
import type { Scenario } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import PEFlywheelModel from "./PEFlywheelModel";

export const metadata = { title: "PE Institutional Gap & Flywheel Economics" };

export default async function PEFlywheelPage() {
  const scenarios = await safe<Scenario[]>(
    db().from("bb_scenarios").select("*").eq("tool", "pe_flywheel").order("created_at", { ascending: false }),
    []
  );

  return (
    <>
      <PageTitle
        eyebrow="Tools"
        title="PE Institutional Gap & Flywheel Economics"
      >
        Calculate how Breadbox solves Private Equity&apos;s LP capital deficit by aggregating 70 million GenZ investors into a massive institutional capital pool while capturing management fees, placement spreads, and GP carry share.
      </PageTitle>
      <PEFlywheelModel scenarios={scenarios} />
    </>
  );
}
