
DROP FUNCTION IF EXISTS public.get_my_profile();

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

CREATE TABLE public.profile_private (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own private profile"
  ON public.profile_private FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

INSERT INTO public.profile_private (id, phone)
SELECT id, phone FROM public.profiles
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN phone;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'অর্পণ ব্যবহারকারী'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_private (id, phone)
  VALUES (NEW.id, NEW.phone)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END; $$;
