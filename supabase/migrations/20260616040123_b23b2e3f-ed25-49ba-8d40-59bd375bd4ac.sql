
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_given integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_received integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false;

-- Optional collector tracking on posts (who picked it up)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS collected_by uuid,
  ADD COLUMN IF NOT EXISTS collected_at timestamptz;

-- 2. Award +10 on new post
CREATE OR REPLACE FUNCTION public.award_post_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET points = points + 10
    WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_post_points ON public.posts;
CREATE TRIGGER trg_award_post_points
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.award_post_points();

-- 3. Award +20 + bump counters when status flips to 'collected'
CREATE OR REPLACE FUNCTION public.award_collected_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'collected' AND COALESCE(OLD.status, '') <> 'collected' THEN
    UPDATE public.profiles
      SET points = points + 20,
          items_given = items_given + 1
      WHERE id = NEW.user_id;

    IF NEW.collected_by IS NOT NULL THEN
      UPDATE public.profiles
        SET items_received = items_received + 1
        WHERE id = NEW.collected_by;
    END IF;

    IF NEW.collected_at IS NULL THEN
      NEW.collected_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_collected_points ON public.posts;
CREATE TRIGGER trg_award_collected_points
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.award_collected_points();

-- 4. Backfill: 10 pts per post, 20 extra per collected, items_given counter
WITH agg AS (
  SELECT user_id,
         COUNT(*) * 10 + COALESCE(SUM(CASE WHEN status='collected' THEN 20 ELSE 0 END),0) AS pts,
         COALESCE(SUM(CASE WHEN status='collected' THEN 1 ELSE 0 END),0) AS given
  FROM public.posts
  GROUP BY user_id
)
UPDATE public.profiles p
SET points = agg.pts,
    items_given = agg.given
FROM agg
WHERE p.id = agg.user_id;
