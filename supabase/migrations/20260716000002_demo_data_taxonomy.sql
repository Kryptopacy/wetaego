-- ============================================================
-- OurMenu: Demo Data Taxonomy Migration
-- Safely converts legacy page_items categories (stored in item_data)
-- into the new Universal Taxonomy Engine (page_collections).
-- ============================================================

DO $$
DECLARE
    r RECORD;
    new_collection_id UUID;
    cat_name TEXT;
    cat_slug TEXT;
BEGIN
    -- Loop through all unique page_id and category combinations from page_items
    FOR r IN
        SELECT DISTINCT 
            page_id, 
            item_data->>'category' as category_name
        FROM public.page_items
        WHERE item_data ? 'category' AND item_data->>'category' IS NOT NULL
    LOOP
        cat_name := r.category_name;
        cat_slug := lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g'));
        cat_slug := trim(both '-' from cat_slug);

        -- Create the page_collection if it doesn't exist
        INSERT INTO public.page_collections (page_id, name, slug)
        VALUES (r.page_id, cat_name, cat_slug)
        ON CONFLICT (page_id, slug) DO UPDATE SET id = public.page_collections.id
        RETURNING id INTO new_collection_id;

        -- Map all page_items with this category to the new collection
        INSERT INTO public.page_item_collections (item_id, collection_id)
        SELECT id, new_collection_id
        FROM public.page_items
        WHERE page_id = r.page_id 
          AND item_data->>'category' = cat_name
        ON CONFLICT DO NOTHING;

    END LOOP;

    -- Clean up: Remove the 'category' key from item_data now that they are mapped
    UPDATE public.page_items
    SET item_data = item_data - 'category'
    WHERE item_data ? 'category';

END $$;
