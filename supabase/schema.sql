create extension if not exists pgcrypto;

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('g', 'kg', 'mL')),
  nutrients_per_100 jsonb not null default '{}'::jsonb,
  source text,
  verification_status text not null default 'estimated' check (verification_status in ('estimated','calculated','verified')),
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cooked_batch_weight_g numeric,
  servings integer not null default 1 check (servings > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g','kg','mL')),
  primary key (recipe_id, ingredient_id)
);

alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
create policy "ingredients owner access" on public.ingredients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes owner access" on public.recipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipe lines via recipe owner" on public.recipe_ingredients for all using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())) with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));
