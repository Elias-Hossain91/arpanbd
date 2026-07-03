import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Logo, Stitch } from "@/components/arpan/brand";
import { Lock, User as UserIcon, Phone, ChevronLeft, Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "সাইন ইন · অর্পণ" },
      { name: "description", content: "অর্পণে মোবাইল নম্বর দিয়ে সাইন ইন — পাসওয়ার্ড বা OTP দিয়ে।" },
      { property: "og:title", content: "সাইন ইন · অর্পণ" },
      { property: "og:description", content: "মোবাইল নম্বরে পাসওয়ার্ড বা OTP দিয়ে অর্পণে যোগ দিন।" },
      { property: "og:url", content: "https://arpanbd.lovable.app/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://arpanbd.lovable.app/auth" }],
  }),
  component: AuthPage,
});

function normalizePhone(raw: string): string {
  const p = raw.trim().replace(/\s+/g, "").replace(/[-()]/g, "");
  if (/^\+\d{8,15}$/.test(p)) return p;
  // Bangladeshi 01XXXXXXXXX -> +8801XXXXXXXXX
  if (/^01\d{9}$/.test(p)) return "+88" + p;
  if (/^8801\d{9}$/.test(p)) return "+" + p;
  return p;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [useOtp, setUseOtp] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (user && !authLoading) navigate({ to: "/" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setOtpSent(false);
    setOtpCode("");
    setResendIn(0);
    setError(null);
    setInfo(null);
  }, [useOtp, mode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      const p = normalizePhone(phone);
      if (!/^\+\d{8,15}$/.test(p)) throw new Error("সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)।");
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          phone: p, password,
          options: { data: { display_name: name || p } },
        });
        if (error) throw error;
        setInfo("অ্যাকাউন্ট তৈরি হয়েছে। মোবাইল নম্বর যাচাই করতে OTP পাঠানো হয়েছে।");
        setUseOtp(true);
        setOtpSent(true);
        setResendIn(45);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ phone: p, password });
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
      const p = normalizePhone(phone);
      if (!/^\+\d{8,15}$/.test(p)) throw new Error("সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)।");
      const { error } = await supabase.auth.signInWithOtp({
        phone: p,
        options: {
          shouldCreateUser: mode === "signup",
          data: { display_name: name || p },
        },
      });
      if (error) throw error;
      setInfo(`${p} নম্বরে SMS কোড পাঠানো হয়েছে।`);
      setOtpSent(true);
      setResendIn(45);
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
      const p = normalizePhone(phone);
      const { error } = await supabase.auth.verifyOtp({
        phone: p, token: otpCode.trim(), type: "sms",
      });
      if (error) throw error;
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
            মোবাইল নম্বর দিয়ে {useOtp ? "OTP" : "পাসওয়ার্ড"} দিয়ে {mode === "signin" ? "সাইন ইন" : "সাইন আপ"}
          </div>
        </div>
        <Stitch />

        <div className="px-5 pt-5 pb-6 flex flex-col gap-3">
          {!useOtp ? (
            <form onSubmit={submitPassword} className="flex flex-col gap-3">
              {mode === "signup" && (
                <FieldRow icon={UserIcon}>
                  <input className="bg-transparent outline-none flex-1 text-sm" placeholder="আপনার নাম"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </FieldRow>
              )}
              <FieldRow icon={Phone}>
                <input type="tel" required className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="মোবাইল নম্বর (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FieldRow>
              <FieldRow icon={Lock}>
                <input type="password" required minLength={6} className="bg-transparent outline-none flex-1 text-sm"
                  placeholder="পাসওয়ার্ড (৬+ অক্ষর)" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FieldRow>
              <Alerts error={error} info={info} />
              <PrimaryBtn busy={busy}>{mode === "signin" ? "সাইন ইন" : "অ্যাকাউন্ট খুলুন"}</PrimaryBtn>
              <button type="button" onClick={() => setUseOtp(true)} className="text-[12.5px] text-leaf font-semibold text-center">
                পাসওয়ার্ড ছাড়া OTP দিয়ে সাইন ইন করুন →
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? verifyOtp : sendOtp} className="flex flex-col gap-3">
              {mode === "signup" && !otpSent && (
                <FieldRow icon={UserIcon}>
                  <input className="bg-transparent outline-none flex-1 text-sm" placeholder="আপনার নাম"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </FieldRow>
              )}
              {!otpSent ? (
                <FieldRow icon={Phone}>
                  <input type="tel" required className="bg-transparent outline-none flex-1 text-sm"
                    placeholder="মোবাইল নম্বর (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </FieldRow>
              ) : (
                <>
                  <div className="text-[12.5px] text-ink-soft text-center">
                    কোড পাঠানো হয়েছে <span className="text-ink font-semibold">{normalizePhone(phone)}</span> এ
                  </div>
                  <FieldRow icon={KeyRound}>
                    <input inputMode="numeric" pattern="\d*" maxLength={6} required
                      className="bg-transparent outline-none flex-1 text-sm tracking-[0.4em] text-center"
                      placeholder="৬-সংখ্যার কোড" value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} />
                  </FieldRow>
                  <button
                    type="button"
                    disabled={resendIn > 0 || busy}
                    onClick={() => sendOtp({ preventDefault: () => {} } as React.FormEvent)}
                    className="text-[12.5px] text-center text-leaf font-semibold disabled:text-ink-soft disabled:cursor-not-allowed"
                  >
                    {resendIn > 0
                      ? `আবার কোড পাঠান (${resendIn}s)`
                      : "আবার কোড পাঠান"}
                  </button>
                </>
              )}
              <Alerts error={error} info={info} />
              <PrimaryBtn busy={busy}>{otpSent ? "কোড যাচাই করুন" : "OTP পাঠান"}</PrimaryBtn>
              <button type="button" onClick={() => { setUseOtp(false); setOtpSent(false); }} className="text-[12.5px] text-leaf font-semibold text-center">
                ← পাসওয়ার্ড দিয়ে সাইন ইন করুন
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-ink-soft">অথবা</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button type="button" onClick={google} disabled={busy}
            className="flex items-center justify-center gap-2 bg-card border border-border text-ink font-semibold text-[14px] rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ height: 48 }}>
            <GoogleIcon /> Google দিয়ে চালিয়ে যান
          </button>

          <button type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-center text-[13px] text-ink-soft mt-1">
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
    <button type="submit" disabled={busy}
      className="mt-1 flex items-center justify-center gap-2 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform disabled:opacity-60"
      style={{ height: 50 }}>
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
