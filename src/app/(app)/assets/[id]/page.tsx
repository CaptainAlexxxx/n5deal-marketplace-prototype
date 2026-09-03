import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactDetails } from "@/components/contact/contact-details";
import { ContactDialog } from "@/components/contact/contact-dialog";
import { MatchBreakdown } from "@/components/asset/match-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FactRow } from "@/components/ui/stat";
import { contactSellerAction } from "@/app/actions/contact";
import { requireActive } from "@/lib/auth/guards";
import { canViewAsset, contactDetailsVisible } from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import {
  LABELS,
  type AssetStatus,
  type BusinessStatus,
  type ContactStatus,
  type LicenseType,
  type UserStatus,
} from "@/lib/domain/enums";
import { flagOf, formatDate, formatEur } from "@/lib/format";
import { assetFactsFrom, buyerFactsFrom, matchAsset } from "@/lib/match";
import { buyerMandateInclude } from "@/lib/search/buyers";

export const metadata = { title: "Asset | N5Deal" };

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActive();

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      country: true,
      benefits: { include: { benefit: true } },
      seller: { include: { user: { select: { id: true, email: true, status: true } } } },
    },
  });
  if (!asset) notFound();

  const view = {
    status: asset.status as AssetStatus,
    sellerUserId: asset.seller.userId,
    sellerStatus: asset.seller.user.status as UserStatus,
  };
  if (!canViewAsset(user, view)) redirect("/");

  const isBuyer = user.role === "BUYER";

  const [profile, request] = await Promise.all([
    isBuyer
      ? prisma.buyerProfile.findUnique({
          where: { userId: user.id },
          include: buyerMandateInclude,
        })
      : null,
    isBuyer
      ? prisma.contactRequest.findFirst({
          where: { initiatorId: user.id, assetId: asset.id },
        })
      : null,
  ]);

  if (isBuyer) {
    // Counted after the response is sent, so the page render stays read-only.
    after(() =>
      prisma.asset.update({ where: { id: asset.id }, data: { views: { increment: 1 } } }),
    );
  }

  const match = profile
    ? matchAsset(assetFactsFrom(asset), buyerFactsFrom(profile))
    : null;

  const detailsUnlocked = contactDetailsVisible(
    user,
    request && {
      initiatorId: request.initiatorId,
      targetId: request.targetId,
      status: request.status as ContactStatus,
    },
  );

  const backHref = user.role === "SELLER" ? "/my-assets" : isBuyer ? "/assets" : "/admin/assets";

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-mono">#{asset.reference}</span>
            <span>
              {flagOf(asset.country.code)} {asset.country.name}
            </span>
            <span>Listed {formatDate(asset.publishedAt ?? asset.createdAt)}</span>
            <span>{asset.views} views</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{asset.title}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="brand">{asset.category.name}</Badge>
            <Badge>{LABELS.licenseType[asset.licenseType as LicenseType]}</Badge>
            <Badge tone={asset.businessStatus === "ACTIVE_BUSINESS" ? "positive" : "neutral"}>
              {LABELS.businessStatus[asset.businessStatus as BusinessStatus]}
            </Badge>
            <Badge>{asset.regulator}</Badge>
            {asset.status !== "PUBLISHED" ? (
              <Badge tone="warning">{LABELS.assetStatus[asset.status as AssetStatus]}</Badge>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted">Asking price</p>
          <p className="font-mono text-3xl text-accent">{formatEur(asset.askingPriceEur)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">About this asset</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/85">
              {asset.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Card>

          {asset.benefits.length ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">What is included</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {asset.benefits.map(({ benefit }) => (
                  <Badge key={benefit.id} tone="accent">
                    {benefit.name}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Key facts" />
            <div className="px-5 py-3">
              <FactRow label="Jurisdiction" value={asset.country.name} />
              <FactRow label="Regulator" value={asset.regulator} />
              <FactRow label="Licence since" value={asset.yearOfIssue} />
              <FactRow label="Employees" value={asset.employees} />
              <FactRow label="Annual revenue" value={formatEur(asset.annualRevenueEur)} />
              <FactRow label="EBITDA" value={formatEur(asset.ebitdaEur)} />
            </div>
          </Card>

          {match ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">Fit with your mandate</h2>
              <p className="mb-3 mt-1 text-xs text-muted">
                Scored from the interests on your profile.
              </p>
              <MatchBreakdown match={match} />
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Seller</h2>
            <p className="mt-1 text-sm text-ink">{asset.seller.companyName}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{asset.seller.about}</p>

            {detailsUnlocked ? (
              <ContactDetails
                name={asset.seller.contactName}
                email={asset.seller.user.email}
                phone={asset.seller.phone}
                website={asset.seller.website}
              />
            ) : null}

            {isBuyer ? (
              <div className="mt-4">
                {request ? (
                  <div className="rounded-lg border border-line bg-elevated px-3 py-2 text-sm">
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
                    <Link href="/contacts" className="mt-1 inline-block text-xs text-brand hover:underline">
                      Open in contacts
                    </Link>
                  </div>
                ) : (
                  <ContactDialog
                    action={contactSellerAction}
                    hiddenField="assetId"
                    hiddenValue={asset.id}
                    title={`Contact ${asset.seller.companyName}`}
                    description="Say who you are and what you want to know. The seller decides whether to open the conversation."
                    triggerLabel="Contact seller"
                    placeholder="We are a strategic acquirer in payroll and would like to understand the compliance team and the change of control timeline."
                    disabledReason={
                      profile?.isPublished
                        ? undefined
                        : "Publish your buyer profile before contacting sellers."
                    }
                  />
                )}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
