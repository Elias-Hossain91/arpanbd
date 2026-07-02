import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Logo, Stitch } from "@/components/arpan/brand";
import { Mail, Lock, User as UserIcon, Phone, ChevronLeft, Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "সাইন ইন · অর্পণ" },
      { name: "description", content: "অর্পণে সাইন ইন বা সাইন আপ করুন — পাসওয়ার্ড, ইমেইল OTP বা মোবাইল OTP দিয়ে।" },
      { property: "og:title", content: "সাইন ইন · অর্পণ" },
      { property: "og:description", content: "অর্পণে যোগ দিন — পছন্দ সংরক্ষণ করুন, নিজের পোস্ট পরিচালনা করুন।" },
      { property: "og:url", content: "https://arpanbd.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://arpanbd.lovable.app/auth" }],
  }),
  component: AuthPage,
});

type Method = "password" | "email-otp" | "phone-otp";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [method, setMethod] = useState<Method>("password");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // shared
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // otp fields
  const [otpTarget, setOtpTarget] = useState(""); // email or phone
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (user && !authLoading) navigate({ to: "/" });
  }, [user, authLoading, navigate]);

  // Reset otp state when switching method
  useEffect(() => {
    setOtpSent(false);
    setOtpCode("");
    setOtpTarget("");
    setError(null);
    setInfo(null);
  }, [method, mode]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
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

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      if (method === "email-otp") {
        if (!otpTarget.includes("@")) throw new Error("সঠিক ইমেইল দিন।");
        const { error } = await supabase.auth.signInWithOtp({
          email: otpTarget,
          options: {
            shouldCreateUser: mode === "signup",
            emailRedirectTo: window.location.origin,
            data: { display_name: name || otpTarget.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo(`${otpTarget} এ ৬-সংখ্যার কোড পাঠানো হয়েছে।`);
        setOtpSent(true);
      } else {
        // phone-otp — expect E.164 (+880…)
        const phone = otpTarget.trim().replace(/\s+/g, "");
        if (!/^\+\d{8,15}$/.test(phone)) throw new Error("দেশের কোডসহ ফোন নম্বর দিন (যেমন +8801XXXXXXXXX)।");
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            shouldCreateUser: mode === "signup",
            data: { display_name: name || phone },
          },
        });
        if (error) throw error;
        setInfo(`${phone} নম্বরে SMS কোড পাঠানো হয়েছে।`);
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err?.message ?? "কোড পাঠানো যায়নি।");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      if (method === "email-otp") {
        const { error } = await supabase.auth.verifyOtp({
          email: otpTarget,
          token: otpCode.trim(),
          type: "email",
        });
        if (error) throw error;
      } else {
        const phone = otpTarget.trim().replace(/\s+/g, "");
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otpCode.trim(),
          type: "sms",
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? "কোড মিলছে না।");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null); setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google সাইন-ইন ব্যর্থ");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper-deep paper-texture flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-paper rounded-3xl shadow-leaf overflow-hidden border border-border">
        <div className="bg-card px-6 pt-6 pb-5">
          <Link to="/" className="flex items-center gap-1 mb-3 text-ink-soft text-sm w-fit">
            <ChevronLeft size={16} /> ফিরে যান
          </Link>
          <div className="flex justify-center">
            <Logo size={36} />
          </div>
          <h1 className="text-center mt-3 font-display text-leaf font-bold text-[20px]">
            {mode === "signin" ? "আবার স্বাগতম" : "অর্পণে যোগ দিন"}
          </h1>
          <div className="text-center text-[13px] text-ink-soft mt-1">
            {mode === "signin" ? "পছন্দ ও নিজের পোস্ট পরিচালনা করতে সাইন ইন" : "একটি অ্যাকাউন্ট খুলুন — মুহূর্তেই দিন বা নিন"}
          </div>
        </div>
        <Stitch />

        {/* Method tabs */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-1 bg-card border border-border rounded-2xl p-1 text-[12px] font-semibold">
            <TabBtn active={method === "password"} onClick={() => setMethod("password")}>পাসওয়ার্ড</TabBtn>
            <TabBtn active={method === "email-otp"} onClick={() => setMethod("email-otp")}>ইমেইল OTP</TabBtn>
            <TabBtn active={method === "phone-otp"} onClick={() => setMethod("phone-otp")}>মোবাইল OTP</TabBtn>
          </div>
        </div>

        <div className="px-5 pt-4 pb-6 flex flex-col gap-3">
          {method === "password" && (
            <form onSubmit={submitPassword} className="flex flex-col gap-3">
              {mode === "signup" && (
                <FieldRow icon={UserIcon}>
                  <input className="bg-transparent outline-none flex-1 text-sm" placeholder="আপনার নাম"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </FieldRow>
              )}
              <FieldRow icon={Mail}>
                <input type="email" required className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FieldRow>
              <FieldRow icon={Lock}>
                <input type="password" required minLength={6} className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="পাসওয়ার্ড (৬+ অক্ষর)" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FieldRow>
              <Alerts error={error} info={info} />
              <PrimaryBtn busy={busy}>{mode === "signin" ? "সাইন ইন" : "অ্যাকাউন্ট খুলুন"}</PrimaryBtn>
            </form>
          )}

          {(method === "email-otp" || method === "phone-otp") && (
            <form onSubmit={otpSent ? verifyOtp : sendOtp} className="flex flex-col gap-3">
              {mode === "signup" && !otpSent && (
                <FieldRow icon={UserIcon}>
                  <input className="bg-transparent outline-none flex-1 text-sm" placeholder="আপনার নাম"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </FieldRow>
              )}
              {!otpSent ? (
                <FieldRow icon={method === "email-otp" ? Mail : Phone}>
                  <input
                    type={method === "email-otp" ? "email" : "tel"}
                    required
                    className="bg-transparent outline-none flex-1 text-sm"
                    placeholder={method === "email-otp" ? "ইমেইল" : "মোবাইল (+8801XXXXXXXXX)"}
                    value={otpTarget}
                    onChange={(e) => setOtpTarget(e.target.value)}
                  />
                </FieldRow>
              ) : (
                <>
                  <div className="text-[12.5px] text-ink-soft text-center">
                    কোড পাঠানো হয়েছে <span className="text-ink font-semibold">{otpTarget}</span> এ
                  </div>
                  <FieldRow icon={KeyRound}>
                    <input
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={6}
                      required
                      className="bg-transparent outline-none flex-1 text-sm tracking-[0.4em] text-center"
                      placeholder="৬-সংখ্যার কোড"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </FieldRow>
                </>
              )}
              <Alerts error={error} info={info} />
              <PrimaryBtn busy={busy}>
                {otpSent ? "কোড যাচাই করে সাইন ইন" : "OTP পাঠান"}
              </PrimaryBtn>
              {otpSent && (
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(""); setInfo(null); setError(null); }}
                  className="text-[12.5px] text-leaf font-semibold text-center"
                >
                  ← ভিন্ন {method === "email-otp" ? "ইমেইল" : "নম্বর"} ব্যবহার করুন
                </button>
              )}
            </form>
          )}

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
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-center text-[13px] text-ink-soft mt-1"
          >
            {mode === "signin" ? (
              <>নতুন এখানে? <span className="text-leaf font-semibold">অ্যাকাউন্ট খুলুন</span></>
            ) : (
              <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span className="text-leaf font-semibold">সাইন ইন</span></>
            )}
          </button>

          <p className="text-center text-[11px] text-ink-soft mt-1 leading-[1.6]">
            চালিয়ে যাওয়া মানে আপনি অর্পণের নীতিমালা মেনে নিচ্ছেন — কোনো অর্থ লেনদেন নয়, শুধুই ভালোবাসা।
          </p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl transition-all ${active ? "bg-leaf text-white shadow-leaf" : "text-ink-soft hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function Alerts({ error, info }: { error: string | null; info: string | null }) {
  return (
    <>
      {error && <div className="text-[12.5px] bg-marigold-soft text-marigold rounded-xl px-3 py-2">{error}</div>}
      {info && <div className="text-[12.5px] bg-leaf-soft text-leaf rounded-xl px-3 py-2">{info}</div>}
    </>
  );
}

function PrimaryBtn({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 flex items-center justify-center gap-2 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform disabled:opacity-60"
      style={{ height: 50 }}
    >
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

function FieldRow({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
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
