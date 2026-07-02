export default function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "profit" | "loss" | "accent";
}) {
  const toneClass =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
      ? "text-loss"
      : tone === "accent"
      ? "text-accent"
      : "text-ink";

  return (
    <div className="rounded-2xl bg-card border border-line shadow-card p-5">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className={`mt-1.5 text-2xl lg:text-3xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
