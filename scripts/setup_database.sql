-- ==========================================================================
-- OMNIBRAND AFFILIATE ADMIN - CONSOLIDATED DATABASE SETUP & SECURITY
-- Target: Supabase "Vitrines de luxo"
-- ==========================================================================

-- 1. EXTENSIONS & FUNCTIONS (Assumed existing, but including for reference)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE OR REPLACE FUNCTION public.is_store_admin() RETURNS boolean ... (Provided by Supabase environment)

-- 2. TABLE CREATION (Ensuring persistence for all modules)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    showcase_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
    order_id text,
    product_name text,
    sale_amount numeric(10,2),
    commission_rate numeric(5,2),
    commission_amount numeric(10,2),
    status text DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Pago')),
    created_at timestamptz DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 4. CLEANUP OLD POLICIES (Protection against duplication)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- 5. DEFINE NEW SECURITY POLICIES

-- [PROFILES]
CREATE POLICY "Profiles self management" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id OR public.is_store_admin())
WITH CHECK (auth.uid() = id OR public.is_store_admin());

-- [BRANDS]
CREATE POLICY "Brands public read" ON public.brands
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Brands admin all" ON public.brands
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- [PRODUCTS]
CREATE POLICY "Products public read" ON public.products
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Products admin all" ON public.products
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- [PRODUCT IMAGES]
CREATE POLICY "Product images public read" ON public.product_images
FOR SELECT TO public
USING (true);

CREATE POLICY "Product images admin all" ON public.product_images
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- [BANNERS]
CREATE POLICY "Banners public read" ON public.banners
FOR SELECT TO public
USING (is_active = true);

CREATE POLICY "Banners admin all" ON public.banners
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- [AFFILIATE CLICKS]
-- Prevent unrestricted insert: Validate brand and product existence
CREATE POLICY "Clicks public insert" ON public.affiliate_clicks
FOR INSERT TO public
WITH CHECK (
    EXISTS (SELECT 1 FROM public.brands WHERE id = brand_id)
    AND (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products WHERE id = product_id))
);

CREATE POLICY "Clicks admin select" ON public.affiliate_clicks
FOR SELECT TO authenticated
USING (public.is_store_admin());

-- [SETTINGS]
-- Public can read UI config, but NOT private PIX/Financial data
CREATE POLICY "Settings public read" ON public.settings
FOR SELECT TO public
USING (
    key NOT IN (
        'pix_key', 'pix_type', 'pix_name', 'pix_city', 'pix_settings',
        'finance_total_balance', 'finance_available_withdraw'
    )
);

CREATE POLICY "Settings admin all" ON public.settings
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- [COMMISSIONS]
CREATE POLICY "Commissions admin all" ON public.commissions
FOR ALL TO authenticated
USING (public.is_store_admin())
WITH CHECK (public.is_store_admin());

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_brand_id ON public.banners(brand_id);
CREATE INDEX IF NOT EXISTS idx_clicks_brand_id ON public.affiliate_clicks(brand_id);
CREATE INDEX IF NOT EXISTS idx_commissions_showcase_id ON public.commissions(showcase_id);

-- 7. INITIAL SEED (Only if empty to avoid duplicates)
-- Note: Admin profile should be created manually or via Auth SignUp to be linked to Auth.uid()
