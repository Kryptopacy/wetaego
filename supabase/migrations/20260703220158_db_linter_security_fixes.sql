-- 1. function_search_path_mutable (Add SET search_path = public)
-- update_order_payment_status
ALTER FUNCTION public.update_order_payment_status SET search_path = public;

-- log_audit_event
ALTER FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, jsonb) FROM PUBLIC;

-- cleanup_demo_accounts (Internal cron job)
ALTER FUNCTION public.cleanup_demo_accounts() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.cleanup_demo_accounts() FROM PUBLIC;

-- sync_inventory_quantity (Internal trigger)
ALTER FUNCTION public.sync_inventory_quantity() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_quantity() FROM PUBLIC;

-- accept_invite_by_token (Client facing)
ALTER FUNCTION public.accept_invite_by_token(text) SET search_path = public;

-- claim_order (Client facing)
ALTER FUNCTION public.claim_order(uuid, integer) SET search_path = public;

-- 2. auth_rls_initplan (Performance optimizations)
-- coupon_redemptions
DROP POLICY IF EXISTS "Users can view their own org's redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can view their own org's redemptions" ON public.coupon_redemptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid())
        )
    );

-- iou_transactions
DROP POLICY IF EXISTS "Organization members can read iou transactions" ON public.iou_transactions;
CREATE POLICY "Organization members can read iou transactions" ON public.iou_transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Organization members can insert iou transactions" ON public.iou_transactions;
CREATE POLICY "Organization members can insert iou transactions" ON public.iou_transactions
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid())
        )
    );

-- iou_installments
DROP POLICY IF EXISTS "Organization members can manage iou installments" ON public.iou_installments;
CREATE POLICY "Organization members can manage iou installments" ON public.iou_installments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.organization_id = iou_installments.organization_id
            AND organization_members.user_id = (select auth.uid())
        )
    );

-- intercom_channels
DROP POLICY IF EXISTS "Organization members can create channels" ON public.intercom_channels;
CREATE POLICY "Organization members can create channels" ON public.intercom_channels
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Members can read their organization channels" ON public.intercom_channels;
CREATE POLICY "Members can read their organization channels" ON public.intercom_channels
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid())
        )
    );

-- intercom_channel_members
DROP POLICY IF EXISTS "Organization members can read channel members" ON public.intercom_channel_members;
CREATE POLICY "Organization members can read channel members" ON public.intercom_channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.intercom_channels c
            JOIN public.organization_members m ON c.organization_id = m.organization_id
            WHERE c.id = intercom_channel_members.channel_id AND m.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Organization members can insert channel members" ON public.intercom_channel_members;
CREATE POLICY "Organization members can insert channel members" ON public.intercom_channel_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.intercom_channels c
            JOIN public.organization_members m ON c.organization_id = m.organization_id
            WHERE c.id = channel_id AND m.user_id = (select auth.uid())
        )
    );

-- intercom_messages
DROP POLICY IF EXISTS "Members or managers can read channel messages" ON public.intercom_messages;
CREATE POLICY "Members or managers can read channel messages" ON public.intercom_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.intercom_channel_members cm
            WHERE cm.channel_id = intercom_messages.channel_id AND cm.user_id = (select auth.uid())
        ) OR 
        EXISTS (
            SELECT 1 FROM public.intercom_channels c
            JOIN public.organization_members m ON c.organization_id = m.organization_id
            WHERE c.id = intercom_messages.channel_id AND m.user_id = (select auth.uid()) AND m.role IN ('owner', 'manager')
        )
    );

DROP POLICY IF EXISTS "Members or managers can send messages" ON public.intercom_messages;
CREATE POLICY "Members or managers can send messages" ON public.intercom_messages
    FOR INSERT WITH CHECK (
        (user_id = (select auth.uid()) AND EXISTS (
            SELECT 1 FROM public.intercom_channel_members cm
            WHERE cm.channel_id = channel_id AND cm.user_id = (select auth.uid())
        )) OR 
        EXISTS (
            SELECT 1 FROM public.intercom_channels c
            JOIN public.organization_members m ON c.organization_id = m.organization_id
            WHERE c.id = channel_id AND m.user_id = (select auth.uid()) AND m.role IN ('owner', 'manager')
        )
    );

-- 3. multiple_permissive_policies

-- iou_settings
DROP POLICY IF EXISTS "Anyone can read IOU settings" ON public.iou_settings;
DROP POLICY IF EXISTS "Owners and managers can manage IOU settings" ON public.iou_settings;
CREATE POLICY "Owners and managers can manage IOU settings" ON public.iou_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = (select auth.uid()) AND role IN ('owner', 'manager')
        )
    );

-- inventory_items
DROP POLICY IF EXISTS "editor_manage_inv_items" ON public.inventory_items;
DROP POLICY IF EXISTS "org_read_inv_items" ON public.inventory_items;

CREATE POLICY "org_read_inv_items" ON public.inventory_items
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE (organization_members.user_id = (select auth.uid()))
    )
  );

CREATE POLICY "editor_manage_inv_items" ON public.inventory_items
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE (organization_members.user_id = (select auth.uid())) AND (organization_members.role IN ('owner', 'manager', 'editor'))
    )
  );
