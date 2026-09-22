import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, password, sessionToken } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");
  if (pw !== password()) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  const jar = await cookies();
  jar.set(AUTH_COOKIE, await sessionToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90 });
  redirect(next.startsWith("/") ? next : "/");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form action={login} className="card w-full max-w-sm p-7 space-y-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block size-3 rounded-sm bg-amber" />
            <span className="font-semibold tracking-tight text-lg">BreadBox HQ</span>
          </div>
          <p className="text-muted mt-1.5 text-[13px]">Internal. Ej &amp; Chris only.</p>
        </div>
        <input type="hidden" name="next" value={sp.next || "/"} />
        <div className="space-y-1.5">
          <label htmlFor="password" className="eyebrow">Password</label>
          <input id="password" name="password" type="password" className="input" autoFocus autoComplete="current-password" />
          {sp.error && <p className="text-crit text-[13px]">That&apos;s not it.</p>}
        </div>
        <button className="btn btn-primary w-full justify-center" type="submit">Enter</button>
      </form>
    </main>
  );
}
