import logoAsset from "@/assets/arpan-logo.png.asset.json";

export function Stitch({ className = "" }: { className?: string }) {
  return <div className={`stitch-row w-full ${className}`} />;
}

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt="অর্পণ — Arpan, Community Giving Platform"
      style={{ height: size, width: "auto" }}
      className="block select-none"
      draggable={false}
    />
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
