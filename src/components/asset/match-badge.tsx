import { Badge } from "@/components/ui/badge";
import type { MatchResult } from "@/lib/match";

const TONES = { strong: "positive", partial: "accent", weak: "neutral" } as const;
const TITLES = { strong: "Strong fit", partial: "Partial fit", weak: "Low fit" } as const;

export function MatchBadge({ match }: { match: MatchResult }) {
  if (match.label === "weak") return null;
  return (
    <Badge tone={TONES[match.label]} className="cursor-help">
      <span title={match.reasons.join(", ")}>
        {TITLES[match.label]} {match.score}%
      </span>
    </Badge>
  );
}

export function MatchBreakdown({ match }: { match: MatchResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${match.score}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink">{match.score}%</span>
      </div>
      <ul className="space-y-1 text-xs">
        {match.reasons.map((reason) => (
          <li key={reason} className="text-positive">
            + {reason}
          </li>
        ))}
        {match.misses.map((miss) => (
          <li key={miss} className="text-muted">
            - {miss}
          </li>
        ))}
      </ul>
    </div>
  );
}
