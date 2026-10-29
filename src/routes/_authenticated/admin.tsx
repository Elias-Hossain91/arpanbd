import { Suspense, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, MapPin, Search, ShieldAlert, Sprout, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/arpan-logo-transparent.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { isAdminQuery } from "@/lib/admin";
import { formatBnDate, timeAgoBn, toBnDigits } from "@/lib/bn";
import { CATS } from "@/data/arpan";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tab = "overview" | "users" | "posts";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "সারসংক্ষেপ" },
  { id: "users", label: "ব্যবহারকারী" },
  { id: "posts", label: "পোস্টসমূহ" },
];

/* ---------------- Queries ---------------- */

async function countOf(
  build: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
) {
  const { count, error } = await build();
  if (error) throw new Error(error.message);
  return count ?? 0;
}

const statsQuery = queryOptions({
  queryKey: ["admin", "stats"],
  queryFn: async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [users, usersToday, posts, active, collected, favorites, recent] = await Promise.all([
      countOf(() => supabase.from("profiles").select("id", { count: "exact", head: true })),
      countOf(() =>
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString()),
      ),
      countOf(() => supabase.from("posts").select("id", { count: "exact", head: true })),
      countOf(() =>
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "available"),
      ),
      countOf(() =>
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "collected"),
      ),
      countOf(() => supabase.from("favorites").select("post_id", { count: "exact", head: true })),
      supabase
        .from("posts")
        .select("id, title_bn, area, emoji, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (error) throw new Error(error.message);
          return data ?? [];
        }),
    ]);
    return { users, usersToday, posts, active, collected, favorites, recent };
  },
});

const usersQuery = queryOptions({
  queryKey: ["admin", "users"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, district, points, items_given, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

const postsQuery = queryOptions({
  queryKey: ["admin", "posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title_bn, emoji, category, area, status, user_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const posts = data ?? [];
    const ids = Array.from(new Set(posts.map((p) => p.user_id)));
    const names = new Map<string, string>();
    if (ids.length) {
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      if (pErr) throw new Error(pErr.message);
      for (const p of profs ?? []) names.set(p.id, p.display_name);
    }
    return posts.map((p) => ({ ...p, giver: names.get(p.user_id) ?? "অজানা" }));
  },
});

/* ---------------- Route ---------------- */

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    tab: TABS.some((t) => t.id === search.tab) ? (search.tab as Tab) : undefined,
  }),
  loader: async ({ context }) => {
    const isAdmin = await context.queryClient.ensureQueryData(isAdminQuery(context.userId));
    if (isAdmin) await context.queryClient.ensureQueryData(statsQuery);
    return { isAdmin };
  },
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল · অর্পণ" },
      { name: "description", content: "অর্পণ অ্যাপের ব্যবহারকারী ও পোস্ট পরিচালনার জন্য অ্যাডমিন প্যানেল।" },
      { property: "og:title", content: "অ্যাডমিন প্যানেল · অর্পণ" },
      { property: "og:description", content: "অর্পণ অ্যাপের ব্যবহারকারী ও পোস্ট পরিচালনার জন্য অ্যাডমিন প্যানেল।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
  errorComponent: AdminError,
  notFoundComponent: () => <div className="p-6 text-ink">পাওয়া যায়নি।</div>,
});

function AdminError({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div role="alert" className="bg-card border border-border rounded-2xl p-6 max-w-sm text-center">
        <p className="font-display font-bold text-ink">কিছু একটা ভুল হয়েছে</p>
        <p className="text-ink-soft text-sm mt-1">{error.message}</p>
        <button
          onClick={() => router.invalidate()}
          className="mt-4 bg-leaf text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    </div>
  );
}

function AdminPage() {
  const { userId } = Route.useRouteContext();
  const { data: isAdmin } = useSuspenseQuery(isAdminQuery(userId));
  if (!isAdmin) return <AccessDenied />;
  return <Dashboard />;
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-soft">
        <ShieldAlert className="mx-auto text-marigold" size={40} />
        <h1 className="font-display font-bold text-ink text-2xl mt-3">অ্যাক্সেস নেই</h1>
        <p className="text-ink-soft text-sm mt-1">এই পাতাটি শুধু অ্যাডমিনদের জন্য।</p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-1 bg-leaf text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold"
        >
          <ChevronLeft size={16} /> ফিরে যান
        </Link>
      </div>
    </div>
  );
}

function Dashboard() {
  const tab: Tab = Route.useSearch().tab ?? "overview";
  const navigate = Route.useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Toaster />
      <header className="bg-leaf">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-4 flex items-center gap-3">
          <Link
            to="/"
            aria-label="ফিরে যান"
            className="flex items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground shrink-0"
            style={{ width: 36, height: 36 }}
          >
            <ChevronLeft size={18} />
          </Link>
          <img src={logoAsset.url} alt="অর্পণ লোগো" className="h-11 w-auto shrink-0" draggable={false} />
          <div className="min-w-0">
            <div className="font-display font-bold text-primary-foreground text-lg leading-tight">অর্পণ</div>
            <h1 className="text-primary-foreground/85 text-sm font-semibold">অ্যাডমিন প্যানেল</h1>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto px-2 flex" role="tablist">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => navigate({ search: { tab: t.id } })}
                className={`flex-1 py-3 text-sm font-semibold border-b-[3px] transition-colors ${
                  active
                    ? "border-marigold text-primary-foreground"
                    : "border-transparent text-primary-foreground/65"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 pb-16">
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-ink-soft">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "posts" && <PostsTab />}
        </Suspense>
      </main>
    </div>
  );
}

/* ---------------- Tabs ---------------- */

function OverviewTab() {
  const { data } = useSuspenseQuery(statsQuery);
  const cards = [
    { n: data.users, label: "মোট ব্যবহারকারী" },
    { n: data.usersToday, label: "নতুন ব্যবহারকারী আজ" },
    { n: data.posts, label: "মোট পোস্ট" },
    { n: data.active, label: "সক্রিয় পোস্ট" },
    { n: data.collected, label: "সংগৃহীত পোস্ট" },
    { n: data.favorites, label: "মোট পছন্দ" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
            <div className="inline-flex bg-leaf-soft text-leaf font-display font-bold text-2xl rounded-xl px-3 py-1">
              {toBnDigits(c.n)}
            </div>
            <div className="text-ink-soft text-sm mt-2">{c.label}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display font-bold text-lg mb-2">সাম্প্রতিক পোস্ট</h2>
        {data.recent.length === 0 ? (
          <p className="text-ink-soft text-sm">এখনো কোনো পোস্ট নেই।</p>
        ) : (
          <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
            {data.recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title_bn}</div>
                  <div className="text-ink-soft text-xs flex items-center gap-1">
                    <MapPin size={11} /> {p.area}
                  </div>
                </div>
                <span className="text-ink-soft text-xs shrink-0">{timeAgoBn(p.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UsersTab() {
  const { data } = useSuspenseQuery(usersQuery);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (u) =>
        u.display_name.toLowerCase().includes(s) || (u.district ?? "").toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2.5">
        <Search size={16} className="text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="নাম বা জেলা দিয়ে খুঁজুন"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </label>
      <p className="text-ink-soft text-sm">
        মোট ব্যবহারকারী: <span className="font-bold text-ink">{toBnDigits(data.length)}</span>
        {q.trim() && <> · ফলাফল: {toBnDigits(filtered.length)}</>}
      </p>
      <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
        {filtered.length === 0 && <li className="p-4 text-ink-soft text-sm">কাউকে পাওয়া যায়নি।</li>}
        {filtered.map((u) => (
          <li key={u.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold truncate">{u.display_name}</div>
                <div className="text-ink-soft text-xs flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {u.district ?? "জেলা নেই"}
                </div>
              </div>
              <span className="text-ink-soft text-xs shrink-0">যোগদান: {formatBnDate(u.created_at)}</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1 text-leaf font-semibold">
                <Sprout size={13} /> {toBnDigits(u.points)} পয়েন্ট
              </span>
              <span className="flex items-center gap-1 text-marigold font-semibold">
                <Gift size={13} /> {toBnDigits(u.items_given)} দান
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostsTab() {
  const { data } = useSuspenseQuery(postsQuery);
  const queryClient = useQueryClient();
  const [cat, setCat] = useState("সব");
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = cat === "সব" ? data : data.filter((p) => p.category === cat);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { data: removed, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", toDelete.id)
      .select("id");
    setDeleting(false);
    if (error || !removed?.length) {
      toast.error(error?.message ?? "পোস্টটি মোছা যায়নি।");
      return;
    }
    toast.success("পোস্টটি মুছে ফেলা হয়েছে");
    setToDelete(null);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-ink-soft text-sm">
          পোস্ট: <span className="font-bold text-ink">{toBnDigits(filtered.length)}</span>
        </p>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="ক্যাটাগরি"
          className="bg-card border border-border rounded-full px-3 py-2 text-sm"
        >
          {CATS.map((c) => (
            <option key={c.bn} value={c.bn}>
              {c.emoji} {c.bn}
            </option>
          ))}
        </select>
      </div>

      <ul className="bg-card border border-border rounded-2xl divide-y divide-border">
        {filtered.length === 0 && <li className="p-4 text-ink-soft text-sm">কোনো পোস্ট নেই।</li>}
        {filtered.map((p) => (
          <li key={p.id} className="p-3 flex gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">
                {p.emoji} {p.title_bn}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[11px] rounded-full bg-paper border border-border px-2 py-0.5 text-ink-soft">
                  {p.category}
                </span>
                <span
                  className={`text-[11px] rounded-full px-2 py-0.5 font-semibold ${
                    p.status === "available" ? "bg-leaf-soft text-leaf" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.status === "available" ? "সক্রিয়" : p.status === "collected" ? "সংগৃহীত" : p.status}
                </span>
              </div>
              <div className="text-ink-soft text-xs mt-1 flex items-center gap-1">
                <MapPin size={11} /> {p.area}
              </div>
              <div className="text-ink-soft text-xs mt-0.5">
                দাতা: {p.giver} · {formatBnDate(p.created_at)}
              </div>
            </div>
            <button
              onClick={() => setToDelete({ id: p.id, title: p.title_bn })}
              aria-label={`${p.title_bn} মুছুন`}
              className="self-center flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shrink-0"
              style={{ width: 36, height: 36 }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>এই পোস্টটি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" স্থায়ীভাবে মুছে যাবে। এটি আর ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="animate-spin" size={16} /> : "মুছে ফেলুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
