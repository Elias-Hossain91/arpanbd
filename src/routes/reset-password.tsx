import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { completePasswordReset } from "@/lib/auth/reset-password.functions";
import { Logo, Stitch } from "@/components/arpan/brand";
import { Lock, ChevronLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট · অর্পণ" },
      { name: "description", content: "অর্পণে আপনার নতুন পাসওয়ার্ড সেট করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

/**
 * Extract the recovery token_hash from the URL, no matter which delivery
 * format Supabase uses:
 *   - ?token_hash=...&type=recovery  (OTP link)
 *   - #token_hash=...&type=recovery  (implicit hash)
 *   - ?token=...&type=recovery       (legacy)
 * `?code=...` (PKCE) is handled separately via exchangeCodeForSession.
 */
function readTokenFromUrl(): { tokenHash: string | null; code: string | null; type: string | null } {
  if (typeof window === "undefined") return { tokenHash: null, code: null, type: null };
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const tokenHash =
    url.searchParams.get("token_hash") ??
    hash.get("token_hash") ??
    url.searchParams.get("token") ??
    hash.get("token");
  const type = url.searchParams.get("type") ?? hash.get("type");
  const code = url.searchParams.get("code");
  return { tokenHash, code, type };
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const completeReset = useServerFn(completePasswordReset);

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [ready, setReady] = useState(false);

  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { tokenHash: t, code, type } = readTokenFromUrl();

      // Case A: server-verifiable token_hash present → skip client verification,
      // let the server verify + update in one atomic call.
      if (t && (!type || type === "recovery")) {
        if (cancelled) return;
        setTokenHash(t);
        setReady(true);
        setVerifying(false);
        return;
      }

      // Case B: PKCE `?code=...` — exchange for session (client-side flow),
      // then let the user update the password using that live session.
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        // clean the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname + url.search);
        if (cancelled) return;
        if (exErr) {
          setError("রিসেট লিঙ্কটি অকার্যকর বা মেয়াদোত্তীর্ণ। নতুন লিঙ্ক নিন।");
          setVerifying(false);
          return;
        }
        setReady(true);
        setVerifying(false);
        return;
      }

      // Case C: Nothing usable in the URL — maybe a session already exists
      // (rare — e.g. link opened in the same browser as sign-in).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
      } else {
        setError("রিসেট লিঙ্ক পাওয়া যায়নি। সাইন ইন পেজ থেকে নতুন করে চেষ্টা করুন।");
      }
      setVerifying(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const canSubmit = useMemo(
    () => ready && !busy && password.length >= 6 && password === confirm,
    [ready, busy, password, confirm],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null);
    if (password.length < 6) return setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
    if (password !== confirm) return setError("দুটি পাসওয়ার্ড এক নয়।");
    setBusy(true);
    try {
      if (tokenHash) {
        // Server-side path — verifies token + updates password atomically.
        await completeReset({ data: { token_hash: tokenHash, new_password: password } });
        // Ensure the browser is signed out; user must sign in with the new password.
        await supabase.auth.signOut();
      } else {
        // Client-session path (PKCE exchange or existing session).
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
      }
      setInfo("পাসওয়ার্ড আপডেট হয়েছে। এবার নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।");
      setTimeout(() => navigate({ to: "/auth" }), 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "পাসওয়ার্ড আপডেট করা যায়নি।";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper-deep paper-texture flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-paper rounded-3xl shadow-leaf overflow-hidden border border-border">
        <div className="bg-card px-6 pt-6 pb-5">
          <Link to="/auth" className="flex items-center gap-1 mb-3 text-ink-soft text-sm w-fit">
            <ChevronLeft size={16} /> সাইন ইন পেজে
          </Link>
          <div className="flex justify-center"><Logo size={36} /></div>
          <h1 className="text-center mt-3 font-display text-leaf font-bold text-[20px]">
            নতুন পাসওয়ার্ড সেট করুন
          </h1>
          <div className="text-center text-[13px] text-ink-soft mt-1">
            {verifying ? "রিসেট লিঙ্ক যাচাই করা হচ্ছে..." : ready ? "নতুন পাসওয়ার্ড দিন ও নিশ্চিত করুন।" : "লিঙ্ক অকার্যকর।"}
          </div>
        </div>
        <Stitch />

        <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
          {verifying ? (
            <div className="flex items-center justify-center gap-2 py-8 text-ink-soft text-sm">
              <Loader2 size={16} className="animate-spin" /> যাচাই করা হচ্ছে...
            </div>
          ) : !ready ? (
            <div className="flex flex-col gap-3 py-2">
              {error && <div className="text-[12.5px] bg-marigold-soft text-marigold rounded-xl px-3 py-2">{error}</div>}
              <div className="text-center text-[13px] text-ink-soft">
                সাইন ইন পেজ থেকে "পাসওয়ার্ড ভুলে গেছেন?" ব্যবহার করে নতুন লিঙ্ক নিন।
              </div>
              <Link to="/auth"
                className="mt-1 flex items-center justify-center bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform"
                style={{ height: 48 }}>
                সাইন ইন পেজে যান
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <label className="flex items-center gap-2 px-3 bg-card rounded-2xl h-12 border border-border focus-within:border-leaf transition-colors">
                <Lock size={16} className="text-ink-soft" />
                <input type="password" required minLength={6}
                  className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="নতুন পাসওয়ার্ড (৬+ অক্ষর)"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="flex items-center gap-2 px-3 bg-card rounded-2xl h-12 border border-border focus-within:border-leaf transition-colors">
                <Lock size={16} className="text-ink-soft" />
                <input type="password" required minLength={6}
                  className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </label>
              {error && <div className="text-[12.5px] bg-marigold-soft text-marigold rounded-xl px-3 py-2">{error}</div>}
              {info && <div className="text-[12.5px] bg-leaf-soft text-leaf rounded-xl px-3 py-2">{info}</div>}
              <button type="submit" disabled={!canSubmit}
                className="mt-1 flex items-center justify-center gap-2 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{ height: 50 }}>
                {busy && <Loader2 size={16} className="animate-spin" />}
                পাসওয়ার্ড আপডেট করুন
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
