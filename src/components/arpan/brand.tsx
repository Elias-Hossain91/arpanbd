import logoAsset from "@/assets/arpan-logo-full.png.asset.json";

export function Stitch({ className = "" }: { className?: string }) {
  return <div className={`stitch-row w-full ${className}`} />;
}

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={logoAsset.url}
        alt="অর্পণ arpan logo"
        style={{ height: size, width: "auto" }}
        className="block shrink-0 select-none"
        draggable={false}
      />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="font-bold text-ink text-lg truncate">অর্পণ</span>
        <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-soft truncate">
          ARPAN
        </span>
      </div>
    </div>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "leaf" | "marigold";
}) {
  const cls =
    tone === "leaf"
      ? "bg-leaf-soft text-leaf border-transparent"
      : tone === "marigold"
        ? "bg-marigold-soft text-marigold border-transparent"
        : "bg-paper text-ink-soft border-border";
  return (
    <span
      className={`inline-flex items-center text-xs font-medium rounded-full border px-2.5 py-1 ${cls}`}
    >
      {children}
    </span>
  );
}
