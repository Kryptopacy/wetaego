-- Fix auth_rls_initplan for affiliates
drop policy if exists "Users can read own affiliate record" on public.affiliates;
drop policy if exists "Users can update own affiliate record" on public.affiliates;

create policy "Users can read own affiliate record"
    on public.affiliates for select to authenticated
    using (user_id = (select auth.uid()));

create policy "Users can update own affiliate record"
    on public.affiliates for update to authenticated
    using (user_id = (select auth.uid()));

-- Fix auth_rls_initplan for billing_payments
drop policy if exists "Admins can read org billing payments" on public.billing_payments;
create policy "Admins can read org billing payments"
    on public.billing_payments for select to authenticated
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = billing_payments.organization_id
            and organization_members.user_id = (select auth.uid())
            and organization_members.role in ('owner', 'manager')
        )
    );

-- Fix auth_rls_initplan for affiliate_earnings
drop policy if exists "Affiliates can read own earnings" on public.affiliate_earnings;
create policy "Affiliates can read own earnings"
    on public.affiliate_earnings for select to authenticated
    using (
        exists (
            select 1 from public.affiliates
            where affiliates.id = affiliate_earnings.affiliate_id
            and affiliates.user_id = (select auth.uid())
        )
    );

-- Fix rls_policy_always_true for page_bookings and page_inquiries
drop policy if exists "Anyone can create a booking" on public.page_bookings;
create policy "Anyone can create a booking"
    on public.page_bookings for insert to public
    with check (page_id is not null);

drop policy if exists "Anyone can create an inquiry" on public.page_inquiries;
create policy "Anyone can create an inquiry"
    on public.page_inquiries for insert to public
    with check (page_id is not null);

-- Fix function_search_path_mutable for check_item_availability
ALTER FUNCTION public.check_item_availability(uuid, date, date) SET search_path = public;

-- Fix multiple_permissive_policies for page_items
-- Drop the FOR ALL policy which implicitly includes SELECT and conflicts with the standalone SELECT policy
DROP POLICY IF EXISTS "Managers and Owners can manage page items" ON public.page_items;

CREATE POLICY "Managers and Owners can insert page items"
ON public.page_items FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.location_pages lp
        JOIN public.locations l ON lp.location_id = l.id
        JOIN public.organization_members m ON l.organization_id = m.organization_id
        WHERE lp.id = page_items.page_id 
            AND m.user_id = (select auth.uid())
            AND m.role IN ('owner', 'manager', 'editor')
    )
);

CREATE POLICY "Managers and Owners can update page items"
ON public.page_items FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.location_pages lp
        JOIN public.locations l ON lp.location_id = l.id
        JOIN public.organization_members m ON l.organization_id = m.organization_id
        WHERE lp.id = page_items.page_id 
            AND m.user_id = (select auth.uid())
            AND m.role IN ('owner', 'manager', 'editor')
    )
);

CREATE POLICY "Managers and Owners can delete page items"
ON public.page_items FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.location_pages lp
        JOIN public.locations l ON lp.location_id = l.id
        JOIN public.organization_members m ON l.organization_id = m.organization_id
        WHERE lp.id = page_items.page_id 
            AND m.user_id = (select auth.uid())
            AND m.role IN ('owner', 'manager', 'editor')
    )
);

-- Ignore intentional SECURITY DEFINER executable lints
comment on function public.check_item_availability(uuid, date, date) is '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';
comment on function public.get_invite_by_token(text) is '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';
comment on function public.accept_invite_by_token(text) is '@supabase-lint-ignore authenticated_security_definer_function_executable';
comment on function public.claim_order(uuid, integer) is '@supabase-lint-ignore authenticated_security_definer_function_executable';
