CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_items jsonb
) RETURNS boolean AS $$
DECLARE
  item jsonb;
  v_item_id uuid;
  v_qty int;
  v_current_stock int;
BEGIN
  -- p_items is an array of objects: [{"item_id": "uuid", "quantity": 1}]
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (item->>'item_id')::uuid;
    v_qty := (item->>'quantity')::int;
    
    -- Lock the row
    SELECT stock_count INTO v_current_stock 
    FROM public.menu_items 
    WHERE id = v_item_id 
    FOR UPDATE;
    
    -- If stock_count is not null, we must decrement
    IF v_current_stock IS NOT NULL THEN
      IF v_current_stock < v_qty THEN
        -- Insufficient stock
        RAISE EXCEPTION 'Insufficient stock for item %', v_item_id;
      END IF;
      
      UPDATE public.menu_items
      SET stock_count = stock_count - v_qty
      WHERE id = v_item_id;
      
      -- Auto-flip to sold_out if it hits 0
      IF (v_current_stock - v_qty) = 0 THEN
        UPDATE public.menu_items
        SET availability_status = 'sold_out'
        WHERE id = v_item_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_stock(
  p_items jsonb
) RETURNS boolean AS $$
DECLARE
  item jsonb;
  v_item_id uuid;
  v_qty int;
  v_current_stock int;
BEGIN
  -- p_items is an array of objects: [{"item_id": "uuid", "quantity": 1}]
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (item->>'item_id')::uuid;
    v_qty := (item->>'quantity')::int;
    
    SELECT stock_count INTO v_current_stock 
    FROM public.menu_items 
    WHERE id = v_item_id 
    FOR UPDATE;
    
    IF v_current_stock IS NOT NULL THEN
      UPDATE public.menu_items
      SET stock_count = stock_count + v_qty
      WHERE id = v_item_id;
      
      -- Auto-flip to available if it was sold out and now has stock
      IF v_current_stock = 0 AND v_qty > 0 THEN
        UPDATE public.menu_items
        SET availability_status = 'available'
        WHERE id = v_item_id AND availability_status = 'sold_out';
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
