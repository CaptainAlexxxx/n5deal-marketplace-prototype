import Link from "next/link";
import { cn } from "@/lib/cn";

export function Brand({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-mono text-sm font-bold text-brand-ink">
        N5
      </span>
      <span className="text-sm font-semibold tracking-tight text-ink">
        N5Deal <span className="text-muted">Marketplace</span>
      </span>
    </Link>
  );
}
