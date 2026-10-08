-- Phase 3: drink type for water entries and the local day an entry counts toward.
alter table public.water_logs
  add column drink text not null default 'water'
    check (drink in ('water', 'tea', 'coffee', 'milk', 'juice', 'coconutWater', 'buttermilk', 'other')),
  add column local_day date;

-- Mood check-ins also record the local day, so travel does not move them.
alter table public.mood_entries add column local_day date;
