GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage their own private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Users view their own private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Users insert their own private profile" ON public.profile_private;
DROP POLICY IF EXISTS "Users update their own private profile" ON public.profile_private;

CREATE POLICY "Users view their own private profile"
ON public.profile_private FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert their own private profile"
ON public.profile_private FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update their own private profile"
ON public.profile_private FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Avatars live at post-photos/avatars/<user_id>/<file>
CREATE POLICY "post-photos avatar owner can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "post-photos avatar owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'post-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "post-photos avatar owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-photos'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);