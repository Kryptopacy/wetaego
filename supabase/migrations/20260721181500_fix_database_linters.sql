-- Phase 0: Linter Fixes (auth_rls_initplan)
-- Replace auth.uid() with (select auth.uid()) for optimal execution plans

DROP POLICY IF EXISTS "Promo codes are insertable by location managers." ON public.location_promo_codes;
CREATE POLICY "Promo codes are insertable by location managers." ON public.location_promo_codes FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.locations l ON l.organization_id = om.organization_id
        WHERE l.id = location_promo_codes.location_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'manager')
    )
);

DROP POLICY IF EXISTS "Promo codes are updatable by location managers." ON public.location_promo_codes;
CREATE POLICY "Promo codes are updatable by location managers." ON public.location_promo_codes FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.locations l ON l.organization_id = om.organization_id
        WHERE l.id = location_promo_codes.location_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'manager')
    )
);

DROP POLICY IF EXISTS "Promo codes are deletable by location managers." ON public.location_promo_codes;
CREATE POLICY "Promo codes are deletable by location managers." ON public.location_promo_codes FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.locations l ON l.organization_id = om.organization_id
        WHERE l.id = location_promo_codes.location_id
        AND om.user_id = (select auth.uid())
        AND om.role IN ('owner', 'manager')
    )
);

DROP POLICY IF EXISTS "Org members can manage milestones" ON public.order_milestones;
CREATE POLICY "Org members can manage milestones" ON public.order_milestones FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.orders o ON o.organization_id = om.organization_id
        WHERE o.id = order_milestones.order_id
        AND om.user_id = (select auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage their own addresses" ON public.customer_addresses FOR ALL TO authenticated
USING (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.customer_payment_methods;
CREATE POLICY "Users can view their own payment methods" ON public.customer_payment_methods FOR SELECT TO authenticated
USING (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.customer_payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON public.customer_payment_methods FOR DELETE TO authenticated
USING (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Enable all for org members" ON public.staff_notifications;
CREATE POLICY "Enable all for org members" ON public.staff_notifications FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = staff_notifications.organization_id
        AND om.user_id = (select auth.uid())
    )
);

-- Phase 0: Linter Fixes (function_search_path_mutable)
ALTER FUNCTION public.update_order_payment_status() SET search_path = '';
ALTER FUNCTION public.increment_loyalty_points(uuid, integer) SET search_path = '';

-- Phase 0: Linter Fixes (Security Definer Execution Rights)
REVOKE EXECUTE ON FUNCTION public.add_ad_hoc_item_rpc(uuid, text, bigint, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_ad_hoc_item_rpc(uuid, text, bigint, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_kiosk_tokens() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_kiosk_tokens() TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_ad_hoc_item_rpc(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_ad_hoc_item_rpc(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_manual_payment_rpc(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_manual_payment_rpc(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_booking_payment(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_booking_payment(uuid, integer, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_loyalty_points(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.log_manual_payment_rpc(uuid, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_manual_payment_rpc(uuid, bigint, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_iou_checkout(uuid, text, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_iou_checkout(uuid, text, uuid, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.process_wallet_checkout(uuid, uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_wallet_checkout(uuid, uuid, uuid, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.accept_invite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invite_by_token(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_order(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_order(uuid, integer) TO authenticated;


-- Phase 0: Fix Multiple Permissive Policies by splitting ALL into INSERT, UPDATE, DELETE 
-- where a SELECT policy already covers the same role or public.

-- deal_items
DROP POLICY IF EXISTS "Members can manage deal items" ON public.deal_items;
CREATE POLICY "Members can insert deal items" ON public.deal_items FOR INSERT TO authenticated
WITH CHECK (private.has_org_role((SELECT organization_id FROM public.deals WHERE id = deal_id), array['owner', 'manager']::public.member_role[]));

CREATE POLICY "Members can update deal items" ON public.deal_items FOR UPDATE TO authenticated
USING (private.has_org_role((SELECT organization_id FROM public.deals WHERE id = deal_id), array['owner', 'manager']::public.member_role[]));

CREATE POLICY "Members can delete deal items" ON public.deal_items FOR DELETE TO authenticated
USING (private.has_org_role((SELECT organization_id FROM public.deals WHERE id = deal_id), array['owner', 'manager']::public.member_role[]));

-- deals
DROP POLICY IF EXISTS "Members can manage deals" ON public.deals;
CREATE POLICY "Members can insert deals" ON public.deals FOR INSERT TO authenticated
WITH CHECK (private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[]));

CREATE POLICY "Members can update deals" ON public.deals FOR UPDATE TO authenticated
USING (private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[]));

CREATE POLICY "Members can delete deals" ON public.deals FOR DELETE TO authenticated
USING (private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[]));

-- location_availability
DROP POLICY IF EXISTS "editors can manage availability" ON public.location_availability;
CREATE POLICY "editors can insert availability" ON public.location_availability FOR INSERT TO authenticated
WITH CHECK (private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_id), array['owner', 'manager', 'editor']::public.member_role[]));

CREATE POLICY "editors can update availability" ON public.location_availability FOR UPDATE TO authenticated
USING (private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_id), array['owner', 'manager', 'editor']::public.member_role[]));

CREATE POLICY "editors can delete availability" ON public.location_availability FOR DELETE TO authenticated
USING (private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_id), array['owner', 'manager', 'editor']::public.member_role[]));

-- operating_hours
DROP POLICY IF EXISTS "Managers can manage operating hours" ON public.operating_hours;
CREATE POLICY "Managers can insert operating hours" ON public.operating_hours FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.locations l JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE l.id = operating_hours.location_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager')));

CREATE POLICY "Managers can update operating hours" ON public.operating_hours FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.locations l JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE l.id = operating_hours.location_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager')));

CREATE POLICY "Managers can delete operating hours" ON public.operating_hours FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.locations l JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE l.id = operating_hours.location_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager')));

-- page_collections
DROP POLICY IF EXISTS "Editors can manage collections" ON public.page_collections;
CREATE POLICY "Editors can insert collections" ON public.page_collections FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.location_pages lp JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE lp.id = page_collections.page_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

CREATE POLICY "Editors can update collections" ON public.page_collections FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.location_pages lp JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE lp.id = page_collections.page_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

CREATE POLICY "Editors can delete collections" ON public.page_collections FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.location_pages lp JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE lp.id = page_collections.page_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

-- page_item_collections
DROP POLICY IF EXISTS "Editors can manage item collections" ON public.page_item_collections;
CREATE POLICY "Editors can insert item collections" ON public.page_item_collections FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.page_items pi JOIN public.location_pages lp ON lp.id = pi.page_id JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE pi.id = page_item_collections.item_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

CREATE POLICY "Editors can update item collections" ON public.page_item_collections FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.page_items pi JOIN public.location_pages lp ON lp.id = pi.page_id JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE pi.id = page_item_collections.item_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

CREATE POLICY "Editors can delete item collections" ON public.page_item_collections FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.page_items pi JOIN public.location_pages lp ON lp.id = pi.page_id JOIN public.locations l ON l.id = lp.location_id JOIN public.organization_members om ON om.organization_id = l.organization_id WHERE pi.id = page_item_collections.item_id AND om.user_id = (select auth.uid()) AND om.role IN ('owner', 'manager', 'editor')));

