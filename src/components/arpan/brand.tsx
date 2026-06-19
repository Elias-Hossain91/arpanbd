import logoAsset from "@/assets/arpan-logo-transparent.png.asset.json";

export function Stitch({ className = "" }: { className?: string }) {
  return <div className={`stitch-row w-full ${className}`} />;
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoAsset.url}
        alt="অর্পণ logo"
        style={{ height: size * 2.4, width: "auto" }}
        className="block select-none"
        draggable={false}
      />
      <div className="leading-none">
        <div
          className="font-display text-leaf font-bold"
          style={{ fontSize: size }}
        >
          অর্পণ
        </div>
        <div
          className="text-marigold font-semibold"
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
