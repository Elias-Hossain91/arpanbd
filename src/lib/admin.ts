import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Whether the given user has the admin role. Users can only read their own role rows. */
export const isAdminQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["admin", "is-admin", userId ?? "none"],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return !!data;
    },
  });
