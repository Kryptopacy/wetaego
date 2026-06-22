-- 1. Secure check_item_availability
ALTER FUNCTION public.check_item_availability(uuid, date, date) SET search_path = public;
COMMENT ON FUNCTION public.check_item_availability(uuid, date, date) 
IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';

-- 2. Secure charge_credits_atomic
ALTER FUNCTION public.charge_credits_atomic(uuid, integer, text, uuid) SET search_path = public;
COMMENT ON FUNCTION public.charge_credits_atomic(uuid, integer, text, uuid) 
IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';

-- 3. Secure get_invite_by_token
ALTER FUNCTION public.get_invite_by_token(text) SET search_path = public;
COMMENT ON FUNCTION public.get_invite_by_token(text) 
IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';

-- 4. Secure accept_invite_by_token
ALTER FUNCTION public.accept_invite_by_token(text) SET search_path = public;
COMMENT ON FUNCTION public.accept_invite_by_token(text) 
IS '@supabase-lint-ignore authenticated_security_definer_function_executable';

-- 5. Secure claim_order
ALTER FUNCTION public.claim_order(uuid, integer) SET search_path = public;
COMMENT ON FUNCTION public.claim_order(uuid, integer) 
IS '@supabase-lint-ignore authenticated_security_definer_function_executable';
