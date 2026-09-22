"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { registerDocument, deleteDocument, attachDocument } from "@/app/actions";
import type { Doc, Page } from "@/lib/types";
import { fmtBytes, fmtDate } from "@/lib/format";
import { Upload, FileText, Image as ImageIcon, File, Trash2, ExternalLink, Download, Link2 } from "lucide-react";

function Icon({ mime }: { mime: string | null }) {
  if (mime?.includes("pdf")) return <FileText size={16} className="text-crit" />;
  if (mime?.startsWith("image/")) return <ImageIcon size={16} className="text-teal" />;
  return <File size={16} className="text-blue" />;
}

export function Uploader({ pageId, compact }: { pageId?: string | null; compact?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    for (const file of Array.from(files)) {
      setBusy(file.name);
      try {
        const res = await fetch("/api/documents/sign", { method: "POST", body: JSON.stringify({ name: file.name }) });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Could not get upload URL");
        const sb = createClient(j.url, j.anon, { auth: { persistSession: false } });
        const { error } = await sb.storage.from("breadbox").uploadToSignedUrl(j.path, j.token, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw new Error(error.message);
        await registerDocument({ name: file.name, path: j.path, size: file.size, mime: file.type || "application/octet-stream", page_id: pageId ?? null });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    start(() => {});
  }

  return (
    <div>
      <label className={`card flex ${compact ? "flex-row items-center gap-3 px-4 py-3" : "flex-col items-center gap-2 p-8"} border-dashed cursor-pointer hover:border-amber hover:bg-amber-soft/30 transition-colors`}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
        <Upload size={compact ? 16 : 22} className="text-amber" />
        <div className={compact ? "text-[13px]" : "text-center"}>
          <div className="font-medium">{busy ? `Uploading ${busy}…` : "Drop files or click to upload"}</div>
          {!compact && <div className="text-muted text-[12.5px]">PDFs, decks, spreadsheets, images — stored privately in Supabase.</div>}
        </div>
        <input ref={input} type="file" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
      </label>
      {err && <p className="text-crit text-[12.5px] mt-2">{err}</p>}
    </div>
  );
}

export function DocList({ docs, pages, showAttach }: { docs: Doc[]; pages?: Pick<Page, "id" | "title" | "kind">[]; showAttach?: boolean }) {
  const [, start] = useTransition();
  if (!docs.length) return <p className="text-muted text-[13px] py-3">No documents yet.</p>;
  const pageTitle = (id: string | null) => pages?.find((p) => p.id === id)?.title;
  return (
    <div className="divide-y divide-line">
      {docs.map((d) => (
        <div key={d.id} className="group flex items-center gap-3 py-2.5">
          <Icon mime={d.mime} />
          <div className="min-w-0 flex-1">
            <a href={`/api/documents/${d.id}`} target="_blank" rel="noopener" className="text-[13.5px] hover:text-amber-ink truncate block">{d.name}</a>
            <div className="text-muted text-[12px] flex gap-2 flex-wrap">
              <span className="num">{fmtBytes(d.size)}</span><span>·</span><span>{fmtDate(d.created_at)}</span>
              {showAttach && pages && (
                <span className="flex items-center gap-1"><Link2 size={11} />
                  <select className="bg-transparent text-muted cursor-pointer max-w-[200px]" value={d.page_id ?? ""} onChange={(e) => start(() => attachDocument(d.id, e.target.value || null))}>
                    <option value="" className="bg-raised">Not attached</option>
                    {pages.map((p) => <option key={p.id} value={p.id} className="bg-raised">{p.title}</option>)}
                  </select>
                </span>
              )}
              {!showAttach && d.page_id && pageTitle(d.page_id) && <span>· {pageTitle(d.page_id)}</span>}
            </div>
          </div>
          <a className="btn btn-ghost btn-sm" href={`/api/documents/${d.id}`} target="_blank" rel="noopener" title="Open"><ExternalLink size={13} /></a>
          <a className="btn btn-ghost btn-sm" href={`/api/documents/${d.id}?download=1`} title="Download"><Download size={13} /></a>
          <button className="btn btn-ghost btn-sm btn-danger opacity-0 group-hover:opacity-100" title="Delete" onClick={() => confirm(`Delete ${d.name}?`) && start(() => deleteDocument(d.id))}><Trash2 size={13} /></button>
        </div>
      ))}
    </div>
  );
}
