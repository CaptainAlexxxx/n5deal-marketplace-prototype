import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  LABELS,
  type BusinessStatus,
  type InvestorType,
  type Timeline,
} from "@/lib/domain/enums";
import { flagOf, formatRange } from "@/lib/format";
import type { BuyerListItem } from "@/lib/search/buyers";

export function BuyerCard({
  buyer,
  href,
  footer,
}: {
  buyer: BuyerListItem;
  href: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-brand/50">
      <Link href={href} className="group">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-ink group-hover:text-brand">
            {buyer.displayName}
          </h3>
          <Badge tone="brand">
            {LABELS.investorType[buyer.investorType as InvestorType]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{buyer.headline}</p>
        <p className="mt-3 line-clamp-3 text-sm text-ink/80">{buyer.thesis}</p>
      </Link>

      <div className="mt-4 space-y-2 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted">Ticket range</span>
          <span className="stat-value text-accent">
            {formatRange(buyer.ticketMinEur, buyer.ticketMaxEur)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted">Readiness</span>
          <span className="text-xs text-ink">
            {LABELS.timeline[buyer.timeline as Timeline]}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted">Prefers</span>
          <span className="text-xs text-ink">
            {buyer.preferredBusinessStatus
              ? LABELS.businessStatus[buyer.preferredBusinessStatus as BusinessStatus]
              : "Either"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {buyer.categories.map(({ category }) => (
          <Badge key={category.id}>{category.name}</Badge>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {buyer.countries.slice(0, 5).map(({ country }) => (
          <span key={country.id} className="text-xs text-muted">
            {flagOf(country.code)} {country.name}
          </span>
        ))}
        {buyer.countries.length > 5 ? (
          <span className="text-xs text-muted">+{buyer.countries.length - 5}</span>
        ) : null}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
