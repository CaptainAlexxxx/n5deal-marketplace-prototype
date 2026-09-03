import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { LABELS, type ModerationActionKind } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Moderation log | N5Deal" };

const ACTION_TONE = {
  SUSPEND_USER: "warning",
  REINSTATE_USER: "positive",
  REMOVE_USER: "danger",
  SUSPEND_ASSET: "warning",
  REINSTATE_ASSET: "positive",
} as const satisfies Record<ModerationActionKind, "warning" | "positive" | "danger">;

export default async function AdminLogPage() {
  await requireRole("MANAGER");

  const entries = await prisma.moderationAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Moderation log</h1>
        <p className="mt-1 text-sm text-muted">Every moderation action, newest first.</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No moderation actions yet"
          description="Actions appear here as soon as a manager suspends, reinstates or removes a participant or listing."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {entries.map((entry) => {
              const action = entry.action as ModerationActionKind;
              return (
                <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={ACTION_TONE[action]}>
                        {LABELS.moderationAction[action]}
                      </Badge>
                      <span className="text-sm font-medium text-ink">{entry.targetLabel}</span>
                    </div>
                    <p className="text-xs text-muted">{entry.reason}</p>
                  </div>

                  <div className="shrink-0 text-right text-xs text-muted">
                    <p>{formatDate(entry.createdAt)}</p>
                    <p>{entry.actor.email}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
