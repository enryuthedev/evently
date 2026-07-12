-- Evently — Supabase schema.
--
-- Security model:
--   * Host = an authenticated Supabase user (magic-link email). Owns rows via
--     owner_id = auth.uid(), enforced by RLS. Full read/write on own events.
--   * Guest = anonymous (no login). NEVER touches the tables directly. Reads an
--     event only through the SECURITY DEFINER function `event_by_token`, and
--     writes an RSVP only through `submit_rsvp`. Those functions expose exactly
--     the guest-safe fields — no owner_id, no email list, no other events.
--
-- Run this whole file once in the Supabase SQL editor (Dashboard → SQL).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users (id) on delete cascade,
  -- URL-safe public token (hex). This is what goes in the invite link, NOT the id.
  share_token    text not null unique default encode(gen_random_bytes(9), 'hex'),
  -- client-side genId, so the app can upsert the same event instead of duplicating.
  local_id       text,
  mode           text not null,
  occasion       text not null,
  title          text not null default '',
  description    text not null default '',
  date           date,
  "time"         text,
  location       jsonb,
  date_undecided boolean not null default false,
  poll           jsonb not null default '{"options":[]}'::jsonb,
  invitation     jsonb not null,
  cover_image_uri text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- one server row per (owner, client local id) → upsert target
create unique index if not exists events_owner_local_idx
  on public.events (owner_id, local_id);

create table if not exists public.guests (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  name         text not null default 'Gast',
  email        text,
  phone        text,
  "group"      text not null default 'friends',
  status       text not null default 'pending'
                 check (status in ('yes', 'no', 'maybe', 'pending')),
  party_size   int  not null default 1 check (party_size between 1 and 20),
  companions   jsonb not null default '[]'::jsonb,
  meal         text not null default 'none',
  allergies    text,
  note         text,
  invited_at   timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists guests_event_idx on public.guests (event_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — host-only. Anon has NO table access (uses RPCs below).
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.guests enable row level security;

drop policy if exists events_owner on public.events;
create policy events_owner on public.events
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists guests_owner on public.guests;
create policy guests_owner on public.guests
  for all
  using (exists (
    select 1 from public.events e
    where e.id = guests.event_id and e.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = guests.event_id and e.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- Public RPCs for anonymous guests (SECURITY DEFINER = bypass RLS safely).
-- ---------------------------------------------------------------------------

-- Read one event by its share token. Returns guest-safe fields only.
create or replace function public.event_by_token(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',            e.id,
    'shareToken',    e.share_token,
    'mode',          e.mode,
    'occasion',      e.occasion,
    'title',         e.title,
    'description',   e.description,
    'date',          e.date,
    'time',          e."time",
    'location',      e.location,
    'dateUndecided', e.date_undecided,
    'poll',          e.poll,
    'invitation',    e.invitation,
    'coverImageUri', e.cover_image_uri
  )
  from public.events e
  where e.share_token = p_token;
$$;

-- Insert a guest RSVP for the event behind a share token. Returns the guest id.
create or replace function public.submit_rsvp(
  p_token      text,
  p_name       text,
  p_status     text,
  p_party_size int,
  p_meal       text,
  p_allergies  text,
  p_note       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid;
  v_id    uuid;
begin
  select id into v_event from public.events where share_token = p_token;
  if v_event is null then
    raise exception 'invalid token';
  end if;
  if p_status not in ('yes', 'no', 'maybe') then
    raise exception 'invalid status';
  end if;

  insert into public.guests (event_id, name, status, party_size, meal, allergies, note, responded_at)
  values (
    v_event,
    coalesce(nullif(trim(p_name), ''), 'Gast'),
    p_status,
    least(greatest(coalesce(p_party_size, 1), 1), 20),
    coalesce(nullif(p_meal, ''), 'none'),
    nullif(trim(p_allergies), ''),
    nullif(trim(p_note), ''),
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Lock down + expose only the two guest functions to the anon role.
revoke all on function public.event_by_token(text) from public;
revoke all on function public.submit_rsvp(text, text, text, int, text, text, text) from public;
grant execute on function public.event_by_token(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, int, text, text, text) to anon, authenticated;
