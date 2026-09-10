-- Client shopping list: lets a client pick how many days this week they'll eat each meal option
-- (e.g. 3x Breakfast A, 4x Breakfast B) and get a full ingredient list for the week, with a
-- tick-off checklist. One row per client — regenerating with new day-counts just overwrites it.
create table if not exists client_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade unique,
  selections jsonb not null default '{}'::jsonb,     -- { slotKey: dayCount }
  checked_items text[] not null default '{}',        -- ingredient keys (ingredient_id, or "name:<lowercased name>")
  updated_at timestamptz not null default now()
);

alter table client_shopping_lists enable row level security;

create policy "Client can manage own shopping list"
on client_shopping_lists for all
to authenticated
using (client_id in (select id from clients where profile_id = auth.uid()))
with check (client_id in (select id from clients where profile_id = auth.uid()));

create policy "Coach can read clients' shopping lists"
on client_shopping_lists for select
to authenticated
using (client_id in (select id from clients where coach_id = auth.uid()));

-- Which exact product an ingredient's macros were taken from, so a client who doesn't recognise
-- an ingredient can see a photo of what to actually buy. All optional — the shopping list and
-- recipe views work fine without them, they just skip the photo for that ingredient.
alter table ingredients add column if not exists product_photo_url text;
alter table ingredients add column if not exists product_name text;
alter table ingredients add column if not exists product_brand text;

-- Create a Storage bucket named "ingredient-photos" in the Supabase Dashboard (Storage section),
-- same settings as the existing "meal-photos" bucket — this migration can't create buckets itself.
