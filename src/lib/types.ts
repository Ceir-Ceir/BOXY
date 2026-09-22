export type PageKind = "phase" | "note" | "meeting" | "investor" | "contact" | "page";
export type PageStatus = "planned" | "in_progress" | "done" | "blocked";
export type TaskStatus = "todo" | "doing" | "done";
export type Owner = "Ej" | "Chris";
export type InvestorStage = "lead" | "pitched" | "soft_commit" | "committed" | "wired" | "passed";
export type ContactCategory = "lawyer" | "fund_admin" | "trustee" | "gp" | "advisor" | "vendor" | "other";

export interface Page {
  id: string; kind: PageKind; title: string; content: unknown; parent_id: string | null;
  status: PageStatus; start_date: string | null; end_date: string | null; position: number;
  meta: Record<string, string>; created_at: string; updated_at: string;
}
export interface Task {
  id: string; title: string; status: TaskStatus; owner: Owner | null; due: string | null;
  page_id: string | null; position: number; notes: string | null; created_at: string; updated_at: string;
}
export interface Investor {
  id: string; name: string; firm: string | null; email: string | null; phone: string | null;
  stage: InvestorStage; amount: number | null; last_contact: string | null; next_step: string | null;
  page_id: string | null; created_at: string; updated_at: string;
}
export interface Contact {
  id: string; name: string; role: string | null; org: string | null; category: ContactCategory;
  email: string | null; phone: string | null; links: { label: string; url: string }[]; notes: string | null;
  page_id: string | null; created_at: string; updated_at: string;
}
export interface Doc {
  id: string; name: string; path: string; size: number | null; mime: string | null;
  page_id: string | null; tags: string[]; created_at: string;
}
export interface Scenario { id: string; name: string; tool: string; params: Record<string, number>; created_at: string; }

export const STATUS_LABEL: Record<PageStatus, string> = { planned: "Planned", in_progress: "In progress", done: "Done", blocked: "Blocked" };
export const TASK_LABEL: Record<TaskStatus, string> = { todo: "To do", doing: "Doing", done: "Done" };
export const STAGE_LABEL: Record<InvestorStage, string> = { lead: "Lead", pitched: "Pitched", soft_commit: "Soft commit", committed: "Committed", wired: "Wired", passed: "Passed" };
export const STAGES: InvestorStage[] = ["lead", "pitched", "soft_commit", "committed", "wired", "passed"];
export const CATEGORY_LABEL: Record<ContactCategory, string> = { lawyer: "Lawyer", fund_admin: "Fund admin", trustee: "Trustee", gp: "GP / manager", advisor: "Advisor", vendor: "Vendor", other: "Other" };
export const OWNERS: Owner[] = ["Ej", "Chris"];
