-- Phase 4 High-Trust Commerce Migration (Wallets, BNPL, Split Tenders)

-- 1. Add Wallet & Escrow to customer_profiles
ALTER TABLE customer_profiles 
ADD COLUMN wallet_balance_minor BIGINT DEFAULT 0 NOT NULL,
ADD COLUMN wallet_escrow_minor BIGINT DEFAULT 0 NOT NULL;

-- 2. Create customer_addresses table
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    country TEXT NOT NULL DEFAULT 'Nigeria',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses" 
ON customer_addresses FOR ALL 
TO authenticated 
USING (customer_id = auth.uid()) 
WITH CHECK (customer_id = auth.uid());


-- 3. Create customer_payment_methods table (Paystack Tokenization)
CREATE TABLE customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    authorization_code TEXT NOT NULL,
    bin TEXT,
    last4 TEXT,
    exp_month TEXT,
    exp_year TEXT,
    channel TEXT,
    brand TEXT,
    reusable BOOLEAN DEFAULT true,
    signature TEXT,
    bank TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN', -- Currency Bound Token
    country_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);

ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods" 
ON customer_payment_methods FOR SELECT 
TO authenticated 
USING (customer_id = auth.uid());

CREATE POLICY "Users can delete their own payment methods" 
ON customer_payment_methods FOR DELETE 
TO authenticated 
USING (customer_id = auth.uid());


-- 4. Update order_milestones for Automated BNPL
ALTER TABLE order_milestones
ADD COLUMN due_date TIMESTAMPTZ,
ADD COLUMN auto_charge_enabled BOOLEAN DEFAULT false,
ADD COLUMN payment_method_id UUID REFERENCES customer_payment_methods(id) ON DELETE SET NULL;

CREATE INDEX idx_order_milestones_due_date ON order_milestones(due_date);

-- Trigger for updating updated_at
CREATE TRIGGER set_customer_addresses_updated_at
BEFORE UPDATE ON customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_customer_payment_methods_updated_at
BEFORE UPDATE ON customer_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
