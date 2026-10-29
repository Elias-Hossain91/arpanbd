# Project rules

- Admin access is stored in `public.user_roles` and checked with `public.has_role()` in RLS policies; never put role flags on `profiles`, because every signed-in user can read all profiles and edit their own.
- Signed-in-only pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/auth`), because the session lives in browser storage the server can't read.
