import { db, safe } from "@/lib/supabase";
import type { CapScenario } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import CapTableModel from "./CapTableModel";

export const metadata = {
  title: "Cap Table & Dilution Modeler | BreadBox HQ",
  description:
    "Interactive model for founder equity, option pool shuffle, SAFEs, priced rounds, and exit waterfalls.",
};

export default async function CapTablePage() {
  // Safe load of scenarios from Supabase. Degrades gracefully if table hasn't been migrated yet.
  const scenarios = await safe<CapScenario[]>(
    db()
      .from("bb_cap_scenarios")
      .select("*")
      .order("updated_at", { ascending: false }),
    []
  );

  return (
    <>
      <PageTitle
        eyebrow="Equity & Dilution"
        title="Cap Table & Waterfall Modeler"
      >
        Interactive capitalization engine for BreadBox. Change founder equity, option pool
        shuffle mechanics, YC post-money SAFEs, priced rounds, and exit values to view
        ownership, dilution, valuations, and proceeds live.
      </PageTitle>

      <CapTableModel initialScenarios={scenarios} />
    </>
  );
}
