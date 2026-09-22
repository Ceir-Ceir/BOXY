"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db, BUCKET } from "@/lib/supabase";
import { AUTH_COOKIE } from "@/lib/auth";
import type { PageKind, PageStatus, TaskStatus, Owner, InvestorStage, ContactCategory } from "@/lib/types";

const all = () => { revalidatePath("/", "layout"); };

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

/* ---------- pages ---------- */
export async function createPage(input: { kind: PageKind; title?: string; parent_id?: string | null; start_date?: string | null; end_date?: string | null }) {
  const { data, error } = await db().from("bb_pages").insert({
    kind: input.kind, title: input.title || "Untitled", parent_id: input.parent_id ?? null,
    start_date: input.start_date ?? null, end_date: input.end_date ?? null, position: Date.now() % 1000000,
  }).select("id").single();
  if (error) throw new Error(error.message);
  all();
  return data.id as string;
}
export async function createPageAndGo(kind: PageKind, formData?: FormData) {
  const title = formData?.get("title") ? String(formData.get("title")) : undefined;
  const id = await createPage({ kind, title });
  redirect(`/p/${id}`);
}
export async function savePageContent(id: string, content: unknown) {
  const { error } = await db().from("bb_pages").update({ content }).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function updatePage(id: string, patch: Partial<{ title: string; status: PageStatus; start_date: string | null; end_date: string | null; meta: Record<string, string>; position: number; parent_id: string | null }>) {
  const { error } = await db().from("bb_pages").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  all();
}
export async function deletePage(id: string) {
  const { error } = await db().from("bb_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  all();
  redirect("/timeline");
}

/* ---------- tasks ---------- */
export async function createTask(input: { title: string; owner?: Owner | null; due?: string | null; page_id?: string | null; status?: TaskStatus }) {
  const { error } = await db().from("bb_tasks").insert({ title: input.title, owner: input.owner ?? null, due: input.due ?? null, page_id: input.page_id ?? null, status: input.status ?? "todo", position: Date.now() % 1000000 });
  if (error) throw new Error(error.message);
  all();
}
export async function updateTask(id: string, patch: Partial<{ title: string; status: TaskStatus; owner: Owner | null; due: string | null; page_id: string | null; notes: string | null; position: number }>) {
  const { error } = await db().from("bb_tasks").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  all();
}
export async function deleteTask(id: string) {
  const { error } = await db().from("bb_tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  all();
}

/* ---------- investors ---------- */
export async function createInvestor(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const pageId = await createPage({ kind: "investor", title: name });
  const { data, error } = await db().from("bb_investors").insert({ name, firm: str(formData.get("firm")), stage: (formData.get("stage") as InvestorStage) || "lead", amount: num(formData.get("amount")), page_id: pageId }).select("id").single();
  if (error) throw new Error(error.message);
  all();
  redirect(`/investors/${data.id}`);
}
export async function updateInvestor(id: string, patch: Partial<{ name: string; firm: string | null; email: string | null; phone: string | null; stage: InvestorStage; amount: number | null; last_contact: string | null; next_step: string | null }>) {
  const { error } = await db().from("bb_investors").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  if (patch.name) {
    const { data } = await db().from("bb_investors").select("page_id").eq("id", id).single();
    if (data?.page_id) await db().from("bb_pages").update({ title: patch.name }).eq("id", data.page_id);
  }
  all();
}
export async function deleteInvestor(id: string) {
  const { data } = await db().from("bb_investors").select("page_id").eq("id", id).single();
  await db().from("bb_investors").delete().eq("id", id);
  if (data?.page_id) await db().from("bb_pages").delete().eq("id", data.page_id);
  all();
  redirect("/investors");
}

/* ---------- contacts ---------- */
export async function createContact(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const { error } = await db().from("bb_contacts").insert({ name, role: str(formData.get("role")), org: str(formData.get("org")), category: (formData.get("category") as ContactCategory) || "other", email: str(formData.get("email")), phone: str(formData.get("phone")), notes: str(formData.get("notes")), links: parseLinks(str(formData.get("links"))) });
  if (error) throw new Error(error.message);
  all();
}
export async function updateContact(id: string, formData: FormData) {
  const { error } = await db().from("bb_contacts").update({ name: String(formData.get("name") || "").trim() || "Unnamed", role: str(formData.get("role")), org: str(formData.get("org")), category: (formData.get("category") as ContactCategory) || "other", email: str(formData.get("email")), phone: str(formData.get("phone")), notes: str(formData.get("notes")), links: parseLinks(str(formData.get("links"))) }).eq("id", id);
  if (error) throw new Error(error.message);
  all();
}
export async function deleteContact(id: string) {
  await db().from("bb_contacts").delete().eq("id", id);
  all();
}

/* ---------- documents ---------- */
export async function registerDocument(input: { name: string; path: string; size: number; mime: string; page_id?: string | null }) {
  const { error } = await db().from("bb_documents").insert({ ...input, page_id: input.page_id ?? null });
  if (error) throw new Error(error.message);
  all();
}
export async function deleteDocument(id: string) {
  const { data } = await db().from("bb_documents").select("path").eq("id", id).single();
  if (data?.path) await db().storage.from(BUCKET).remove([data.path]);
  await db().from("bb_documents").delete().eq("id", id);
  all();
}
export async function attachDocument(id: string, page_id: string | null) {
  await db().from("bb_documents").update({ page_id }).eq("id", id);
  all();
}

/* ---------- scenarios ---------- */
export async function saveScenario(name: string, tool: string, params: Record<string, number>) {
  const { error } = await db().from("bb_scenarios").insert({ name, tool, params });
  if (error) throw new Error(error.message);
  revalidatePath("/tools", "layout");
}
export async function deleteScenario(id: string) {
  await db().from("bb_scenarios").delete().eq("id", id);
  revalidatePath("/tools", "layout");
}

/* ---------- helpers ---------- */
const str = (v: FormDataEntryValue | null) => { const s = v == null ? "" : String(v).trim(); return s ? s : null; };
const num = (v: FormDataEntryValue | null) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")); return isNaN(n) ? null : n; };
function parseLinks(s: string | null) {
  if (!s) return [];
  return s.split(/\n|,/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^(.*?)\s*[|:]\s*(https?:\/\/\S+)$/);
    if (m) return { label: m[1].trim(), url: m[2] };
    return { label: l.replace(/^https?:\/\//, "").split("/")[0], url: l.startsWith("http") ? l : `https://${l}` };
  });
}
