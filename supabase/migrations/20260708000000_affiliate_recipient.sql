-- Rename paystack_subaccount_code to paystack_recipient_code
ALTER TABLE public.affiliates RENAME COLUMN paystack_subaccount_code TO paystack_recipient_code;
