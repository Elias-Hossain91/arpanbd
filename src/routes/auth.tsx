import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Logo, Stitch } from "@/components/arpan/brand";
import { Mail, Lock, User as UserIcon, ChevronLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "সাইন ইন · অর্পণ" },
      { name: "description", content: "অর্পণে যোগ দিন — পছন্দ সংরক্ষণ করুন, নিজের পোস্ট পরিচালনা করুন।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) navigate({ to: "/" });
  }, [user, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("স্বাগতম! আপনি লগ ইন হয়ে গেছেন।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? "কিছু একটা ভুল হয়েছে।");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google সাইন-ইন ব্যর্থ");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-paper-deep paper-texture">
      <div
        className="relative overflow-hidden bg-paper shadow-leaf"
        style={{ width: 390, height: 820, borderRadius: 48, border: "11px solid #1d1c18" }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 bg-[#1d1c18]"
          style={{ top: 10, width: 132, height: 28, borderRadius: 20 }}
        />
        <div className="absolute inset-0 overflow-y-auto hide-scrollbar">
          <div className="bg-card" style={{ padding: "48px 18px 16px" }}>
            <Link
              to="/"
              className="flex items-center gap-1 mb-3 text-ink-soft text-sm w-fit"
            >
              <ChevronLeft size={16} /> ফিরে যান
            </Link>
            <div className="flex justify-center">
              <Logo size={26} />
            </div>
            <div className="text-center mt-3 font-display text-leaf font-bold text-[18px]">
              {mode === "signin" ? "আবার স্বাগতম" : "অর্পণে যোগ দিন"}
            </div>
            <div className="text-center text-[12.5px] text-ink-soft mt-1">
              {mode === "signin"
                ? "পছন্দ ও নিজের পোস্ট পরিচালনা করতে সাইন ইন করুন"
                : "একটি অ্যাকাউন্ট খুলুন — মুহূর্তেই দিন বা নিন"}
            </div>
          </div>
          <Stitch />

          <form onSubmit={submit} className="px-5 pt-5 flex flex-col gap-3">
            {mode === "signup" && (
              <FieldRow icon={UserIcon}>
                <input
                  className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FieldRow>
            )}
            <FieldRow icon={Mail}>
              <input
                type="email"
                required
                className="bg-transparent outline-none flex-1 text-sm"
                placeholder="ইমেইল"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FieldRow>
            <FieldRow icon={Lock}>
              <input
                type="password"
                required
                minLength={6}
                className="bg-transparent outline-none flex-1 text-sm"
                placeholder="পাসওয়ার্ড (৬+ অক্ষর)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FieldRow>

            {error && (
              <div className="text-[12.5px] bg-marigold-soft text-marigold rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            {info && (
              <div className="text-[12.5px] bg-leaf-soft text-leaf rounded-xl px-3 py-2">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ height: 50 }}
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "সাইন ইন" : "অ্যাকাউন্ট খুলুন"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-ink-soft">অথবা</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="flex items-center justify-center gap-2 bg-card border border-border text-ink font-semibold text-[14px] rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ height: 48 }}
            >
              <GoogleIcon /> Google দিয়ে চালিয়ে যান
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="text-center text-[13px] text-ink-soft mt-2"
            >
              {mode === "signin" ? (
                <>নতুন এখানে? <span className="text-leaf font-semibold">অ্যাকাউন্ট খুলুন</span></>
              ) : (
                <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span className="text-leaf font-semibold">সাইন ইন</span></>
              )}
            </button>

            <p className="text-center text-[11px] text-ink-soft mt-2 pb-6 leading-[1.6]">
              চালিয়ে যাওয়া মানে আপনি অর্পণের নীতিমালা মেনে নিচ্ছেন — কোনো অর্থ লেনদেন নয়, শুধুই ভালোবাসা।
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  icon: Icon,
  children,
}: {
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 px-3 bg-card rounded-2xl h-12 border border-border focus-within:border-leaf transition-colors">
      <Icon size={16} className="text-ink-soft" />
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5.2c-2 1.5-4.5 2.3-7.1 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.1 5.2C40.9 36.3 43.5 30.7 43.5 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
