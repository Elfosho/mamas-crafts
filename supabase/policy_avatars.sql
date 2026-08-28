-- policy_avatars.sql
-- Policies for bucket `avatars`
DROP POLICY IF EXISTS avatars_insert_own   ON storage.objects;
DROP POLICY IF EXISTS avatars_update_own  ON storage.objects;

CREATE POLICY "avatars_insert_own"
  ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid() = split_part(name, '/', 1)::uuid
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects
  FOR UPDATE USING (
    auth.uid() = split_part(name, '/', 1)::uuid
  );

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
