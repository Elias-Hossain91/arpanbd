import { useMemo, useState } from "react";
import {
  Search, MapPin, Heart, Plus, Home, ClipboardList, User,
  ChevronLeft, MessageCircle, ShieldCheck, Sprout, Camera, Award, Check, Bell,
} from "lucide-react";
import { ITEMS, CATS, tileBg, type ArpanItem } from "@/data/arpan";
import { Logo, Stitch, Tag } from "@/components/arpan/brand";

type Screen = "home" | "detail" | "post" | "activity";

export function ArpanApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState<ArpanItem | null>(null);
  const [activeCat, setActiveCat] = useState<string>("সব");
  const [query, setQuery] = useState("");
  const [requested, setRequested] = useState<Record<number, boolean>>({});

  const list = useMemo(() => {
    let l = activeCat === "সব" ? ITEMS : ITEMS.filter((i) => i.cat === activeCat);
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
  }, [activeCat, query]);

  const open = (item: ArpanItem) => {
    setSelected(item);
    setScreen("detail");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-paper-deep paper-texture">
      {/* phone frame */}
      <div
        className="relative overflow-hidden bg-paper shadow-leaf"
        style={{
          width: 390,
          height: 820,
          borderRadius: 48,
          border: "11px solid #1d1c18",
        }}
      >
        {/* notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 bg-[#1d1c18]"
          style={{ top: 10, width: 132, height: 28, borderRadius: 20 }}
        />

        {/* scroll area */}
        <div className="absolute inset-0 overflow-y-auto hide-scrollbar" style={{ paddingBottom: 84 }}>
          {screen === "home" && (
            <HomeScreen
              list={list}
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              query={query}
              setQuery={setQuery}
              open={open}
            />
          )}
          {screen === "detail" && selected && (
            <DetailScreen
              item={selected}
              back={() => setScreen("home")}
              requested={!!requested[selected.id]}
              onRequest={() => setRequested((r) => ({ ...r, [selected.id]: true }))}
            />
          )}
          {screen === "post" && <PostScreen onDone={() => setScreen("activity")} />}
          {screen === "activity" && <ActivityScreen />}
        </div>

        {/* bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-card border-t border-border">
          <Stitch />
          <div className="flex items-stretch justify-around" style={{ height: 68 }}>
            <NavBtn icon={Home} label="হোম" active={screen === "home"} onClick={() => setScreen("home")} />
            <NavBtn icon={ClipboardList} label="কার্যক্রম" active={screen === "activity"} onClick={() => setScreen("activity")} />
            <PostBtn onClick={() => setScreen("post")} />
            <NavBtn icon={User} label="প্রোফাইল" active={false} onClick={() => setScreen("activity")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
  list,
  activeCat,
  setActiveCat,
  query,
  setQuery,
  open,
}: {
  list: ArpanItem[];
  activeCat: string;
  setActiveCat: (v: string) => void;
  query: string;
  setQuery: (v: string) => void;
  open: (i: ArpanItem) => void;
}) {
  return (
    <div>
      {/* header */}
      <div className="bg-card" style={{ padding: "48px 18px 18px" }}>
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 text-ink-soft text-[13px] bg-paper border border-border rounded-full px-2.5 py-1.5"
              aria-label="Location"
            >
              <MapPin size={14} className="text-marigold" /> ঢাকা
            </button>
            <button
              className="flex items-center justify-center rounded-full bg-paper border border-border relative"
              style={{ width: 36, height: 36 }}
              aria-label="Notifications"
            >
              <Bell size={16} className="text-ink-soft" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-marigold" />
            </button>
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

      {/* tagline */}
      <div className="px-5 py-5 text-center">
        <div className="font-display text-leaf font-bold text-[20px] leading-tight">
          মানুষের জন্য মানুষ
        </div>
        <div className="text-[12.5px] text-ink-soft mt-1">
          দিন যা লাগবে না · নিন যা দরকার · সবই বিনামূল্যে
        </div>
      </div>

      {/* categories */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {CATS.map((c) => {
            const on = activeCat === c.bn;
            return (
              <button
                key={c.bn}
                onClick={() => setActiveCat(c.bn)}
                className={`flex flex-col items-center justify-center shrink-0 transition-all ${
                  on
                    ? "bg-leaf text-white border-leaf shadow-leaf"
                    : "bg-card text-ink border-border hover:border-leaf"
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

      {/* list header */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span className="font-display font-semibold text-[16px] text-ink">
          {activeCat === "সব" ? "আপনার কাছাকাছি" : activeCat}
        </span>
        <span className="text-[12px] text-marigold font-semibold">{list.length} টি জিনিস</span>
      </div>

      {/* list */}
      <div className="px-4 pb-4 flex flex-col gap-3">
        {list.length === 0 ? (
          <div className="text-center py-10 text-ink-soft text-sm">
            এই মুহূর্তে কিছু পাওয়া যায়নি। একটু পরে আবার দেখুন।
          </div>
        ) : (
          list.map((it) => (
            <button
              key={it.id}
              onClick={() => open(it)}
              className="flex items-center gap-3 text-left bg-card rounded-2xl p-3 border border-border shadow-soft hover:shadow-petal transition-shadow active:scale-[0.99]"
            >
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
          ))
        )}
      </div>
    </div>
  );
}

/* -------------------- DETAIL -------------------- */

function DetailScreen({
  item,
  back,
  requested,
  onRequest,
}: {
  item: ArpanItem;
  back: () => void;
  requested: boolean;
  onRequest: () => void;
}) {
  return (
    <div>
      <div className={`${tileBg(item.tile)}`} style={{ padding: "48px 18px 28px" }}>
        <button
          onClick={back}
          className="flex items-center gap-1 mb-3 text-ink text-sm bg-card/70 backdrop-blur px-3 py-1.5 rounded-full border border-border"
        >
          <ChevronLeft size={16} /> ফিরে যান
        </button>
        <div className="flex items-center justify-center" style={{ fontSize: 104 }}>
          {item.emoji}
        </div>
      </div>
      <Stitch />

      <div className="px-5 pt-5">
        <div className="font-display font-bold text-[22px] text-ink leading-tight">{item.bn}</div>
        <div className="text-[13px] text-ink-soft mt-0.5">{item.en}</div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Tag>{item.cat}</Tag>
          <Tag>অবস্থা: {item.cond}</Tag>
          <Tag tone="leaf">একদম বিনামূল্যে</Tag>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-ink-soft text-[13px]">
          <MapPin size={15} className="text-marigold" /> {item.area} · {item.postedAgo}
        </div>

        {/* giver card */}
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
              <ShieldCheck size={13} /> মোবাইল যাচাইকৃত দাতা
            </div>
          </div>
        </div>

        {/* note */}
        <div className="mt-4 bg-marigold-soft rounded-2xl p-4">
          <div className="text-[12px] text-marigold font-semibold mb-1">দাতার কথা</div>
          <div className="text-[14px] text-ink leading-[1.6]">"{item.note}"</div>
        </div>

        {/* actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onRequest}
            disabled={requested}
            className={`flex-1 flex items-center justify-center gap-2 h-13 rounded-2xl font-bold text-[15px] transition-all ${
              requested
                ? "bg-leaf-soft text-leaf"
                : "bg-leaf text-white shadow-leaf active:scale-[0.98]"
            }`}
            style={{ height: 52 }}
          >
            {requested ? (
              <><Check size={18} /> অনুরোধ পাঠানো হয়েছে</>
            ) : (
              <><Heart size={18} /> এটি আমার দরকার</>
            )}
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

function PostScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  return (
    <div>
      <div className="bg-card" style={{ padding: "48px 18px 16px" }}>
        <div className="font-display font-bold text-[20px] text-leaf">একটি জিনিস দিন</div>
        <div className="text-[13px] text-ink-soft mt-0.5">
          যা আর লাগছে না, তা অন্যের কাজে লাগুক
        </div>
      </div>
      <Stitch />
      <div className="px-5 pt-4 flex flex-col gap-4">
        <button
          className="flex items-center justify-center flex-col gap-2 rounded-2xl bg-marigold-soft transition-colors hover:bg-marigold-soft/80"
          style={{ height: 130, border: "2px dashed var(--color-marigold)" }}
        >
          <Camera size={26} className="text-marigold" />
          <span className="text-[13px] text-marigold font-semibold">ছবি যোগ করুন</span>
          <span className="text-[11px] text-ink-soft">৫টি পর্যন্ত</span>
        </button>

        <Field label="জিনিসের নাম" ph="যেমন: হাসপাতালের বেড" val={name} set={setName} />

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
                    on
                      ? "bg-leaf text-white border-leaf"
                      : "bg-card text-ink border-border hover:border-leaf"
                  }`}
                >
                  {c.emoji} {c.bn}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="এলাকা" ph="যেমন: উত্তরা, ঢাকা" val={area} set={setArea} />
        <Field label="বিবরণ" ph="অবস্থা ও সংগ্রহের সময় লিখুন" val={desc} set={setDesc} area />

        <button
          onClick={onDone}
          className="flex items-center justify-center gap-2 mt-1 bg-leaf text-white font-bold text-[15px] rounded-2xl shadow-leaf active:scale-[0.98] transition-transform"
          style={{ height: 52 }}
        >
          <Sprout size={18} /> পোস্ট করুন
        </button>

        <div className="text-center text-[12px] text-ink-soft pb-4">
          পোস্ট করার মানে আপনি বিনামূল্যে দিচ্ছেন। কোনো অর্থ নেওয়া যাবে না।
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ph,
  val,
  set,
  area,
}: {
  label: string;
  ph: string;
  val: string;
  set: (v: string) => void;
  area?: boolean;
}) {
  const base =
    "w-full rounded-2xl border border-border bg-card text-ink text-sm outline-none focus:border-leaf transition-colors px-3";
  return (
    <div>
      <div className="text-[13px] font-semibold text-ink mb-2">{label}</div>
      {area ? (
        <textarea
          placeholder={ph}
          value={val}
          onChange={(e) => set(e.target.value)}
          rows={3}
          className={`${base} py-2.5 resize-none placeholder:text-ink-soft`}
        />
      ) : (
        <input
          placeholder={ph}
          value={val}
          onChange={(e) => set(e.target.value)}
          className={`${base} h-12 placeholder:text-ink-soft`}
        />
      )}
    </div>
  );
}

/* -------------------- ACTIVITY -------------------- */

function ActivityScreen() {
  return (
    <div>
      <div className="bg-leaf relative overflow-hidden" style={{ padding: "52px 18px 26px" }}>
        {/* decorative stitches */}
        <div className="absolute inset-x-0 bottom-0 stitch-row opacity-70" />
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full bg-white text-leaf font-bold font-display shadow-petal"
            style={{ width: 56, height: 56, fontSize: 24 }}
          >
            ন
          </div>
          <div>
            <div className="text-white font-bold text-[18px] font-display">নাসরিন আক্তার</div>
            <div className="flex items-center gap-1 text-marigold-soft text-[13px]">
              <Award size={14} /> সমাজ-বন্ধু · ঢাকা
            </div>
          </div>
        </div>
      </div>
      <Stitch />

      {/* impact */}
      <div className="px-4 pt-4">
        <div className="flex gap-3">
          <Stat big="১২" label="জন উপকৃত" />
          <Stat big="৮" label="জিনিস দিয়েছেন" />
          <Stat big="৩" label="সংগ্রহ করেছেন" />
        </div>

        <div className="mt-3 flex items-center gap-3 bg-marigold-soft rounded-2xl p-4">
          <Sprout size={32} className="text-marigold shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-[15px] text-ink">অর্পণ পয়েন্ট: ২৪০ 🌱</div>
            <div className="text-[12.5px] text-ink-soft">
              আর ৬০ পয়েন্ট হলে "কমিউনিটি হিরো" ব্যাজ
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
              <div className="h-full bg-marigold rounded-full" style={{ width: "80%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* history */}
      <div className="px-4 pt-5">
        <div className="font-display font-semibold text-[16px] text-ink mb-2">আপনার দান</div>
        {[
          { e: "🪑", t: "বাচ্চাদের খাওয়ানোর চেয়ার", s: "নিয়েছেন: সুমাইয়া" },
          { e: "📚", t: "ক্লাস ৮-এর বই", s: "নিয়েছেন: রাকিব" },
          { e: "🧣", t: "শীতের কম্বল", s: "নিয়েছেন: একটি এতিমখানা" },
        ].map((h, i) => (
          <div
            key={i}
            className="flex items-center gap-3 mb-2.5 bg-card border border-border rounded-2xl p-2.5"
          >
            <div
              className="flex items-center justify-center rounded-xl bg-paper"
              style={{ width: 44, height: 44, fontSize: 24 }}
            >
              {h.e}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">{h.t}</div>
              <div className="text-[12px] text-ink-soft">{h.s}</div>
            </div>
            <span className="text-[11px] text-leaf bg-leaf-soft px-2 py-1 rounded-full font-medium">
              সম্পন্ন
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 pt-2 pb-4 text-center">
        <span className="text-[12.5px] text-ink-soft">
          আপনার ছোট দান কারও বড় প্রয়োজন মেটাচ্ছে 💚
        </span>
      </div>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="flex-1 text-center bg-card border border-border rounded-2xl py-3">
      <div className="font-display font-bold text-leaf" style={{ fontSize: 24 }}>
        {big}
      </div>
      <div className="text-[11.5px] text-ink-soft mt-0.5">{label}</div>
    </div>
  );
}
