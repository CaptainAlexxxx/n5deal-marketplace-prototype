import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LABELS, type AssetStatus, type BusinessStatus, type LicenseType } from "@/lib/domain/enums";
import { formatEur, formatEurCompact, flagOf } from "@/lib/format";
import type { AssetListItem } from "@/lib/search/assets";
import type { MatchResult } from "@/lib/match";
import { MatchBadge } from "./match-badge";

const STATUS_TONE = {
  DRAFT: "neutral",
  PUBLISHED: "positive",
  SUSPENDED: "danger",
  ARCHIVED: "warning",
} as const satisfies Record<AssetStatus, string>;

export function AssetCard({
  asset,
  href,
  match,
  showStatus = false,
}: {
  asset: AssetListItem;
  href: string;
  match?: MatchResult;
  showStatus?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-brand/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">#{asset.reference}</span>
          <span className="text-sm">{flagOf(asset.country.code)}</span>
          <span className="text-xs text-muted">{asset.country.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {showStatus ? (
            <Badge tone={STATUS_TONE[asset.status as AssetStatus]}>
              {LABELS.assetStatus[asset.status as AssetStatus]}
            </Badge>
          ) : null}
          {match ? <MatchBadge match={match} /> : null}
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-ink group-hover:text-brand">
        {asset.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{asset.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="brand">{asset.category.name}</Badge>
        <Badge>{LABELS.licenseType[asset.licenseType as LicenseType]}</Badge>
        <Badge tone={asset.businessStatus === "ACTIVE_BUSINESS" ? "positive" : "neutral"}>
          {LABELS.businessStatus[asset.businessStatus as BusinessStatus]}
        </Badge>
        <Badge>{asset.regulator}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-xs">
        <div>
          <p className="text-muted">Revenue</p>
          <p className="stat-value">{formatEurCompact(asset.annualRevenueEur)}</p>
        </div>
        <div>
          <p className="text-muted">EBITDA</p>
          <p className="stat-value">{formatEurCompact(asset.ebitdaEur)}</p>
        </div>
        <div>
          <p className="text-muted">Staff</p>
          <p className="stat-value">{asset.employees}</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Asking price</p>
          <p className="font-mono text-lg text-accent">{formatEur(asset.askingPriceEur)}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted">
          <Eye className="h-3.5 w-3.5" />
          {asset.views}
        </span>
      </div>
    </Link>
  );
}
