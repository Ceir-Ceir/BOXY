export const AUTH_COOKIE = "bb_session";

function secret() {
  return process.env.BREADBOX_SESSION_SECRET || "breadbox-dev-secret";
}
export function password() {
  return process.env.BREADBOX_PASSWORD || "BREAD";
}

/** Token stored in the cookie: sha256(password + secret). Works in Edge (middleware) and Node. */
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(`${password()}::${secret()}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
