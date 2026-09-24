CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff'));
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_staff() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_protect_role BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff());

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.frame_shapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE public.colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hex_code TEXT
);
CREATE TABLE public.sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_mm INTEGER NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  description TEXT,
  shape_id UUID REFERENCES public.frame_shapes(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  gender TEXT NOT NULL DEFAULT 'unisex',
  lens_type TEXT NOT NULL DEFAULT 'single-vision',
  price_cents INTEGER NOT NULL DEFAULT 0,
  compare_at_price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  rating NUMERIC(3,2),
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
  size_id UUID REFERENCES public.sizes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  lens_tint TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX products_status_idx ON public.products (status, created_at DESC);
CREATE INDEX product_images_product_idx ON public.product_images (product_id, position);
CREATE INDEX product_variants_product_idx ON public.product_variants (product_id);
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.brands, public.categories, public.frame_shapes, public.materials, public.colors, public.sizes, public.products, public.product_images, public.product_variants, public.product_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands, public.categories, public.frame_shapes, public.materials, public.colors, public.sizes, public.products, public.product_images, public.product_variants, public.product_categories TO authenticated;
GRANT ALL ON public.brands, public.categories, public.frame_shapes, public.materials, public.colors, public.sizes, public.products, public.product_images, public.product_variants, public.product_categories TO service_role;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $do$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','categories','frame_shapes','materials','colors','sizes','products','product_images','product_variants','product_categories']
  LOOP
    EXECUTE format('CREATE POLICY "Catalog is publicly readable" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Staff manage catalog" ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t);
  END LOOP;
END;
$do$;

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, variant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their cart" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cart_items_set_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their wishlist" ON public.wishlist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT ALL ON public.user_addresses TO service_role;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their addresses" ON public.user_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_addresses_set_updated_at BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  customer_email TEXT,
  shipping_address JSONB,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL DEFAULT '',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.orders, public.order_items TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff());
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "Users view their order items" ON public.order_items FOR SELECT TO authenticated
  USING (public.is_staff() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_order_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','paid','fulfilled','shipped','delivered','cancelled','refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_validate_status BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_status();

CREATE OR REPLACE FUNCTION public.create_order(
  p_items JSONB,
  p_shipping_address JSONB,
  p_customer_email TEXT,
  p_shipping_cents INTEGER,
  p_tax_cents INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_order_id UUID;
  v_subtotal INTEGER := 0;
  v_item JSONB;
  v_variant public.product_variants;
  v_qty INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place an order';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  INSERT INTO public.orders (user_id, status, shipping_cents, tax_cents, customer_email, shipping_address)
  VALUES (v_user, 'paid', GREATEST(COALESCE(p_shipping_cents, 0), 0), GREATEST(COALESCE(p_tax_cents, 0), 0), p_customer_email, p_shipping_address)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(COALESCE((v_item ->> 'quantity')::INTEGER, 1), 1);
    SELECT * INTO v_variant FROM public.product_variants WHERE id = (v_item ->> 'variant_id')::UUID FOR UPDATE;
    IF v_variant.id IS NULL THEN
      RAISE EXCEPTION 'A frame in your cart is no longer available';
    END IF;
    IF v_variant.stock < v_qty THEN
      RAISE EXCEPTION 'Only % left of %', v_variant.stock, v_variant.name;
    END IF;
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, variant_name, unit_price_cents, quantity)
    VALUES (v_order_id, v_variant.product_id, v_variant.id,
      COALESCE(NULLIF(v_item ->> 'product_name', ''), 'Frame'),
      COALESCE(v_item ->> 'variant_name', ''), v_variant.price_cents, v_qty);
    UPDATE public.product_variants SET stock = stock - v_qty WHERE id = v_variant.id;
    v_subtotal := v_subtotal + (v_variant.price_cents * v_qty);
  END LOOP;

  UPDATE public.orders
  SET subtotal_cents = v_subtotal, total_cents = v_subtotal + shipping_cents + tax_cents
  WHERE id = v_order_id;

  DELETE FROM public.cart_items WHERE user_id = v_user;
  RETURN jsonb_build_object('id', v_order_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_order(JSONB, JSONB, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(JSONB, JSONB, TEXT, INTEGER, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_dashboard_summary()
RETURNS TABLE (total_sales_cents BIGINT, total_orders BIGINT, total_customers BIGINT, total_products BIGINT, low_stock_variants BIGINT, pending_orders BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT
    COALESCE((SELECT SUM(total_cents) FROM public.orders WHERE status <> 'cancelled'), 0)::BIGINT,
    (SELECT COUNT(*) FROM public.orders)::BIGINT,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT,
    (SELECT COUNT(*) FROM public.products)::BIGINT,
    (SELECT COUNT(*) FROM public.product_variants WHERE stock < 10)::BIGINT,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')::BIGINT;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_best_sellers(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (product_id UUID, product_name TEXT, units_sold BIGINT, revenue_cents BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT oi.product_id, MAX(oi.product_name), SUM(oi.quantity)::BIGINT, SUM(oi.quantity * oi.unit_price_cents)::BIGINT
  FROM public.order_items oi WHERE oi.product_id IS NOT NULL
  GROUP BY oi.product_id ORDER BY SUM(oi.quantity) DESC LIMIT GREATEST(COALESCE(p_limit, 5), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_low_stock(p_threshold INTEGER DEFAULT 10)
RETURNS TABLE (variant_id UUID, product_id UUID, product_name TEXT, variant_name TEXT, sku TEXT, stock INTEGER, price_cents INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT v.id, p.id, p.name, v.name, v.sku, v.stock, v.price_cents
  FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
  WHERE v.stock <= COALESCE(p_threshold, 10) ORDER BY v.stock ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revenue_by_day(p_days INTEGER DEFAULT 30)
RETURNS TABLE (day DATE, revenue_cents BIGINT, order_count BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT (o.created_at AT TIME ZONE 'UTC')::DATE, SUM(o.total_cents)::BIGINT, COUNT(*)::BIGINT
  FROM public.orders o
  WHERE o.created_at >= now() - (COALESCE(p_days, 30) || ' days')::INTERVAL AND o.status <> 'cancelled'
  GROUP BY 1 ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_recent_orders(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (order_id UUID, customer_email TEXT, status TEXT, total_cents INTEGER, item_count BIGINT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT o.id, COALESCE(o.customer_email, pr.email, ''), o.status, o.total_cents,
    (SELECT COUNT(*) FROM public.order_items oi WHERE oi.order_id = o.id)::BIGINT, o.created_at
  FROM public.orders o LEFT JOIN public.profiles pr ON pr.id = o.user_id
  ORDER BY o.created_at DESC LIMIT GREATEST(COALESCE(p_limit, 10), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_customer_activity(p_user_id UUID)
RETURNS TABLE (order_count BIGINT, total_spent_cents BIGINT, review_count BIGINT, wishlist_count BIGINT, has_preferences BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.orders WHERE user_id = p_user_id)::BIGINT,
    COALESCE((SELECT SUM(total_cents) FROM public.orders WHERE user_id = p_user_id AND status <> 'cancelled'), 0)::BIGINT,
    0::BIGINT,
    (SELECT COUNT(*) FROM public.wishlist_items WHERE user_id = p_user_id)::BIGINT,
    EXISTS (SELECT 1 FROM public.tryon_generations WHERE user_id = p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_role NOT IN ('customer','staff','admin') THEN RAISE EXCEPTION 'Invalid role: %', p_role; END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

DO $do$
DECLARE fn TEXT;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.admin_dashboard_summary()',
    'public.admin_best_sellers(integer)',
    'public.admin_low_stock(integer)',
    'public.admin_revenue_by_day(integer)',
    'public.admin_recent_orders(integer)',
    'public.admin_customer_activity(uuid)',
    'public.admin_update_profile_role(uuid, text)'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END;
$do$;