import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, MapPin, Heart, Plus, Home, ClipboardList, User,
  ChevronLeft, MessageCircle, ShieldCheck, Sprout, Camera, Award, Check, Bell,
  LogOut, Trash2, Loader2,
} from "lucide-react";
import { ITEMS as SAMPLE_ITEMS, CATS, tileBg, type ArpanItem } from "@/data/arpan";
import { Logo, Stitch, Tag } from "@/components/arpan/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Screen = "home" | "detail" | "post" | "activity";

type Item = ArpanItem & { _db?: boolean; _userId?: string };

function timeAgoBn(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘণ্টা আগে`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} দিন আগে`;
  return `${Math.floor(d / 7)} সপ্তাহ আগে`;
}

const TILES = ["marigold", "leaf", "paper"] as const;

export function ArpanApp() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState<Item | null>(null);
  const [activeCat, setActiveCat] = useState<string>("সব");
  const [query, setQuery] = useState("");
  const [dbItems, setDbItems] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data: posts } = await supabase
      .from("posts")
      .select("id,user_id,title_bn,title_en,category,emoji,tile,area,condition,note,created_at")
      .order("created_at", { ascending: false });
    const userIds = Array.from(new Set((posts ?? []).map((p: any) => p.user_id)));
    let profileMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.display_name]));
    }
    const mapped: Item[] = (posts ?? []).map((r: any) => ({
      id: r.id,
      bn: r.title_bn,
      en: r.title_en ?? "",
      cat: r.category,
      emoji: r.emoji,
      tile: (TILES.includes(r.tile) ? r.tile : "leaf") as Item["tile"],
      area: r.area,
      cond: r.condition,
      giver: profileMap[r.user_id] ?? "অর্পণ ব্যবহারকারী",
      note: r.note ?? "",
      postedAgo: timeAgoBn(r.created_at),
      _db: true,
      _userId: r.user_id,
    }));
    setDbItems(mapped);
    setLoading(false);
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    const { data } = await supabase.from("favorites").select("post_id");
    setFavorites(new Set((data ?? []).map((r: any) => r.post_id)));
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const allItems = useMemo<Item[]>(
    () => [...dbItems, ...SAMPLE_ITEMS.map((i) => ({ ...i, id: `s-${i.id}` as any, _db: false }))],
    [dbItems],
  );

  const list = useMemo(() => {
    let l = activeCat === "সব" ? allItems : allItems.filter((i) => i.cat === activeCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(
        (i) =>
          i.bn.toLowerCase().includes(q) ||
          i.en.toLowerCase().includes(q) ||
          i.area.toLowerCase().includes(q),
      );
    }
    return l;
  }, [activeCat, query, allItems]);

  const requireAuth = () => {
    if (!user) {
      navigate({ to: "/auth" });
      return false;
    }
    return true;
  };

  const toggleFavorite = async (item: Item) => {
    if (!requireAuth() || !item._db) return;
    const id = String(item.id);
    const isFav = favorites.has(id);
    const next = new Set(favorites);
    if (isFav) {
      next.delete(id);
      setFavorites(next);
      await supabase.from("favorites").delete().eq("post_id", id).eq("user_id", user!.id);
    } else {
      next.add(id);
      setFavorites(next);
      await supabase.from("favorites").insert({ post_id: id, user_id: user!.id });
    }
  };

  const open = (item: Item) => {
    setSelected(item);
    setScreen("detail");
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

        <div className="absolute inset-0 overflow-y-auto hide-scrollbar" style={{ paddingBottom: 84 }}>
          {screen === "home" && (
            <HomeScreen
              list={list}
              loading={loading || authLoading}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              query={query}
              setQuery={setQuery}
              open={open}
              user={user}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              goAuth={() => navigate({ to: "/auth" })}
            />
          )}
          {screen === "detail" && selected && (
            <DetailScreen
              item={selected}
              back={() => setScreen("home")}
              isFavorite={selected._db ? favorites.has(String(selected.id)) : false}
              onToggleFav={() => toggleFavorite(selected)}
              canFav={!!selected._db}
            />
          )}
          {screen === "post" && (
            <PostScreen
              user={user}
              goAuth={() => navigate({ to: "/auth" })}
              onDone={async () => {
                await loadPosts();
                setScreen("activity");
              }}
            />
          )}
          {screen === "activity" && (
            <ActivityScreen
              user={user}
              myPosts={dbItems.filter((i) => i._userId === user?.id)}
              favCount={favorites.size}
              signOut={signOut}
              goAuth={() => navigate({ to: "/auth" })}
              refresh={loadPosts}
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 bg-card border-t border-border">
          <Stitch />
          <div className="flex items-stretch justify-around" style={{ height: 68 }}>
            <NavBtn icon={Home} label="হোম" active={screen === "home"} onClick={() => setScreen("home")} />
            <NavBtn icon={ClipboardList} label="কার্যক্রম" active={screen === "activity"} onClick={() => setScreen("activity")} />
            <PostBtn onClick={() => (user ? setScreen("post") : navigate({ to: "/auth" }))} />
            <NavBtn icon={User} label="প্রোফাইল" active={false} onClick={() => (user ? setScreen("activity") : navigate({ to: "/auth" }))} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
        active ? "text-leaf" : "text-ink-soft hover:text-ink"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
      <span className={`text-[11px] ${active ? "font-semibold" : "font-normal"}`}>{label}</span>
    </button>
  );
}

function PostBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center flex-1 group">
      <div
        className="flex items-center justify-center rounded-full -mt-7 bg-marigold shadow-petal transition-transform group-active:scale-95"
        style={{ width: 56, height: 56, border: "4px solid var(--color-paper)" }}
      >
        <Plus size={28} color="#fff" strokeWidth={2.6} />
      </div>
      <span className="text-[11px] text-marigold font-semibold mt-1">দিন</span>
    </button>
  );
}

/* -------------------- HOME -------------------- */

function HomeScreen({
  list, loading, activeCat, setActiveCat, query, setQuery, open, user, favorites, toggleFavorite, goAuth,
}: {
  list: Item[]; loading: boolean; activeCat: string; setActiveCat: (v: string) => void;
  query: string; setQuery: (v: string) => void; open: (i: Item) => void;
  user: any; favorites: Set<string>; toggleFavorite: (i: Item) => void; goAuth: () => void;
}) {
  return (
    <div>
      <div className="bg-card" style={{ padding: "48px 18px 18px" }}>
        <h1 className="sr-only">অর্পণ — মানুষের জন্য মানুষ</h1>
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-ink-soft text-[13px] bg-paper border border-border rounded-full px-2.5 py-1.5">
              <MapPin size={14} className="text-marigold" /> ঢাকা
            </button>
            {user ? (
              <button
                aria-label="Notifications"
                className="flex items-center justify-center rounded-full bg-paper border border-border relative"
                style={{ width: 36, height: 36 }}
              >
                <Bell size={16} className="text-ink-soft" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-marigold" />
              </button>
            ) : (
              <button
                onClick={goAuth}
                className="text-[12px] font-semibold text-white bg-leaf rounded-full px-3 h-9 shadow-leaf"
              >
                সাইন ইন
              </button>
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 px-3 bg-paper rounded-2xl h-12 border border-border focus-within:border-leaf transition-colors">
          <Search size={18} className="text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="কী খুঁজছেন? যেমন: হুইলচেয়ার"
            className="bg-transparent flex-1 outline-none text-sm text-ink placeholder:text-ink-soft"
          />
        </label>
      </div>
      <Stitch />

      <div className="px-5 py-5 text-center">
        <div className="font-display text-leaf font-bold text-[20px] leading-tight">মানুষের জন্য মানুষ</div>
        <div className="text-[12.5px] text-ink-soft mt-1">
          দিন যা লাগবে না · নিন যা দরকার · সবই বিনামূল্যে
        </div>
      </div>

      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {CATS.map((c) => {
            const on = activeCat === c.bn;
            return (
              <button
                key={c.bn}
                onClick={() => setActiveCat(c.bn)}
                className={`flex flex-col items-center justify-center shrink-0 transition-all ${
                  on ? "bg-leaf text-white border-leaf shadow-leaf" : "bg-card text-ink border-border hover:border-leaf"
                }`}
                style={{ width: 68, height: 68, borderRadius: 18, borderWidth: 1 }}
              >
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <span className="text-[11px] mt-1 font-medium">{c.bn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span className="font-display font-semibold text-[16px] text-ink">
          {activeCat === "সব" ? "আপনার কাছাকাছি" : activeCat}
        </span>
        <span className="text-[12px] text-marigold font-semibold">{list.length} টি জিনিস</span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3">
        {loading && list.length === 0 ? (
          <div className="text-center py-10 text-ink-soft text-sm flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> লোড হচ্ছে…
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-ink-soft text-sm">
            এই মুহূর্তে কিছু পাওয়া যায়নি। একটু পরে আবার দেখুন।
          </div>
        ) : (
          list.map((it) => {
            const fav = it._db && favorites.has(String(it.id));
            return (
              <div
                key={it.id}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border shadow-soft hover:shadow-petal transition-shadow"
              >
                <button onClick={() => open(it)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                  <div
                    className={`flex items-center justify-center shrink-0 rounded-2xl ${tileBg(it.tile)}`}
                    style={{ width: 70, height: 70, fontSize: 34 }}
                  >
                    {it.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-ink truncate">{it.bn}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-ink-soft text-[12px]">
                      <MapPin size={12} className="text-marigold" />
                      <span className="truncate">{it.area}</span>
                      <span className="mx-1">·</span>
                      <span>{it.postedAgo}</span>
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                      <span className="inline-block text-[11px] text-leaf bg-leaf-soft px-2 py-0.5 rounded-full">
                        অবস্থা: {it.cond}
                      </span>
                    </div>
                  </div>
                </button>
                {it._db && (
                  <button
                    aria-label="favorite"
                    onClick={() => toggleFavorite(it)}
                    className={`shrink-0 flex items-center justify-center rounded-full transition-colors ${
                      fav ? "bg-marigold-soft text-marigold" : "bg-paper text-ink-soft border border-border"
                    }`}
                    style={{ width: 36, height: 36 }}
                  >
                    <Heart size={16} fill={fav ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* -------------------- DETAIL -------------------- */

function DetailScreen({
  item, back, isFavorite, onToggleFav, canFav,
}: {
  item: Item; back: () => void; isFavorite: boolean; onToggleFav: () => void; canFav: boolean;
}) {
  const [requested, setRequested] = useState(false);
  return (
    <div>
      <div className={`${tileBg(item.tile)}`} style={{ padding: "48px 18px 28px" }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={back}
            className="flex items-center gap-1 text-ink text-sm bg-card/70 backdrop-blur px-3 py-1.5 rounded-full border border-border"
          >
            <ChevronLeft size={16} /> ফিরে যান
          </button>
          {canFav && (
            <button
              onClick={onToggleFav}
              className={`flex items-center justify-center rounded-full ${
                isFavorite ? "bg-marigold text-white" : "bg-card/70 backdrop-blur text-ink border border-border"
              }`}
              style={{ width: 36, height: 36 }}
              aria-label="favorite"
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center" style={{ fontSize: 104 }}>{item.emoji}</div>
      </div>
      <Stitch />

      <div className="px-5 pt-5">
        <h1 className="font-display font-bold text-[22px] text-ink leading-tight">{item.bn}</h1>
        {item.en && <div className="text-[13px] text-ink-soft mt-0.5">{item.en}</div>}

        <div className="flex gap-2 mt-3 flex-wrap">
          <Tag>{item.cat}</Tag>
          <Tag>অবস্থা: {item.cond}</Tag>
          <Tag tone="leaf">একদম বিনামূল্যে</Tag>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-ink-soft text-[13px]">
          <MapPin size={15} className="text-marigold" /> {item.area} · {item.postedAgo}
        </div>

        <div className="mt-4 flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
          <div
            className="flex items-center justify-center rounded-full bg-leaf-soft text-leaf font-bold"
            style={{ width: 46, height: 46, fontSize: 18 }}
          >
            {item.giver[0]}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[14px] text-ink">{item.giver}</div>
            <div className="flex items-center gap-1 text-[12px] text-leaf">
              <ShieldCheck size={13} /> যাচাইকৃত দাতা
            </div>
          </div>
        </div>

        {item.note && (
          <div className="mt-4 bg-marigold-soft rounded-2xl p-4">
            <div className="text-[12px] text-marigold font-semibold mb-1">দাতার কথা</div>
            <div className="text-[14px] text-ink leading-[1.6]">"{item.note}"</div>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setRequested(true)}
            disabled={requested}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl font-bold text-[15px] transition-all ${
              requested ? "bg-leaf-soft text-leaf" : "bg-leaf text-white shadow-leaf active:scale-[0.98]"
            }`}
            style={{ height: 52 }}
          >
            {requested ? (<><Check size={18} /> অনুরোধ পাঠানো হয়েছে</>) : (<><Heart size={18} /> এটি আমার দরকার</>)}
          </button>
          <button
            className="flex items-center justify-center bg-card border border-border text-leaf rounded-2xl"
            style={{ width: 52, height: 52 }}
            aria-label="Message giver"
          >
            <MessageCircle size={20} />
          </button>
        </div>

        {requested && (
          <div className="mt-3 text-center text-[12.5px] text-ink-soft leading-[1.6] px-2">
            দাতার সাথে চ্যাটে সংগ্রহের সময় ঠিক করুন। নিরাপত্তার জন্য খোলা জায়গায় দেখা করুন।
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}

/* -------------------- POST -------------------- */

function PostScreen({ user, goAuth, onDone }: { user: any; goAuth: () => void; onDone: () => void }) {
  const [nameBn, setNameBn] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [area, setArea] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [emoji, setEmoji] = useState("🎁");
  const [cond, setCond] = useState("ভালো");
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="px-6 pt-32 text-center">
        <h1 className="font-display font-bold text-[18px] text-leaf">পোস্ট করতে সাইন ইন করুন</h1>
        <p className="text-[13px] text-ink-soft mt-2">আপনার দান অন্যের কাজে লাগুক — অ্যাকাউন্ট খুলুন বা সাইন ইন করুন।</p>
        <button onClick={goAuth} className="mt-5 bg-leaf text-white font-bold px-6 h-12 rounded-2xl shadow-leaf">
          সাইন ইন
        </button>
      </div>
    );
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErr(null);
    const slots = 3 - photos.length;
    const picked = Array.from(files).slice(0, slots);
    setUploading(true);
    try {
      const uploaded: { path: string; preview: string }[] = [];
      for (const file of picked) {
        if (file.size > 5 * 1024 * 1024) {
          setErr("প্রতিটি ছবি ৫MB এর কম হতে হবে।");
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("post-photos").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (error) { setErr(error.message); continue; }
        const { data: signed } = await supabase.storage.from("post-photos").createSignedUrl(path, 60 * 60);
        uploaded.push({ path, preview: signed?.signedUrl ?? URL.createObjectURL(file) });
      }
      setPhotos((p) => [...p, ...uploaded].slice(0, 3));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (idx: number) => {
    const ph = photos[idx];
    setPhotos((p) => p.filter((_, i) => i !== idx));
    if (ph) await supabase.storage.from("post-photos").remove([ph.path]);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setErr("আপনার ডিভাইসে GPS সমর্থন নেই।");
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=bn`,
          );
          const j = await r.json();
          const addr = j.address ?? {};
          const a = [addr.suburb, addr.neighbourhood, addr.road, addr.city_district, addr.city, addr.town, addr.village]
            .filter(Boolean).slice(0, 2).join(", ");
          if (a) setArea(a);
          if (addr.state_district && !upazila) setUpazila(addr.state_district);
          const d = addr.state || addr.city || addr.county;
          if (d && BD_DISTRICTS.includes(d) && !district) setDistrict(d);
        } catch {
          setErr("ঠিকানা শনাক্ত করা যায়নি — হাতে লিখুন।");
        } finally {
          setLocBusy(false);
        }
      },
      () => {
        setLocBusy(false);
        setErr("অবস্থান ব্যবহারের অনুমতি দিন বা হাতে লিখুন।");
      },
      { timeout: 10000 },
    );
  };

  const submit = async () => {
    setErr(null);
    if (!nameBn.trim() || !cat) {
      setErr("জিনিসের বাংলা নাম ও ক্যাটাগরি দরকার।");
      return;
    }
    if (!district && !area.trim()) {
      setErr("জেলা অথবা এলাকা দরকার।");
      return;
    }
    setBusy(true);
    const tile = TILES[Math.floor(Math.random() * TILES.length)];
    const locParts = [area.trim(), upazila.trim(), district].filter(Boolean);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      title_bn: nameBn.trim(),
      title_en: nameEn.trim() || null,
      category: cat,
      emoji,
      tile,
      area: locParts.join(", ") || district,
      upazila: upazila.trim() || null,
      condition: cond,
      note: desc.trim() || null,
      photos: photos.map((p) => p.path),
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onDone();
  };

  return (
    <div>
      <div className="bg-card" style={{ padding: "48px 18px 16px" }}>
        <h1 className="font-display font-bold text-[20px] text-leaf">একটি জিনিস দিন</h1>
        <div className="text-[13px] text-ink-soft mt-0.5">যা আর লাগছে না, তা অন্যের কাজে লাগুক</div>
      </div>
      <Stitch />
      <div className="px-5 pt-4 flex flex-col gap-4">
        {/* Photos */}
        <div>
          <div className="text-[13px] font-semibold text-ink mb-2">ছবি (সর্বোচ্চ ৩টি)</div>
          <div className="flex gap-2">
            {photos.map((p, i) => (
              <div key={p.path} className="relative" style={{ width: 92, height: 92 }}>
                <img src={p.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover rounded-2xl border border-border" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 bg-marigold text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                  aria-label="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <label
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-marigold-soft cursor-pointer"
                style={{ width: 92, height: 92, border: "2px dashed var(--color-marigold)" }}
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-marigold" />
                ) : (
                  <>
                    <Camera size={20} className="text-marigold" />
                    <span className="text-[11px] text-marigold font-semibold">যোগ করুন</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Emoji fallback when no photo */}
        {photos.length === 0 && (
          <div>
            <div className="text-[13px] font-semibold text-ink mb-2">প্রতীক বেছে নিন (ছবি না থাকলে)</div>
            <div className="flex gap-1.5 flex-wrap">
              {["🎁","🪑","🛏️","♿","📚","🧣","🧵","🧸","🪵","👕","🍼","🏠"].map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`rounded-xl text-xl transition-all ${emoji === e ? "bg-leaf-soft ring-2 ring-leaf" : "bg-paper border border-border"}`}
                  style={{ width: 34, height: 34 }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        <Field label="জিনিসের নাম (বাংলা)" ph="যেমন: হাসপাতালের বেড" val={nameBn} set={setNameBn} />
        <Field label="Item name (English)" ph="e.g. Hospital bed" val={nameEn} set={setNameEn} />

        <div>
          <div className="text-[13px] font-semibold text-ink mb-2">ক্যাটাগরি</div>
          <div className="flex gap-2 flex-wrap">
            {CATS.filter((c) => c.bn !== "সব").map((c) => {
              const on = cat === c.bn;
              return (
                <button
                  key={c.bn}
                  onClick={() => setCat(on ? null : c.bn)}
                  className={`text-[12.5px] px-3 py-1.5 rounded-full border transition-colors ${
                    on ? "bg-leaf text-white border-leaf" : "bg-card text-ink border-border hover:border-leaf"
                  }`}
                >
                  {c.emoji} {c.bn}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-ink mb-2">অবস্থা</div>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "ভালো", l: "ভালো / Good" },
              { v: "মোটামুটি", l: "মোটামুটি / Fair" },
              { v: "পুরনো কিন্তু সচল", l: "পুরনো কিন্তু সচল / Old but Usable" },
            ].map((c) => (
              <button
                key={c.v}
                onClick={() => setCond(c.v)}
                className={`text-[12.5px] px-3 py-1.5 rounded-full border ${
                  cond === c.v ? "bg-marigold text-white border-marigold" : "bg-card text-ink border-border"
                }`}
              >
                {c.l}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-ink">অবস্থান</div>
            <button
              onClick={detectLocation}
              disabled={locBusy}
              className="text-[12px] text-leaf font-semibold flex items-center gap-1 disabled:opacity-60"
            >
              {locBusy ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} GPS দিয়ে শনাক্ত
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-2 text-sm outline-none focus:border-leaf"
            >
              <option value="">জেলা</option>
              {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              placeholder="উপজেলা / থানা"
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-leaf placeholder:text-ink-soft"
            />
          </div>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="এলাকা / মহল্লা (যেমন: উত্তরা সেক্টর ৭)"
            className="mt-2 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-leaf placeholder:text-ink-soft"
          />
        </div>

        <Field label="বিবরণ" ph="অবস্থা ও সংগ্রহের সময় লিখুন" val={desc} set={setDesc} area />

        {err && <div className="text-[12.5px] bg-marigold-soft text-marigold rounded-xl px-3 py-2">{err}</div>}

        <button
          onClick={submit}
          disabled={busy || uploading}
          className="flex items-center justify-center gap-2 mt-1 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ height: 52 }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sprout size={18} />} পোস্ট করুন
        </button>

        <div className="text-center text-[12px] text-ink-soft pb-4">
          পোস্ট করার মানে আপনি বিনামূল্যে দিচ্ছেন। কোনো অর্থ নেওয়া যাবে না।
        </div>
      </div>
    </div>
  );
}



function Field({ label, ph, val, set, area }: { label: string; ph: string; val: string; set: (v: string) => void; area?: boolean }) {
  const base = "w-full rounded-2xl border border-border bg-card text-ink text-sm outline-none focus:border-leaf transition-colors px-3";
  return (
    <div>
      <div className="text-[13px] font-semibold text-ink mb-2">{label}</div>
      {area ? (
        <textarea placeholder={ph} value={val} onChange={(e) => set(e.target.value)} rows={3} className={`${base} py-2.5 resize-none placeholder:text-ink-soft`} />
      ) : (
        <input placeholder={ph} value={val} onChange={(e) => set(e.target.value)} className={`${base} h-12 placeholder:text-ink-soft`} />
      )}
    </div>
  );
}

/* -------------------- ACTIVITY -------------------- */

const BD_DISTRICTS = [
  "ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","সিলেট","বরিশাল","রংপুর","ময়মনসিংহ",
  "কুমিল্লা","নারায়ণগঞ্জ","গাজীপুর","নরসিংদী","টাঙ্গাইল","জামালপুর","শেরপুর","নেত্রকোনা",
  "কিশোরগঞ্জ","মুন্সিগঞ্জ","মানিকগঞ্জ","ফরিদপুর","রাজবাড়ী","গোপালগঞ্জ","মাদারীপুর","শরীয়তপুর",
  "ব্রাহ্মণবাড়িয়া","চাঁদপুর","লক্ষ্মীপুর","নোয়াখালী","ফেনী","কক্সবাজার","বান্দরবান","রাঙ্গামাটি",
  "খাগড়াছড়ি","বগুড়া","জয়পুরহাট","নওগাঁ","নাটোর","চাঁপাইনবাবগঞ্জ","পাবনা","সিরাজগঞ্জ",
  "যশোর","ঝিনাইদহ","মাগুরা","নড়াইল","বাগেরহাট","সাতক্ষীরা","কুষ্টিয়া","চুয়াডাঙ্গা","মেহেরপুর",
  "ভোলা","বরগুনা","পটুয়াখালী","পিরোজপুর","ঝালকাঠি","দিনাজপুর","পঞ্চগড়","ঠাকুরগাঁও","নীলফামারী",
  "লালমনিরহাট","কুড়িগ্রাম","গাইবান্ধা","হবিগঞ্জ","মৌলভীবাজার","সুনামগঞ্জ",
];

type ProfileRow = {
  display_name: string;
  area: string | null;
  district: string | null;
  points: number;
  items_given: number;
  items_received: number;
  show_phone: boolean;
};

const BADGES = [
  { min: 300, name: "কমিউনিটি হিরো", color: "bg-marigold text-white" },
  { min: 150, name: "সমাজবন্ধু", color: "bg-leaf text-white" },
  { min: 50,  name: "সাহায্যকারী", color: "bg-marigold-soft text-marigold" },
  { min: 0,   name: "নতুন সদস্য", color: "bg-leaf-soft text-leaf" },
];

function badgeFor(points: number) {
  return BADGES.find((b) => points >= b.min) ?? BADGES[BADGES.length - 1];
}

function nextBadge(points: number) {
  const higher = BADGES.filter((b) => b.min > points).sort((a, b) => a.min - b.min);
  return higher[0];
}

function ActivityScreen({
  user, myPosts, favCount, signOut, goAuth, refresh,
}: {
  user: any; myPosts: Item[]; favCount: number; signOut: () => Promise<void>; goAuth: () => void; refresh: () => Promise<void>;
}) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formShowPhone, setFormShowPhone] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    const { data } = await supabase
      .from("profiles")
      .select("display_name, area, district, points, items_given, items_received, show_phone")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setProfile(data as ProfileRow);
      setFormName(data.display_name ?? "");
      setFormDistrict(data.district ?? "");
      setFormShowPhone(!!data.show_phone);
      // First-run setup if no district picked yet
      if (!data.district) setEditing(true);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (!user) {
    return (
      <div className="px-6 pt-32 text-center">
        <h1 className="font-display font-bold text-[18px] text-leaf">আপনার কার্যক্রম দেখতে সাইন ইন করুন</h1>
        <p className="text-[13px] text-ink-soft mt-2">পছন্দ ও নিজের পোস্ট এক জায়গায় পরিচালনা করুন।</p>
        <button onClick={goAuth} className="mt-5 bg-leaf text-white font-bold px-6 h-12 rounded-2xl shadow-leaf">
          সাইন ইন
        </button>
      </div>
    );
  }

  const deletePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    await refresh();
  };

  const markCollected = async (id: string) => {
    await supabase.from("posts").update({ status: "collected" }).eq("id", id);
    await Promise.all([refresh(), loadProfile()]);
  };

  const saveProfile = async () => {
    if (!formName.trim() || !formDistrict) return;
    setSavingProfile(true);
    await supabase.from("profiles").update({
      display_name: formName.trim(),
      district: formDistrict,
      show_phone: formShowPhone,
    }).eq("id", user.id);
    setSavingProfile(false);
    setEditing(false);
    await loadProfile();
  };

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "অর্পণ ব্যবহারকারী";
  const points = profile?.points ?? 0;
  const badge = badgeFor(points);
  const next = nextBadge(points);
  const activePosts = myPosts.filter((p) => p.cond !== "collected"); // visual list — status not in Item type, so show all
  const collectedCount = profile?.items_given ?? 0;

  return (
    <div>
      <div className="bg-leaf relative overflow-hidden" style={{ padding: "52px 18px 26px" }}>
        <div className="absolute inset-x-0 bottom-0 stitch-row opacity-70" />
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full bg-white text-leaf font-bold font-display shadow-petal"
            style={{ width: 56, height: 56, fontSize: 24 }}
          >
            {name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-white font-bold text-[18px] font-display">{name}</h1>
            <div className="flex items-center gap-1.5 text-marigold-soft text-[13px]">
              <MapPin size={12} /> {profile?.district ?? "জেলা সেট করুন"}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-center rounded-full bg-white/20 text-white"
            style={{ width: 36, height: 36 }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className={`text-[12px] font-semibold rounded-full px-3 py-1 ${badge.color}`}>
            <Award size={12} className="inline -mt-0.5 mr-1" />{badge.name}
          </span>
          <span className="text-[12px] text-white/85 font-display font-bold">{points} পয়েন্ট</span>
        </div>
        {next && (
          <div className="mt-2">
            <div className="text-[11px] text-white/80 mb-1">{next.name} পেতে আরও {next.min - points} পয়েন্ট</div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-marigold"
                style={{ width: `${Math.min(100, (points / next.min) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <Stitch />

      <div className="px-4 pt-4">
        <div className="flex gap-3">
          <Stat big={String(myPosts.length)} label="পোস্ট" />
          <Stat big={String(collectedCount)} label="দান সম্পন্ন" />
          <Stat big={String(profile?.items_received ?? 0)} label="সংগ্রহ" />
          <Stat big={String(favCount)} label="পছন্দ" />
        </div>
      </div>

      {/* Profile setup / edit card */}
      <div className="px-4 pt-4">
        {editing ? (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="font-display font-semibold text-[15px] text-ink">
              {profile?.district ? "প্রোফাইল সম্পাদনা" : "প্রোফাইল সম্পূর্ণ করুন"}
            </div>
            <div>
              <div className="text-[12.5px] text-ink-soft mb-1">পুরো নাম</div>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="আপনার নাম"
                className="w-full h-11 rounded-xl border border-border bg-paper px-3 text-sm outline-none focus:border-leaf"
              />
            </div>
            <div>
              <div className="text-[12.5px] text-ink-soft mb-1">জেলা</div>
              <select
                value={formDistrict}
                onChange={(e) => setFormDistrict(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-paper px-3 text-sm outline-none focus:border-leaf"
              >
                <option value="">— জেলা নির্বাচন করুন —</option>
                {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <label className="flex items-center justify-between bg-paper rounded-xl px-3 py-2.5 border border-border">
              <span className="text-[13px] text-ink">আমার ফোন নম্বর দেখাও</span>
              <input
                type="checkbox"
                checked={formShowPhone}
                onChange={(e) => setFormShowPhone(e.target.checked)}
                className="w-4 h-4 accent-leaf"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile || !formName.trim() || !formDistrict}
                className="flex-1 h-11 rounded-xl bg-leaf text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingProfile && <Loader2 size={14} className="animate-spin" />} সংরক্ষণ
              </button>
              {profile?.district && (
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 h-11 rounded-xl border border-border text-ink-soft text-sm"
                >
                  বাতিল
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full text-left bg-marigold-soft rounded-2xl p-3 flex items-center gap-3"
          >
            <Sprout size={28} className="text-marigold shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-[14px] text-ink">প্রোফাইল সম্পাদনা</div>
              <div className="text-[12px] text-ink-soft">
                নাম · জেলা · ফোন দেখানোর সেটিং
              </div>
            </div>
          </button>
        )}
      </div>

      <div className="px-4 pt-5">
        <div className="font-display font-semibold text-[16px] text-ink mb-2">আপনার পোস্ট</div>
        {activePosts.length === 0 ? (
          <div className="text-center py-6 text-ink-soft text-[13px] bg-card border border-border rounded-2xl">
            এখনো কোনো পোস্ট নেই। প্রথম জিনিসটি দিন!
          </div>
        ) : (
          activePosts.map((h) => (
            <div key={h.id} className="flex items-center gap-3 mb-2.5 bg-card border border-border rounded-2xl p-2.5">
              <div className="flex items-center justify-center rounded-xl bg-paper" style={{ width: 44, height: 44, fontSize: 24 }}>
                {h.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink truncate">{h.bn}</div>
                <div className="text-[12px] text-ink-soft">{h.area} · {h.postedAgo}</div>
              </div>
              <button
                onClick={() => markCollected(String(h.id))}
                className="text-leaf hover:bg-leaf-soft p-2 rounded-lg"
                aria-label="Mark as collected"
                title="সংগৃহীত হিসেবে চিহ্নিত করুন (+২০)"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => deletePost(String(h.id))}
                className="text-ink-soft hover:text-marigold p-2"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="px-4 pt-2 pb-4 text-center">
        <span className="text-[12.5px] text-ink-soft">আপনার ছোট দান কারও বড় প্রয়োজন মেটাচ্ছে 💚</span>
      </div>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="flex-1 text-center bg-card border border-border rounded-2xl py-3 min-w-0">
      <div className="font-display font-bold text-leaf" style={{ fontSize: 22 }}>{big}</div>
      <div className="text-[11px] text-ink-soft mt-0.5 truncate">{label}</div>
    </div>
  );
}
