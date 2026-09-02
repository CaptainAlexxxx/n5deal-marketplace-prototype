import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactDetails } from "@/components/contact/contact-details";
import { ContactDialog } from "@/components/contact/contact-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FactRow } from "@/components/ui/stat";
import { contactBuyerAction } from "@/app/actions/contact";
import { requireActive } from "@/lib/auth/guards";
import { canModerate, contactDetailsVisible } from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import {
  LABELS,
  type BusinessStatus,
  type ContactStatus,
  type InvestorType,
  type Timeline,
  type UserStatus,
} from "@/lib/domain/enums";
import { flagOf, formatDate, formatEur } from "@/lib/format";

export const metadata = { title: "Buyer | N5Deal" };

export default async function BuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActive();
  if (user.role === "BUYER") redirect("/profile");

  const buyer = await prisma.buyerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      categories: { include: { category: true } },
      countries: { include: { country: true } },
    },
  });
  if (!buyer) notFound();

  const visible =
    canModerate(user) || (buyer.isPublished && buyer.user.status === "ACTIVE");
  if (!visible) redirect("/buyers");

  const request =
    user.role === "SELLER"
      ? await prisma.contactRequest.findFirst({
          where: { initiatorId: user.id, buyerProfileId: buyer.id },
        })
      : null;

  const detailsUnlocked = contactDetailsVisible(
    user,
    request && {
      initiatorId: request.initiatorId,
      targetId: request.targetId,
      status: request.status as ContactStatus,
    },
  );

  return (
    <div className="space-y-6">
      <Link
        href={canModerate(user) ? "/admin/participants" : "/buyers"}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{buyer.displayName}</h1>
          <p className="mt-1 text-sm text-muted">{buyer.headline}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">
            {LABELS.investorType[buyer.investorType as InvestorType]}
          </Badge>
          <Badge tone="accent">{LABELS.timeline[buyer.timeline as Timeline]}</Badge>
          {!buyer.isPublished ? <Badge tone="warning">Unpublished</Badge> : null}
          {buyer.user.status !== "ACTIVE" ? (
            <Badge tone="danger">
              {LABELS.userStatus[buyer.user.status as UserStatus]}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Investment thesis</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">{buyer.thesis}</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Interested in</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {buyer.categories.map(({ category }) => (
                <Badge key={category.id} tone="brand">
                  {category.name}
                </Badge>
              ))}
            </div>
            <h2 className="mt-5 text-sm font-semibold text-ink">Target jurisdictions</h2>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {buyer.countries.map(({ country }) => (
                <span key={country.id} className="text-sm text-ink">
                  {flagOf(country.code)} {country.name}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Mandate" />
            <div className="px-5 py-3">
              <FactRow label="Ticket from" value={formatEur(buyer.ticketMinEur)} />
              <FactRow label="Ticket to" value={formatEur(buyer.ticketMaxEur)} />
              <FactRow
                label="Prefers"
                value={
                  buyer.preferredBusinessStatus
                    ? LABELS.businessStatus[
                        buyer.preferredBusinessStatus as BusinessStatus
                      ]
                    : "Either"
                }
              />
              <FactRow label="On platform since" value={formatDate(buyer.user.createdAt)} />
            </div>
          </Card>

          {detailsUnlocked ? (
            <ContactDetails
              name={buyer.contactName}
              email={buyer.user.email}
              phone={buyer.phone}
            />
          ) : null}

          {user.role === "SELLER" ? (
            <Card className="p-5">
              {request ? (
                <div className="text-sm">
                  <p className="text-muted">
                    Your request is{" "}
                    <span className="text-ink">
                      {LABELS.contactStatus[request.status as ContactStatus].toLowerCase()}
                    </span>
                    .
                  </p>
                  {request.responseNote ? (
                    <p className="mt-1 text-xs italic text-ink">{request.responseNote}</p>
                  ) : null}
                  <Link
                    href="/contacts"
                    className="mt-1 inline-block text-xs text-brand hover:underline"
                  >
                    Open in contacts
                  </Link>
                </div>
              ) : (
                <ContactDialog
                  action={contactBuyerAction}
                  hiddenField="buyerProfileId"
                  hiddenValue={buyer.id}
                  title={`Contact ${buyer.displayName}`}
                  description="Reference the asset you are placing and why it fits their mandate."
                  triggerLabel="Contact buyer"
                  placeholder="We are placing a Maltese EMI with live IBAN issuing at 3.4M EUR, which sits inside your stated range and matches your Malta focus."
                />
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
