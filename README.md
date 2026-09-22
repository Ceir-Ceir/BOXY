# BreadBox HQ

Internal home base for BreadBox — timeline/roadmap pages, tasks, investor pipeline, contacts, documents, and interactive models. Next.js 15 + Supabase, deployed on Vercel.

## Stack (deliberately small)

- **Next.js 15** (App Router, server actions) · **Tailwind v4** · **Tiptap** for the Notion-style editor · **Chart.js** for tools
- **Supabase** (Ceir project) — Postgres tables prefixed `bb_`, private storage bucket `breadbox`
- **Auth**: one shared password (`BREADBOX_PASSWORD`) → signed cookie, checked in middleware. All database access is server-side with the service-role key; tables have RLS on with no policies, so the anon key can't touch them.

## Local

```bash
cp .env.example .env.local   # fill in SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub, import it in Vercel.
2. Environment variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tapkdjdhyyxmsnbjbxae.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key (in `.env.example`)
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Project Settings → API → `service_role` (secret)
   - `BREADBOX_PASSWORD` = the shared password
   - `BREADBOX_SESSION_SECRET` = any long random string (`openssl rand -hex 32`)
3. Add the domain (kittsmarketing.com or a subdomain) under Vercel → Domains.

## Database

Schema lives in Supabase migrations (`breadbox_hq_init`). Tables:

| table | what |
|---|---|
| `bb_pages` | every editable page: phases (timeline), meeting notes, plain pages, investor + contact notes. `content` is Tiptap JSON |
| `bb_tasks` | tasks; `page_id` links to a phase/investor page |
| `bb_investors` | pipeline (lead → pitched → soft_commit → committed → wired / passed) |
| `bb_contacts` | directory (lawyers, fund admins, trustees, GPs, advisors) |
| `bb_documents` | file metadata; bytes live in the `breadbox` bucket |
| `bb_scenarios` | saved parameter sets for tools |

Uploads go browser → Supabase Storage via a signed upload URL (so Vercel's 4.5 MB body limit doesn't apply). Views/downloads use 5-minute signed URLs.

## Adding a tool

Drop a client component under `src/app/(app)/tools/<name>/`, register it in `src/app/(app)/tools/page.tsx`, and use `saveScenario(name, "<name>", params)` if it should persist scenarios.
