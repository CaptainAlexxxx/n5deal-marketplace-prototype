import Link from "next/link";
import { ContactDetails } from "@/components/contact/contact-details";
import { RespondForm } from "@/components/contact/respond-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireActive } from "@/lib/auth/guards";
import { contactDetailsVisible } from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import { contactDetailsOf, contactPartySelect, displayNameOf } from "@/lib/contacts";
import { LABELS, type ContactStatus } from "@/lib/domain/enums";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "Contacts | N5Deal" };

const STATUS_TONE = {
  PENDING: "warning",
  ACCEPTED: "positive",
  DECLINED: "neutral",
  CLOSED: "danger",
} as const satisfies Record<ContactStatus, string>;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireActive();
  const query = await searchParams;
  const tab = query.tab === "sent" ? "sent" : "received";

  const requests = await prisma.contactRequest.findMany({
    where: tab === "sent" ? { initiatorId: user.id } : { targetId: user.id },
    include: {
      initiator: contactPartySelect,
      target: contactPartySelect,
      asset: { select: { id: true, reference: true, title: true } },
      buyerProfile: { select: { id: true, displayName: true } },
    },
    // respondedAt is null while a request is open and SQLite sorts NULLs first,
    // so anything still waiting for an answer stays at the top.
    orderBy: [{ respondedAt: "asc" }, { createdAt: "desc" }],
  });

  const pendingCount = await prisma.contactRequest.count({
    where: { targetId: user.id, status: "PENDING" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Contacts</h1>
        <p className="mt-1 text-sm text-muted">
          Names and phone numbers are exchanged only after the receiving side accepts.
        </p>
      </div>

      <div className="flex gap-2">
        <TabLink href="/contacts" label="Received" active={tab === "received"} count={pendingCount} />
        <TabLink href="/contacts?tab=sent" label="Sent" active={tab === "sent"} />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title={tab === "sent" ? "You have not contacted anyone yet" : "No requests received"}
          description={
            tab === "sent"
              ? "Open a listing or a buyer profile and send a first message."
              : "When someone approaches you, their message lands here before any details are shared."
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const counterpart = tab === "sent" ? request.target : request.initiator;
            const status = request.status as ContactStatus;
            const unlocked = contactDetailsVisible(user, {
              initiatorId: request.initiatorId,
              targetId: request.targetId,
              status,
            });

            return (
              <Card key={request.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {displayNameOf(counterpart)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {request.asset ? (
                        <>
                          About{" "}
                          <Link
                            href={`/assets/${request.asset.id}`}
                            className="text-brand hover:underline"
                          >
                            #{request.asset.reference} {request.asset.title}
                          </Link>
                        </>
                      ) : request.buyerProfile ? (
                        <>About the buyer mandate {request.buyerProfile.displayName}</>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{formatDate(request.createdAt)}</span>
                    <Badge tone={STATUS_TONE[status]}>{LABELS.contactStatus[status]}</Badge>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-ink/85">
                  {request.message}
                </p>

                {request.responseNote ? (
                  <p className="mt-2 border-l-2 border-line pl-3 text-xs italic text-muted">
                    {request.responseNote}
                  </p>
                ) : null}

                {unlocked ? <ContactDetails {...contactDetailsOf(counterpart)} /> : null}

                {tab === "received" && status === "PENDING" ? (
                  <div className="mt-4">
                    <RespondForm requestId={request.id} />
                  </div>
                ) : null}

                {status === "CLOSED" ? (
                  <p className="mt-3 text-xs text-danger">
                    Closed because one of the parties was removed from the platform.
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
  count,
}: {
  href: string;
  label: string;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-brand/50 bg-brand/10 text-ink"
          : "border-line text-muted hover:text-ink",
      )}
    >
      {label}
      {count ? (
        <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-ink">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
