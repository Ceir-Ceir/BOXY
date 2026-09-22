import { NextResponse } from "next/server";
import { db, BUCKET } from "@/lib/supabase";

/** Redirects to a short-lived signed URL for viewing/downloading a document. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = new URL(req.url).searchParams.get("download") === "1";
  const { data: doc } = await db().from("bb_documents").select("path,name").eq("id", id).single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(doc.path, 300, download ? { download: doc.name } : undefined);
  if (error || !data) return NextResponse.json({ error: error?.message || "Sign failed" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
