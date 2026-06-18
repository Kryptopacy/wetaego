-- 20260617000009_security_linter_fixes.sql

-- 1. Fix mutable search_path by explicitly setting it for SECURITY DEFINER functions
ALTER FUNCTION public.update_order_payment_status() SET search_path = public;
ALTER FUNCTION public.auto_checkout_stale_shifts() SET search_path = public;

-- For good measure, set search_path on other SECURITY DEFINER functions to prevent search_path injection attacks
ALTER FUNCTION public.cleanup_stale_orders() SET search_path = public;
ALTER FUNCTION public.enforce_subscription_grace_periods() SET search_path = public;
ALTER FUNCTION public.get_invite_by_token(text) SET search_path = public;
ALTER FUNCTION public.accept_invite_by_token(text) SET search_path = public;
ALTER FUNCTION public.claim_order(uuid, integer) SET search_path = public;

-- 2. Revoke direct public/anon/authenticated execution of background cron functions
REVOKE EXECUTE ON FUNCTION public.auto_checkout_stale_shifts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_subscription_grace_periods() FROM PUBLIC, anon, authenticated;

-- 3. Revoke direct execution of trigger functions
REVOKE EXECUTE ON FUNCTION public.update_order_payment_status() FROM PUBLIC, anon, authenticated;

-- NOTE on RLS Policy Warnings:
-- The linter flags `page_bookings` and `page_inquiries` having INSERT WITH CHECK (true). 
-- This is INTENTIONAL, as these tables serve as public lead-capture and reservation forms where guests (anon) must be able to insert rows.

-- NOTE on Publicly Executable SECURITY DEFINER Warnings:
-- The linter flags `get_invite_by_token`, `accept_invite_by_token`, and `claim_order`.
-- This is INTENTIONAL. These functions are designed to bypass RLS securely using a cryptographically secure token or specific business logic checks (like claiming an order) that cannot be purely expressed in standard RLS policies.
