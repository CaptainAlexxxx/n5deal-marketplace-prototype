import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { prisma } from "@/lib/db";
import { LABELS, type ModerationActionKind } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";

export async function ManagerOverview() {
  const [buyers, sellers, assets, blocked, pending, log] = await Promise.all([
    prisma.user.count({ where: { role: "BUYER", status: { not: "REMOVED" } } }),
    prisma.user.count({ where: { role: "SELLER", status: { not: "REMOVED" } } }),
    prisma.asset.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { status: { in: ["SUSPENDED", "REMOVED"] } } }),
    prisma.contactRequest.count({ where: { status: "PENDING" } }),
    prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { actor: { select: { email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Platform overview</h1>
        <p className="mt-1 text-sm text-muted">Read access plus moderation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Buyers" value={buyers} />
        <Stat label="Sellers" value={sellers} />
        <Stat label="Published assets" value={assets} />
        <Stat label="Blocked accounts" value={blocked} />
        <Stat label="Open requests" value={pending} />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent moderation</h2>
          <Link href="/admin/log" className="text-sm text-brand hover:underline">
            Full log
          </Link>
        </div>

        {log.length === 0 ? (
          <EmptyState title="Nothing moderated yet" />
        ) : (
          <Card className="divide-y divide-line">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink">{entry.targetLabel}</p>
                  <p className="mt-0.5 text-xs text-muted">{entry.reason}</p>
                </div>
                <div className="text-right">
                  <Badge tone="warning">
                    {LABELS.moderationAction[entry.action as ModerationActionKind]}
                  </Badge>
                  <p className="mt-1 text-xs text-muted">{formatDate(entry.createdAt)}</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
