-- Wellness suite: initial schema.
--
-- Every table that holds a person's data has a user_id column and Row Level
-- Security that limits every operation to rows where user_id = auth.uid().
-- Child rows reference their parent by (id, user_id) so a row can never be
-- attached to another person's record. Deleting the auth user cascades to
-- every row. Data is encrypted at rest by the Supabase platform (AES-256 disk
-- encryption); nothing here is used for advertising.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.audience as enum ('women', 'men', 'everyone');
create type public.module_id as enum ('water', 'mood', 'sleep', 'cycle', 'pregnancy', 'nutrition');
create type public.consent_category as enum (
  'water', 'mood', 'sleep', 'cycle', 'pregnancy', 'nutrition',
  'notifications', 'partner_sharing', 'anonymous_analytics'
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profile and consent
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  audience public.audience,
  language text not null default 'en' check (language in ('en', 'hi')),
  region text not null default 'IN' check (region in ('IN', 'US')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  timezone text not null default 'Asia/Kolkata',
  enabled_modules public.module_id[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only consent ledger: the latest row per category is the current state.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category public.consent_category not null,
  granted boolean not null,
  policy_version text not null,
  created_at timestamptz not null default now()
);
create index consents_user_category_idx on public.consents (user_id, category, created_at desc);

-- ---------------------------------------------------------------------------
-- Water, mood, journal, breathing, sleep
-- ---------------------------------------------------------------------------
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0 and amount_ml <= 5000),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mood smallint not null check (mood between 1 and 5),
  tags text[] not null default '{}',
  note text check (char_length(note) <= 2000),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt_key text,
  body text not null check (char_length(body) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.breathing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pattern text not null,
  duration_seconds integer not null check (duration_seconds > 0 and duration_seconds <= 3600),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bed_at timestamptz not null,
  wake_at timestamptz not null,
  quality smallint check (quality between 1 and 5),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (wake_at > bed_at and wake_at - bed_at <= interval '24 hours')
);

-- ---------------------------------------------------------------------------
-- Cycle
-- ---------------------------------------------------------------------------
create table public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.cycle_day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  flow text check (flow in ('none', 'spotting', 'light', 'medium', 'heavy')),
  symptoms text[] not null default '{}',
  mood smallint check (mood between 1 and 5),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Pregnancy
-- ---------------------------------------------------------------------------
create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lmp_date date,
  due_date date not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.pregnancy_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pregnancy_id uuid not null,
  title text not null check (char_length(title) <= 200),
  scheduled_at timestamptz not null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pregnancy_id, user_id) references public.pregnancies (id, user_id) on delete cascade
);

create table public.kick_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pregnancy_id uuid not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  kick_count integer not null default 0 check (kick_count >= 0 and kick_count <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pregnancy_id, user_id) references public.pregnancies (id, user_id) on delete cascade,
  check (ended_at is null or ended_at >= started_at)
);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg > 0 and weight_kg < 400),
  context public.module_id not null default 'pregnancy',
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module public.module_id not null,
  symptom text not null,
  severity smallint check (severity between 1 and 3),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.baby_names (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list text not null check (list in ('hospital_bag')),
  label text not null check (char_length(label) <= 200),
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Nutrition
-- ---------------------------------------------------------------------------
create table public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) <= 200),
  barcode text,
  serving_unit text not null,
  serving_grams numeric(7, 2) check (serving_grams > 0),
  energy_kcal numeric(7, 2) check (energy_kcal >= 0),
  protein_g numeric(6, 2) check (protein_g >= 0),
  carbs_g numeric(6, 2) check (carbs_g >= 0),
  fat_g numeric(6, 2) check (fat_g >= 0),
  fiber_g numeric(6, 2) check (fiber_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_id uuid not null,
  food_ref text not null,
  name text not null,
  quantity numeric(7, 2) not null check (quantity > 0),
  unit text not null,
  energy_kcal numeric(7, 2) check (energy_kcal >= 0),
  protein_g numeric(6, 2) check (protein_g >= 0),
  carbs_g numeric(6, 2) check (carbs_g >= 0),
  fat_g numeric(6, 2) check (fat_g >= 0),
  fiber_g numeric(6, 2) check (fiber_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (meal_id, user_id) references public.meals (id, user_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Shared platform: achievements, reminders, notification preferences
-- ---------------------------------------------------------------------------
create table public.achievements_earned (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module public.module_id,
  kind text not null check (kind in ('scheduled', 'smart', 'requirement', 'insight', 'achievement')),
  template_key text not null,
  -- { "times": ["08:00"], "weekdays": [1..7] } in the user's local time zone
  schedule jsonb not null,
  timezone text not null,
  enabled boolean not null default true,
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Everything is off until the person opts in during onboarding.
  global_enabled boolean not null default false,
  modules jsonb not null default '{}',
  types jsonb not null default '{}',
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  daily_limit smallint not null default 3 check (daily_limit between 1 and 5),
  lock_screen_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Anonymous delivery log for debugging: no user id, no message text.
create table public.notification_log (
  id bigint generated always as identity primary key,
  type text not null,
  module public.module_id,
  platform text not null check (platform in ('ios', 'android', 'web')),
  outcome text not null check (outcome in ('delivered', 'skipped_quiet_hours', 'skipped_limit', 'failed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Start from nothing and grant only what each table needs. Supabase grants
-- broad default privileges (including TRUNCATE, which bypasses RLS), so they
-- are removed here first.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

do $$
declare
  t text;
  owned text[] := array[
    'water_logs', 'mood_entries', 'journal_entries', 'breathing_sessions', 'sleep_logs',
    'cycle_periods', 'cycle_day_logs', 'pregnancies', 'pregnancy_appointments', 'kick_sessions',
    'weight_logs', 'symptom_logs', 'baby_names', 'checklist_items', 'custom_foods', 'meals',
    'meal_items', 'achievements_earned', 'reminders', 'notification_preferences'
  ];
begin
  foreach t in array owned loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create trigger touch_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', t);
    if t not in ('notification_preferences') then
      execute format('create index %I on public.%I (user_id, created_at desc)', t || '_user_idx', t);
    end if;
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
grant select, insert, update, delete on public.profiles to authenticated;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create trigger touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Consents are an audit trail: people can read and add their own, never edit or delete.
alter table public.consents enable row level security;
alter table public.consents force row level security;
grant select, insert on public.consents to authenticated;
create policy "read own consents" on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own consents" on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Delivery log: write-only for signed-in clients, readable only with the service role.
alter table public.notification_log enable row level security;
alter table public.notification_log force row level security;
grant insert on public.notification_log to authenticated;
grant usage on all sequences in schema public to authenticated;
create policy "write delivery log" on public.notification_log for insert to authenticated
  with check (true);

-- Create a profile row automatically for every new account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
