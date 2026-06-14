
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'অর্পণ ব্যবহারকারী',
  area TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Posts (items given away)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_bn TEXT NOT NULL,
  title_en TEXT,
  category TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  tile TEXT NOT NULL DEFAULT 'leaf',
  area TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'ভালো',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert their own posts"
  ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own posts"
  ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own posts"
  ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own favorites"
  ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add their own favorites"
  ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove their own favorites"
  ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'অর্পণ ব্যবহারকারী'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
