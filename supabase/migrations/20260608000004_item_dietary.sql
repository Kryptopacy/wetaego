-- Add dietary and allergen tracking to menu_items
alter table public.menu_items
add column dietary_tags text[] not null default array[]::text[],
add column allergens text[] not null default array[]::text[];
