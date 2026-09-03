import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-line px-5 py-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
    </div>
  );
}
