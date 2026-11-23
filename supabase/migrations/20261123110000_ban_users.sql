-- ব্যান করা ইউজারদের আলাদা টেবিলে রাখা হচ্ছে (profiles-এ নয়, কারণ সব user নিজের profile edit করতে পারে)
CREATE TABLE public.banned_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  banned_at timestamptz NOT NULL DEFAULT now(),
  banned_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.banned_users TO authenticated;
GRANT ALL ON public.banned_users TO service_role;

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- ইউজার নিজে দেখতে পারবেন তিনি ব্যান কিনা
CREATE POLICY "Users see own ban status"
ON public.banned_users FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- অ্যাডমিন সব ব্যান দেখতে পারবেন
CREATE POLICY "Admins see all bans"
ON public.banned_users FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- শুধু অ্যাডমিন ব্যান করতে পারবেন
CREATE POLICY "Admins insert bans"
ON public.banned_users FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- শুধু অ্যাডমিন আনব্যান করতে পারবেন
CREATE POLICY "Admins delete bans"
ON public.banned_users FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
