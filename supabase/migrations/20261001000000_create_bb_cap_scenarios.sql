-- Migration: 20261001000000_create_bb_cap_scenarios.sql
-- Description: Create bb_cap_scenarios table for BreadBox HQ Cap Table Modeler

create table if not exists public.bb_cap_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: Enabled with service-role access (matching Breadbox HQ pattern where service role key bypasses RLS)
alter table public.bb_cap_scenarios enable row level security;

-- Trigger to automatically update updated_at timestamp on row update
create or replace function public.set_bb_cap_scenarios_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_bb_cap_scenarios_updated_at on public.bb_cap_scenarios;
create trigger trigger_bb_cap_scenarios_updated_at
before update on public.bb_cap_scenarios
for each row execute function public.set_bb_cap_scenarios_updated_at();
