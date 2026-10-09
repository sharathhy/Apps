-- Partner sharing (Phase 4).
--
-- A pregnant person (the owner) can invite a partner with a one-time code
-- and choose what to share. The partner reads only those parts, and only
-- while the link exists: either side can delete the link, and the last link
-- going away deletes the shared copy. Sharing needs the owner's
-- "partner_sharing" consent in the ledger. Only a small summary is shared
-- (due date, upcoming appointment titles and times, kick sessions); notes,
-- symptoms and weight are never shared.

create type public.share_scope as enum ('week', 'appointments', 'kicks');

-- Latest consent decision per category decides; no row means no consent.
create or replace function public.has_consent(p_category public.consent_category)
returns boolean
language sql stable security invoker set search_path = public as $$
  select coalesce(
    (select granted from public.consents
      where user_id = auth.uid() and category = p_category
      order by created_at desc limit 1),
    false);
$$;

create table public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- SHA-256 of the code; the code itself is never stored.
  code_hash text not null unique check (char_length(code_hash) = 64),
  scopes public.share_scope[] not null check (cardinality(scopes) between 1 and 3),
  label text check (char_length(label) <= 60),
  expires_at timestamptz not null default now() + interval '7 days'
    check (expires_at <= now() + interval '7 days 1 minute'),
  created_at timestamptz not null default now()
);

create table public.partner_links (
  id uuid primary key default gen_random_uuid(),
  -- The owner, whose data is shared.
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references auth.users (id) on delete cascade,
  scopes public.share_scope[] not null check (cardinality(scopes) between 1 and 3),
  label text check (char_length(label) <= 60),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, partner_id),
  check (user_id <> partner_id)
);
create index partner_links_partner_idx on public.partner_links (partner_id);

-- The shared summary, one row per scope, written by the owner's app.
create table public.partner_snapshots (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scope public.share_scope not null,
  data jsonb not null check (pg_column_size(data) <= 32768),
  updated_at timestamptz not null default now(),
  primary key (user_id, scope)
);

-- Expo push tokens, used only for server events such as partner updates.
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null check (char_length(token) <= 200),
  platform text not null check (platform in ('ios', 'android')),
  -- Picks the wording of the neutral notification.
  language text not null default 'en' check (language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create trigger touch_partner_snapshots before update on public.partner_snapshots
  for each row execute function public.touch_updated_at();
create trigger touch_push_tokens before update on public.push_tokens
  for each row execute function public.touch_updated_at();

alter table public.partner_invites enable row level security;
alter table public.partner_invites force row level security;
alter table public.partner_links enable row level security;
alter table public.partner_links force row level security;
alter table public.partner_snapshots enable row level security;
alter table public.partner_snapshots force row level security;
alter table public.push_tokens enable row level security;
alter table public.push_tokens force row level security;

-- Supabase's default privileges grant everything (TRUNCATE included) to
-- anon and authenticated; start from nothing.
revoke all on public.partner_invites, public.partner_links, public.partner_snapshots,
  public.push_tokens from anon, authenticated;

-- Invites: the owner manages their own, and may only create one with consent.
grant select, insert, delete on public.partner_invites to authenticated;
create policy "read own invites" on public.partner_invites for select to authenticated
  using (user_id = auth.uid());
create policy "create invites with consent" on public.partner_invites for insert to authenticated
  with check (user_id = auth.uid() and public.has_consent('partner_sharing'));
create policy "delete own invites" on public.partner_invites for delete to authenticated
  using (user_id = auth.uid());

-- Links: both sides can see and end a link. Only the owner can change what
-- is shared. Links are only created by accept_partner_invite.
grant select, delete on public.partner_links to authenticated;
grant update (scopes, label) on public.partner_links to authenticated;
create policy "see own links" on public.partner_links for select to authenticated
  using (user_id = auth.uid() or partner_id = auth.uid());
create policy "end own links" on public.partner_links for delete to authenticated
  using (user_id = auth.uid() or partner_id = auth.uid());
create policy "owner changes scopes" on public.partner_links for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Snapshots: the owner writes them while consent stands; a partner reads
-- only the scopes their link includes.
grant select, insert, update, delete on public.partner_snapshots to authenticated;
create policy "owner reads snapshots" on public.partner_snapshots for select to authenticated
  using (user_id = auth.uid());
create policy "partner reads shared scopes" on public.partner_snapshots for select to authenticated
  using (exists (
    select 1 from public.partner_links l
    where l.user_id = partner_snapshots.user_id
      and l.partner_id = auth.uid()
      and partner_snapshots.scope = any (l.scopes)));
create policy "owner writes snapshots" on public.partner_snapshots for insert to authenticated
  with check (user_id = auth.uid() and public.has_consent('partner_sharing'));
create policy "owner updates snapshots" on public.partner_snapshots for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_consent('partner_sharing'));
create policy "owner deletes snapshots" on public.partner_snapshots for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.push_tokens to authenticated;
create policy "own push tokens" on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Accepting an invite: the only way a link is created. The code is single
-- use and expires after 7 days.
create or replace function public.accept_partner_invite(p_code text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  invite public.partner_invites;
  link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select * into invite from public.partner_invites
    where code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
      and expires_at > now()
    for update;
  if not found then
    raise exception 'invalid or expired code' using errcode = 'P0002';
  end if;
  if invite.user_id = auth.uid() then
    raise exception 'cannot accept your own invite' using errcode = '22023';
  end if;
  insert into public.partner_links (user_id, partner_id, scopes, label)
    values (invite.user_id, auth.uid(), invite.scopes, invite.label)
    on conflict (user_id, partner_id) do update set scopes = excluded.scopes, label = excluded.label
    returning id into link_id;
  delete from public.partner_invites where id = invite.id;
  return link_id;
end;
$$;
revoke all on function public.accept_partner_invite(text) from public, anon;
grant execute on function public.accept_partner_invite(text) to authenticated;

-- When the last link goes away, the shared copy goes with it.
create or replace function public.drop_unshared_snapshots() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.partner_links where user_id = old.user_id) then
    delete from public.partner_snapshots where user_id = old.user_id;
  end if;
  return old;
end;
$$;
create trigger partner_links_cleanup after delete on public.partner_links
  for each row execute function public.drop_unshared_snapshots();

-- Withdrawing partner_sharing consent ends every link and deletes the shared copy.
create or replace function public.end_sharing_on_withdrawal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.category = 'partner_sharing' and not new.granted then
    delete from public.partner_links where user_id = new.user_id;
    delete from public.partner_invites where user_id = new.user_id;
    delete from public.partner_snapshots where user_id = new.user_id;
  end if;
  return new;
end;
$$;
create trigger consents_end_sharing after insert on public.consents
  for each row execute function public.end_sharing_on_withdrawal();
