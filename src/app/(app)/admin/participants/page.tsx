import { ModerationDialog } from "@/components/admin/moderation-dialog";
import { Catalogue } from "@/components/search/catalogue";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import {
  reinstateUserAction,
  removeUserAction,
  suspendUserAction,
} from "@/app/actions/moderation";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { LABELS, type Role, type UserStatus } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";
import { participantSearchConfig, searchParticipants } from "@/lib/search/participants";
import type { Participant } from "@/lib/search/participants";
import { parseFilters, type RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "Participants | N5Deal" };

const STATUS_TONE = {
  ACTIVE: "positive",
  SUSPENDED: "warning",
  REMOVED: "danger",
} as const satisfies Record<UserStatus, string>;

export default async function AdminParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireRole("MANAGER");

  const raw = await searchParams;
  const config = participantSearchConfig();
  const filters = parseFilters(raw, config);

  const [results, buyers, sellers, blocked, listings] = await Promise.all([
    searchParticipants(filters),
    prisma.user.count({ where: { role: "BUYER", status: { not: "REMOVED" } } }),
    prisma.user.count({ where: { role: "SELLER", status: { not: "REMOVED" } } }),
    prisma.user.count({ where: { status: { in: ["SUSPENDED", "REMOVED"] } } }),
    prisma.asset.count({ where: { status: "PUBLISHED" } }),
  ]);

  return (
    <Catalogue
      title="Participants"
      subtitle="Managers see every account, including suspended and removed ones."
      config={config}
      filters={filters}
      total={results.total}
      pageCount={results.pageCount}
      banner={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Buyers" value={buyers} />
          <Stat label="Sellers" value={sellers} />
          <Stat label="Blocked" value={blocked} />
          <Stat label="Live listings" value={listings} />
        </div>
      }
    >
      {results.items.length === 0 ? (
        <EmptyState
          title="No participants match these filters"
          description="Try removing the status or role filter."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {results.items.map((participant) => (
              <ParticipantRow key={participant.id} participant={participant} />
            ))}
          </ul>
        </Card>
      )}
    </Catalogue>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  const name =
    participant.buyerProfile?.displayName ??
    participant.sellerProfile?.companyName ??
    participant.email;
  const status = participant.status as UserStatus;
  const requests =
    participant._count.sentRequests + participant._count.receivedRequests;

  const removeDialog = (
    <ModerationDialog
      action={removeUserAction}
      targetId={participant.id}
      targetLabel={name}
      triggerLabel="Remove"
      title="Remove participant"
      description="A soft delete: listings are archived, open requests are closed and nothing is erased."
      confirmLabel="Remove participant"
      tone="danger"
    />
  );

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{name}</span>
            <Badge tone={STATUS_TONE[status]}>{LABELS.userStatus[status]}</Badge>
            <Badge>{LABELS.role[participant.role as Role]}</Badge>
          </div>

          <p className="mt-0.5 text-xs text-muted">{participant.email}</p>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
            {participant.sellerProfile ? (
              <span>{participant.sellerProfile._count.assets} listings</span>
            ) : null}
            {participant.buyerProfile ? (
              <span>
                Profile {participant.buyerProfile.isPublished ? "published" : "unpublished"}
              </span>
            ) : null}
            <span>{requests} contact requests</span>
            <span>Joined {formatDate(participant.createdAt)}</span>
          </div>

          {status !== "ACTIVE" && participant.suspendReason ? (
            <p className="mt-1 text-xs italic text-muted">{participant.suspendReason}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {status === "ACTIVE" ? (
            <>
              <ModerationDialog
                action={suspendUserAction}
                targetId={participant.id}
                targetLabel={name}
                triggerLabel="Suspend"
                title="Suspend participant"
                description="They drop out of the marketplace and their listings are hidden until reinstated."
                confirmLabel="Suspend participant"
                tone="secondary"
              />
              {removeDialog}
            </>
          ) : status === "SUSPENDED" ? (
            <>
              <ModerationDialog
                action={reinstateUserAction}
                targetId={participant.id}
                targetLabel={name}
                triggerLabel="Reinstate"
                title="Reinstate participant"
                description="The account goes back to active with its listings exactly as they were."
                confirmLabel="Reinstate participant"
                tone="primary"
              />
              {removeDialog}
            </>
          ) : (
            <span className="text-xs text-muted">Removed</span>
          )}
        </div>
      </div>
    </li>
  );
}
