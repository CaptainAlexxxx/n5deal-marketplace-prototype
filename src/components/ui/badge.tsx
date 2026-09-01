import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "positive" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-elevated text-muted",
  brand: "border-brand/40 bg-brand/10 text-brand",
  positive: "border-positive/40 bg-positive/10 text-positive",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-danger/40 bg-danger/10 text-danger",
  accent: "border-accent/40 bg-accent/10 text-accent",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
