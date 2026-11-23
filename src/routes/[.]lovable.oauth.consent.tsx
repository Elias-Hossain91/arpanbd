import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/arpan/brand";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  decideOAuthAuthorization,
  loadOAuthAuthorization,
  type AuthorizationDetails,
  type OAuthMethods,
} from "@/lib/oauth-consent";

function oauthMethods(): OAuthMethods {
  return (supabase.auth as unknown as { oauth: OAuthMethods }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string" ? search["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("অনুমোদনের অনুরোধটি পাওয়া যায়নি।");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { next: `${location.pathname}${location.searchStr}` },
      });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.searchStr).get("authorization_id") ?? "";
    const result = await loadOAuthAuthorization(oauthMethods(), authorizationId);
    if (result.redirectTo) throw redirect({ href: result.redirectTo });
    if (!result.details) throw new Error("অনুমোদনের অনুরোধটি মেয়াদোত্তীর্ণ বা অকার্যকর।");
    return result.details;
  },
  head: () => ({
    meta: [
      { title: "অ্যাকাউন্ট সংযোগ · অর্পণ" },
      { name: "description", content: "আপনার অর্পণ অ্যাকাউন্টের সাথে একটি সহকারী সংযুক্ত করুন।" },
      { property: "og:title", content: "অ্যাকাউন্ট সংযোগ · অর্পণ" },
      { property: "og:description", content: "আপনার অর্পণ অ্যাকাউন্টের সাথে একটি সহকারী সংযুক্ত করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-lg border border-border bg-card p-6 text-center shadow-soft">
        <h1 className="font-display text-xl font-bold text-ink">সংযোগ অনুরোধ খোলা যায়নি</h1>
        <p role="alert" className="mt-3 text-sm text-ink-soft">
          {error instanceof Error ? error.message : "অনুমোদনের অনুরোধটি মেয়াদোত্তীর্ণ বা অকার্যকর।"}
        </p>
        <Link to="/" className="mt-5 inline-block text-sm font-semibold text-leaf underline">
          অর্পণে ফিরে যান
        </Link>
      </section>
    </main>
  ),
});

function requestedScopes(details: AuthorizationDetails): string[] {
  if (details.scopes?.length) return details.scopes;
  if (details.requested_scopes?.length) return details.requested_scopes;
  if (Array.isArray(details.scope)) return details.scope;
  if (typeof details.scope === "string" && details.scope.trim()) {
    return details.scope.trim().split(/\s+/);
  }
  return ["openid", "email", "profile"];
}

function scopeLabel(scope: string): string {
  if (scope === "openid") return "আপনার অ্যাকাউন্ট পরিচয়";
  if (scope === "email") return "আপনার ইমেইল ঠিকানা";
  if (scope === "profile") return "আপনার মৌলিক প্রোফাইল";
  return `অতিরিক্ত অনুমতি: ${scope}`;
}

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details.client?.name?.trim() || "একটি সংযুক্ত সহকারী";
  const scopes = requestedScopes(details);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const target = await decideOAuthAuthorization(oauthMethods(), authorization_id, approve);
      window.location.assign(target);
    } catch (decisionError) {
      setBusy(false);
      setError(decisionError instanceof Error ? decisionError.message : "অনুমোদন সম্পন্ন করা যায়নি।");
    }
  }

  async function switchAccount() {
    const next = `${window.location.pathname}${window.location.search}`;
    await signOut();
    window.location.assign(`/auth?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <section className="w-full max-w-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex justify-center"><Logo size={36} /></div>
        <h1 className="mt-5 text-center font-display text-2xl font-bold text-ink">
          {clientName} অর্পণ অ্যাকাউন্টে সংযুক্ত হবে
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-ink-soft">
          এই সহকারী আপনার সাইন-ইন করা অ্যাকাউন্টের অনুমোদিত সরঞ্জাম ব্যবহার করতে পারবে।
        </p>

        <div className="mt-6 border-y border-border py-4">
          <div className="text-xs font-semibold text-ink-soft">সংযুক্ত অ্যাকাউন্ট</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-semibold text-ink">
              {user?.email ?? "সাইন-ইন করা অর্পণ ব্যবহারকারী"}
            </span>
            <Button type="button" variant="link" size="sm" disabled={busy} onClick={switchAccount}>
              অন্য অ্যাকাউন্ট
            </Button>
          </div>
        </div>

        {details.client?.redirect_uri && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-ink-soft">সংযোগের অনুরোধ এসেছে</div>
            <p className="mt-1 break-all text-sm text-ink">{details.client.redirect_uri}</p>
          </div>
        )}

        <div className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">যে তথ্য ভাগ হবে</h2>
          <ul className="mt-2 space-y-2 text-sm text-ink-soft">
            {scopes.map((scope) => <li key={scope}>{scopeLabel(scope)}</li>)}
          </ul>
        </div>

        <p className="mt-5 border-l-2 border-leaf pl-3 text-sm leading-6 text-ink-soft">
          এতে অ্যাপের অনুমতি বা তথ্য-সুরক্ষা নিয়ম এড়ানো যাবে না; আপনার অ্যাকাউন্টের অনুমতি অনুযায়ী তথ্য দেখা যাবে।
        </p>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="outline" disabled={busy} onClick={() => decide(false)} className="flex-1">
            সংযোগ বাতিল
          </Button>
          <Button type="button" disabled={busy} onClick={() => decide(true)} className="flex-1">
            {busy ? "অপেক্ষা করুন…" : "অনুমোদন করুন"}
          </Button>
        </div>
      </section>
    </main>
  );
}