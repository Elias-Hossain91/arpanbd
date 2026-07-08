import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Supabase auto-processes the recovery token from URL hash and fires
    // a PASSWORD_RECOVERY / SIGNED_IN event. We just wait for a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null);
    if (password.length < 6) return setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
    if (password !== confirm) return setError("দুটি পাসওয়ার্ড এক নয়।");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setInfo("পাসওয়ার্ড আপডেট হয়েছে। কিছুক্ষণের মধ্যে হোমপেজে যাচ্ছি...");
      setTimeout(() => navigate({ to: "/" }), 1200);
    } catch (err: any) {
      setError(err?.message ?? "পাসওয়ার্ড আপডেট করা যায়নি।");
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
            {ready ? "নতুন পাসওয়ার্ড দিন ও নিশ্চিত করুন।" : "রিসেট লিঙ্ক যাচাই করা হচ্ছে..."}
          </div>
        </div>
        <Stitch />

        <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
          {!ready ? (
            <div className="text-center text-[13px] text-ink-soft py-6">
              যদি এই পেজ ইমেইলের লিঙ্ক থেকে না খুলে থাকেন, তবে সাইন ইন পেজ থেকে "পাসওয়ার্ড ভুলে গেছেন?" ব্যবহার করে নতুন লিঙ্ক নিন।
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
              <button type="submit" disabled={busy}
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
