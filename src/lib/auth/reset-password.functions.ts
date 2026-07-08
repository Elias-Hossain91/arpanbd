import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Input = { token_hash: string; new_password: string };

function assertInput(input: unknown): Input {
  const v = input as Partial<Input>;
  if (!v || typeof v.token_hash !== "string" || v.token_hash.length < 8) {
    throw new Error("রিসেট টোকেন পাওয়া যায়নি।");
  }
  if (typeof v.new_password !== "string" || v.new_password.length < 6) {
    throw new Error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
  }
  if (v.new_password.length > 200) {
    throw new Error("পাসওয়ার্ড অনেক লম্বা।");
  }
  return { token_hash: v.token_hash, new_password: v.new_password };
}

/**
 * Verify a Supabase password-recovery token (token_hash from the reset email)
 * and update the user's password in a single server-side transaction.
 */
export const completePasswordReset = createServerFn({ method: "POST" })
  .inputValidator(assertInput)
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("সার্ভার কনফিগারেশন সমস্যা।");
    }

    // Fresh, stateless client — no cookies, no shared session with other requests.
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 1) Verify the recovery token — this returns a short-lived session
    //    for the user who requested the reset.
    const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: data.token_hash,
    });
    if (verifyError || !verified.session || !verified.user) {
      throw new Error("রিসেট লিঙ্কটি অকার্যকর বা মেয়াদোত্তীর্ণ। নতুন লিঙ্ক নিন।");
    }

    // 2) Update the password using that session (RLS-safe, no admin key needed).
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.new_password,
    });
    if (updateError) {
      throw new Error(updateError.message || "পাসওয়ার্ড আপডেট করা যায়নি।");
    }

    // 3) Sign out the server-side session so the recovery token cannot be reused.
    await supabase.auth.signOut();

    return { ok: true as const, email: verified.user.email ?? null };
  });
