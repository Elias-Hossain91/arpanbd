import logoAsset from "@/assets/arpan-logo-transparent.png.asset.json";

export function Stitch({ className = "" }: { className?: string }) {
  return <div className={`stitch-row w-full ${className}`} />;
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src={logoAsset.url}
        alt="অর্পণ logo"
        style={{ height: size * 1.9, width: "auto" }}
        className="block shrink-0 select-none"
        draggable={false}
      />
      <div className="min-w-0 leading-none">
        <div
          className="font-display text-leaf font-bold truncate"
          style={{ fontSize: size }}
        >
          অর্পণ
        </div>
        <div
          className="text-marigold font-semibold truncate"
          style={{ fontSize: size * 0.42, letterSpacing: size * 0.1, marginTop: size * 0.08 }}
        >
          ARPAN
        </div>
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
