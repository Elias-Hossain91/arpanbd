CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id = auth.uid(), false)
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = _role
    )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.award_collected_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'collected' AND COALESCE(OLD.status, '') <> 'collected' THEN
    IF auth.uid() IS NULL
      OR NEW.collected_by IS NULL
      OR NEW.collected_by = NEW.user_id
      OR NEW.collected_by <> auth.uid() THEN
      RAISE EXCEPTION 'Only another signed-in member can confirm collection';
    END IF;

    UPDATE public.profiles
      SET points = points + 20,
          items_given = items_given + 1
      WHERE id = NEW.user_id;

    UPDATE public.profiles
      SET items_received = items_received + 1
      WHERE id = auth.uid();

    IF NEW.collected_at IS NULL THEN
      NEW.collected_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_post_collected(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to confirm collection';
  END IF;

  SELECT user_id, status
    INTO v_owner_id, v_status
    FROM public.posts
    WHERE id = _post_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_owner_id = auth.uid() THEN
    RAISE EXCEPTION 'The giver cannot confirm their own collection';
  END IF;
  IF v_status <> 'available' THEN
    RAISE EXCEPTION 'This listing is no longer available';
  END IF;

  UPDATE public.posts
    SET status = 'collected',
        collected_by = auth.uid(),
        collected_at = now()
    WHERE id = _post_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_post_collected(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_post_collected(uuid) TO authenticated;

REVOKE UPDATE ON TABLE public.posts FROM anon, authenticated;

DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;
CREATE POLICY "Members view available or owned posts"
ON public.posts FOR SELECT TO authenticated
USING (
  status = 'available'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT (id, display_name, area, avatar_url, district, show_phone, updated_at)
  ON TABLE public.profiles TO authenticated;
GRANT UPDATE (id, display_name, area, avatar_url, district, show_phone, updated_at)
  ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.visible_giver_names(_user_ids uuid[])
RETURNS TABLE(profile_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.profiles AS p
  WHERE auth.uid() IS NOT NULL
    AND p.id = ANY(COALESCE(_user_ids, ARRAY[]::uuid[]))
    AND (
      p.id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.posts AS post
        WHERE post.user_id = p.id
          AND post.status = 'available'
      )
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
$$;

REVOKE EXECUTE ON FUNCTION public.visible_giver_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_giver_names(uuid[]) TO authenticated;

DROP POLICY IF EXISTS "post-photos viewable by authenticated" ON storage.objects;
CREATE POLICY "post-photos visible only with an authorized listing"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'post-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'avatars'
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1
      FROM public.posts AS post
      WHERE post.photos @> ARRAY[storage.objects.name]::text[]
        AND (
          post.status = 'available'
          OR post.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
        )
    )
  )
);

CREATE POLICY "post-photos admins can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);