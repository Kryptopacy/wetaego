-- Migration to add billing_plan_code to organizations table for storing Paystack Plan Codes
alter table public.organizations
add column if not exists billing_plan_code text;
