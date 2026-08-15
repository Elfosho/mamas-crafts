-- ═══════════════════════════════════════════════════════════════════════════════
-- Mama's Crafts — Supabase Database Schema
-- Run this SQL in the Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
-- Extends Supabase's built-in auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  role                  text NOT NULL DEFAULT 'customer'
                          CHECK (role IN ('customer', 'seller', 'admin')),
  bio                   text,
  tags                  text,
  profile_image_url     text DEFAULT '/assets/default_avatar.jpg',
  request_seller_status boolean NOT NULL DEFAULT false,
  stripe_account_id     text,       -- Filled when seller connects Stripe
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile when a new user signs up (via trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, request_seller_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Mama'),
    'customer',
    COALESCE((new.raw_user_meta_data->>'request_seller_status')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. PRODUCTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  price       numeric(10, 2) NOT NULL CHECK (price >= 0),
  category    text,
  image_url   text DEFAULT '/assets/placeholder_product.jpg',
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. ORDERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                   text NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount             numeric(10, 2) NOT NULL,
  shipping_address         text,
  phone                    text,
  stripe_payment_intent_id text,   -- Filled after Stripe payment
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. ORDER ITEMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id         uuid REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  quantity           integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_purchase  numeric(10, 2) NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. CHAT THREADS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, seller_id)
);

-- ─── 6. MESSAGES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Realtime on messages (needed for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages    ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES policies ───────────────────────────────────────────────────────
-- Anyone can read public profiles (needed for shop & Meet the Mamas page)
CREATE POLICY "profiles_read_public" ON public.profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ─── PRODUCTS policies ───────────────────────────────────────────────────────
-- Anyone can see approved products
CREATE POLICY "products_read_approved" ON public.products
  FOR SELECT USING (status = 'approved' OR auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sellers can insert their own products
CREATE POLICY "products_insert_seller" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own products; admins can update any
CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── ORDERS policies ─────────────────────────────────────────────────────────
-- Customers see own orders; sellers see orders with their items; admins see all
CREATE POLICY "orders_read" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = id AND oi.seller_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can place orders
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Sellers/admins can update order status
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      WHERE oi.order_id = id AND oi.seller_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── ORDER ITEMS policies ────────────────────────────────────────────────────
CREATE POLICY "order_items_read" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid()) OR
    auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );

-- ─── CHAT THREADS policies ───────────────────────────────────────────────────
CREATE POLICY "threads_read_participant" ON public.chat_threads
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = seller_id);

CREATE POLICY "threads_insert" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR auth.uid() = seller_id);

-- ─── MESSAGES policies ───────────────────────────────────────────────────────
CREATE POLICY "messages_read_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_threads ct
      WHERE ct.id = thread_id
        AND (ct.customer_id = auth.uid() OR ct.seller_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_threads ct
      WHERE ct.id = thread_id
        AND (ct.customer_id = auth.uid() OR ct.seller_id = auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — Initial sellers & products
-- (Run only once after schema creation)
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Sellers must be created via Supabase Auth first (Dashboard → Authentication → Users)
-- Then update their profile rows:
--
-- UPDATE profiles SET role = 'seller', name = 'Luna Mama',
--   bio = 'Lover of stars, moons...', tags = 'Astrology, Moon Magic, Intuition',
--   profile_image_url = '/assets/luna_mama.jpg'
-- WHERE id = '<luna_auth_user_id>';
