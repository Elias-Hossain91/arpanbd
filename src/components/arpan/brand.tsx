import logoAsset from "@/assets/arpan-logo.png.asset.json";

export function Stitch({ className = "" }: { className?: string }) {
  return <div className={`stitch-row w-full ${className}`} />;
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset.url}
        alt="অর্পণ logo"
        style={{ height: size + 22, width: "auto" }}
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
          style={{ fontSize: 10, letterSpacing: 2.4, marginTop: 2 }}
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
