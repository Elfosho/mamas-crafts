-- Fix infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- Drop old broken policies
DROP POLICY IF EXISTS "orders_read" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "order_items_read" ON public.order_items;

-- Recreate fixed policies (no cross-table recursion)
CREATE POLICY "orders_read" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'seller'))
  );

CREATE POLICY "order_items_read" ON public.order_items
  FOR SELECT USING (
    auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'seller')) OR
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );
