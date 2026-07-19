-- Migration to secure mutations by dropping anon insert policies for sensitive tables
-- The application uses secure server actions with admin privileges for these inserts,
-- so public/anon policies are a security vulnerability.

drop policy if exists "public can insert orders" on public.orders;
drop policy if exists "public can insert order items" on public.order_items;
drop policy if exists "public can insert service requests" on public.service_requests;
