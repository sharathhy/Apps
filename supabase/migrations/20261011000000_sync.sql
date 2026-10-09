-- Phase 5: offline sync.
--
-- The app logs on the device first and syncs later, so the time a change
-- was made is the device's, not the server's. updated_at now keeps the
-- value the device sends (never later than a few minutes ahead of the
-- server clock) and is only stamped by the server when the client leaves
-- it unchanged. A few columns are added so every tracker's entries can be
-- stored exactly as they are on the device.

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  elsif new.updated_at > now() + interval '5 minutes' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- The local day an entry counts toward, so travel never moves it.
alter table public.journal_entries add column local_day date;
alter table public.sleep_logs add column local_day date;
alter table public.weight_logs add column local_day date;
alter table public.meals add column local_day date;

-- Pregnancy symptom entries hold several symptoms and a note.
alter table public.symptom_logs
  alter column symptom drop not null,
  add column symptoms text[] not null default '{}',
  add column note text check (char_length(note) <= 2000),
  add column local_day date;

alter table public.pregnancy_appointments add column remind boolean not null default true;

-- Built-in checklist items are translated on the device by key.
alter table public.checklist_items add column item_key text check (char_length(item_key) <= 40);

-- Food group of a logged item, for the balanced plate view.
alter table public.meal_items
  add column food_group text check (food_group in
    ('grains', 'pulses', 'vegetables', 'fruits', 'dairy', 'protein', 'nutsSeeds', 'fats', 'sweets', 'drinks', 'mixed', 'other'));
alter table public.custom_foods
  add column food_group text check (food_group in
    ('grains', 'pulses', 'vegetables', 'fruits', 'dairy', 'protein', 'nutsSeeds', 'fats', 'sweets', 'drinks', 'mixed', 'other'));
