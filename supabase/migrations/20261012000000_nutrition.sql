-- Phase 5: Nutrition.

-- Whether a meal was home-cooked (for the "Home cooking" achievement).
alter table public.meals add column home_cooked boolean not null default false;

-- Where a custom food's values came from: typed in, or an Open Food Facts lookup.
alter table public.custom_foods
  add column source text not null default 'manual' check (source in ('manual', 'openFoodFacts'));
