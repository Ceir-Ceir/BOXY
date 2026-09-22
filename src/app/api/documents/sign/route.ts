import { NextResponse } from "next/server";
import { db, BUCKET } from "@/lib/supabase";

/** Returns a signed upload URL so the browser can PUT directly to Supabase Storage (bypasses Vercel's 4.5MB body limit). */
export async function POST(req: Request) {
  const { name } = (await req.json()) as { name: string };
  const safe = name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}-${safe}`;
  const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token, url: process.env.NEXT_PUBLIC_SUPABASE_URL, anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });
}
