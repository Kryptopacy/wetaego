-- Phase 2: BOM and COGS Tracking

CREATE TABLE IF NOT EXISTS public.item_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
    page_item_id uuid REFERENCES public.page_items(id) ON DELETE CASCADE,
    inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_required numeric(12,3) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
      (menu_item_id IS NOT NULL AND page_item_id IS NULL) OR
      (menu_item_id IS NULL AND page_item_id IS NOT NULL)
    )
);

-- RLS for item_ingredients
ALTER TABLE public.item_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item_ingredients for their organization"
    ON public.item_ingredients FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.organizations WHERE created_by = auth.uid()
    ));

CREATE POLICY "Users can insert item_ingredients for their organization"
    ON public.item_ingredients FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.organizations WHERE created_by = auth.uid()
    ));

CREATE POLICY "Users can update item_ingredients for their organization"
    ON public.item_ingredients FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.organizations WHERE created_by = auth.uid()
    ));

CREATE POLICY "Users can delete item_ingredients for their organization"
    ON public.item_ingredients FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.organizations WHERE created_by = auth.uid()
    ));

-- Add cogs_minor to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS cogs_minor integer;

-- Update decrement_stock to also decrement BOM ingredients
CREATE OR REPLACE FUNCTION public.decrement_stock(p_items jsonb)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    item jsonb;
    v_item_id uuid;
    v_qty int;
    v_current_stock int;
    bom_item RECORD;
  BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_item_id := (item->>'item_id')::uuid;
      v_qty     := (item->>'quantity')::int;
  
      -- Check menu_items for direct stock_count
      SELECT stock_count INTO v_current_stock
      FROM public.menu_items
      WHERE id = v_item_id
      FOR UPDATE;
  
      IF v_current_stock IS NOT NULL THEN
        IF v_current_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient stock for item %', v_item_id;
        END IF;
  
        UPDATE public.menu_items
        SET stock_count = stock_count - v_qty
        WHERE id = v_item_id;
      END IF;

      -- Decrement BOM ingredients (for both menu_items and page_items)
      FOR bom_item IN 
        SELECT inventory_item_id, quantity_required, organization_id
        FROM public.item_ingredients 
        WHERE menu_item_id = v_item_id OR page_item_id = v_item_id
      LOOP
        UPDATE public.inventory_items
        SET current_quantity = current_quantity - (bom_item.quantity_required * v_qty)
        WHERE id = bom_item.inventory_item_id;

        -- Optionally log movement? Let's skip for atomic speed.
      END LOOP;

    END LOOP;
  
    RETURN true;
  END;
  $$;

-- Update increment_stock to also increment BOM ingredients (for cancellations)
CREATE OR REPLACE FUNCTION public.increment_stock(p_items jsonb)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    item jsonb;
    v_item_id uuid;
    v_qty int;
    v_current_stock int;
    bom_item RECORD;
  BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_item_id := (item->>'item_id')::uuid;
      v_qty     := (item->>'quantity')::int;
  
      SELECT stock_count INTO v_current_stock
      FROM public.menu_items
      WHERE id = v_item_id
      FOR UPDATE;
  
      IF v_current_stock IS NOT NULL THEN
        UPDATE public.menu_items
        SET stock_count = stock_count + v_qty
        WHERE id = v_item_id;
  
        IF v_current_stock = 0 AND v_qty > 0 THEN
          UPDATE public.menu_items
          SET availability_status = 'available'
          WHERE id = v_item_id AND availability_status = 'sold_out';
        END IF;
      END IF;

      -- Increment BOM ingredients back
      FOR bom_item IN 
        SELECT inventory_item_id, quantity_required 
        FROM public.item_ingredients 
        WHERE menu_item_id = v_item_id OR page_item_id = v_item_id
      LOOP
        UPDATE public.inventory_items
        SET current_quantity = current_quantity + (bom_item.quantity_required * v_qty)
        WHERE id = bom_item.inventory_item_id;
      END LOOP;

    END LOOP;
  
    RETURN true;
  END;
  $$;
