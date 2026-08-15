-- ═══════════════════════════════════════════════════════════════════════
-- Fix chat_threads to allow any two users to chat (not just customer→seller)
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- Drop old restrictive policies
DROP POLICY IF EXISTS "threads_read_participant" ON public.chat_threads;
DROP POLICY IF EXISTS "threads_insert" ON public.chat_threads;

-- New policies: any authenticated user can read/create threads they're part of
CREATE POLICY "threads_read_participant" ON public.chat_threads
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = seller_id
  );

CREATE POLICY "threads_insert" ON public.chat_threads
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = seller_id
  );

-- Also allow admins to read all threads (for support purposes)
DROP POLICY IF EXISTS "threads_admin_read" ON public.chat_threads;
CREATE POLICY "threads_admin_read" ON public.chat_threads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
