"use client";

import { useState, useTransition } from "react";
import { createContact, updateContact, deleteContact } from "@/app/actions";
import type { Contact, ContactCategory } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { Plus, Mail, Phone, ExternalLink, Pencil, Trash2, X } from "lucide-react";

function Form({ c, cats, onDone }: { c?: Contact; cats: ContactCategory[]; onDone: () => void }) {
  const [, start] = useTransition();
  return (
    <form className="card p-4 grid gap-2.5 sm:grid-cols-2" action={(fd) => { start(async () => { if (c) await updateContact(c.id, fd); else await createContact(fd); onDone(); }); }}>
      <input name="name" className="input" placeholder="Name" defaultValue={c?.name} required autoFocus />
      <select name="category" className="input" defaultValue={c?.category ?? "other"}>{cats.map((k) => <option key={k} value={k}>{CATEGORY_LABEL[k]}</option>)}</select>
      <input name="role" className="input" placeholder="Role / title" defaultValue={c?.role ?? ""} />
      <input name="org" className="input" placeholder="Firm / organization" defaultValue={c?.org ?? ""} />
      <input name="email" className="input" placeholder="Email" defaultValue={c?.email ?? ""} />
      <input name="phone" className="input" placeholder="Phone" defaultValue={c?.phone ?? ""} />
      <input name="links" className="input sm:col-span-2" placeholder="Links — one per comma, e.g. Bio | https://…, LinkedIn | https://…" defaultValue={c?.links?.map((l) => `${l.label} | ${l.url}`).join(", ") ?? ""} />
      <textarea name="notes" className="input sm:col-span-2 min-h-[70px]" placeholder="Why they matter, what they said, what to ask" defaultValue={c?.notes ?? ""} />
      <div className="sm:col-span-2 flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary">{c ? "Save" : "Add contact"}</button>
      </div>
    </form>
  );
}

export default function ContactCards({ contacts, cats }: { contacts: Contact[]; cats: ContactCategory[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContactCategory | "all">("all");
  const [, start] = useTransition();
  const shown = contacts.filter((c) => filter === "all" || c.category === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center mb-5">
        <div className="flex gap-1 flex-wrap">
          <button className={`btn btn-sm ${filter === "all" ? "btn-primary" : ""}`} onClick={() => setFilter("all")}>All · {contacts.length}</button>
          {cats.map((k) => { const n = contacts.filter((c) => c.category === k).length; return n ? <button key={k} className={`btn btn-sm ${filter === k ? "btn-primary" : ""}`} onClick={() => setFilter(k)}>{CATEGORY_LABEL[k]} · {n}</button> : null; })}
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => setAdding(true)}><Plus size={15} />New contact</button>
      </div>
      {adding && <div className="mb-5"><Form cats={cats} onDone={() => setAdding(false)} /></div>}
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((c) => editing === c.id ? <Form key={c.id} c={c} cats={cats} onDone={() => setEditing(null)} /> : (
          <div key={c.id} className="card p-4 group">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-muted text-[12.5px]">{[c.role, c.org].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="pill pill-planned">{CATEGORY_LABEL[c.category]}</span>
                <button className="btn btn-ghost btn-sm opacity-0 group-hover:opacity-100" onClick={() => setEditing(c.id)} aria-label="Edit"><Pencil size={13} /></button>
                <button className="btn btn-ghost btn-sm btn-danger opacity-0 group-hover:opacity-100" onClick={() => confirm(`Delete ${c.name}?`) && start(() => deleteContact(c.id))} aria-label="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
            {c.notes && <p className="text-ink-2 text-[13px] mt-2">{c.notes}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[12.5px]">
              {c.email && <a href={`mailto:${c.email}`} className="text-blue inline-flex items-center gap-1 hover:underline"><Mail size={12} />{c.email}</a>}
              {c.phone && <a href={`tel:${c.phone}`} className="text-blue inline-flex items-center gap-1 hover:underline"><Phone size={12} />{c.phone}</a>}
              {c.links?.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener" className="text-blue inline-flex items-center gap-1 hover:underline"><ExternalLink size={12} />{l.label}</a>)}
            </div>
          </div>
        ))}
        {!shown.length && <div className="card p-8 text-center text-muted md:col-span-2">Nobody here yet.</div>}
      </div>
      {editing && <button className="sr-only" onClick={() => setEditing(null)}><X /></button>}
    </>
  );
}
