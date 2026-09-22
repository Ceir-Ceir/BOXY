import { db, safe } from "@/lib/supabase";
import type { Contact, ContactCategory } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import ContactCards from "./ContactCards";

export const metadata = { title: "Contacts" };

export default async function Contacts() {
  const contacts = await safe<Contact[]>(db().from("bb_contacts").select("*").order("category").order("name"), []);
  const cats = Object.keys(CATEGORY_LABEL) as ContactCategory[];
  return (
    <>
      <PageTitle eyebrow="Directory" title="Contacts">Lawyers, fund admins, trustee candidates, GPs, advisors. Not investors — those live in the pipeline.</PageTitle>
      <ContactCards contacts={contacts} cats={cats} />
    </>
  );
}
