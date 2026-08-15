-- Fix 1: Allow admin to update any user's profile/role
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix 2: Add email column to profiles (so admin can see who is who)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
