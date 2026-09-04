-- Wallet ledger and atomic refund RPC.
-- Adds the wallet_transactions ledger table referenced by wallet operations
-- and a refund_wallet RPC that atomically credits a customer wallet under
-- a row lock, replacing the racy read-then-write refund path.

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_minor bigint NOT NULL,
  balance_after_minor bigint,
  transaction_type text NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  description text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_customer_idx
  ON public.wallet_transactions (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_transactions_org_idx
  ON public.wallet_transactions (organization_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet ledger rows are read/written by the service role only; merchants
-- read customer wallets through customer_profiles (already scoped by RLS).
CREATE POLICY "wallet transactions org scoped read" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles cp
      WHERE cp.id = wallet_transactions.customer_id
        AND private.has_org_role(cp.organization_id, array['owner', 'manager']::public.member_role[])
    )
  );

CREATE OR REPLACE FUNCTION public.refund_wallet(
  p_organization_id uuid,
  p_customer_id uuid,
  p_amount_minor bigint,
  p_description text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance bigint;
BEGIN
  IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
    RAISE EXCEPTION 'invalid refund amount';
  END IF;

  UPDATE public.customer_profiles
  SET wallet_balance_minor = wallet_balance_minor + p_amount_minor
  WHERE id = p_customer_id
    AND organization_id = p_organization_id
  RETURNING wallet_balance_minor INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'customer wallet not found';
  END IF;

  INSERT INTO public.wallet_transactions (
    organization_id, customer_id, amount_minor, balance_after_minor,
    transaction_type, description, status
  ) VALUES (
    p_organization_id, p_customer_id, p_amount_minor, v_balance,
    'credit', p_description, 'completed'
  );

  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_wallet(uuid, uuid, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_wallet(uuid, uuid, bigint, text) TO service_role;
