import { db, safe } from "@/lib/supabase";
import type { Scenario } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import ToolsHubView from "./ToolsHubView";

export const metadata = { title: "Interactive Models & War Room Tools" };

export default async function Tools() {
  const scenarios = await safe<Scenario[]>(
    db().from("bb_scenarios").select("*").order("created_at", { ascending: false }),
    []
  );

  return (
    <>
      <PageTitle eyebrow="Models &amp; War Room" title="Breadbox Interactive Models">
        Three powerful financial engines built specifically for Breadbox thesis validation, PE liability modeling, and unit economics. Save named scenarios and play around with the numbers live.
      </PageTitle>

      <ToolsHubView scenarios={scenarios} />
    </>
  );
}
