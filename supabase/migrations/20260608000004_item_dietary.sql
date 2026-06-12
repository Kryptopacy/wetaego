-- Add dietary and allergen tracking to menu_items
alter table public.menu_items
add column if not exists dietary_tags text[] not null default array[]::text[],
add column if not exists allergens text[] not null default array[]::text[];
