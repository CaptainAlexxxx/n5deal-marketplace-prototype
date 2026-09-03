import Link from "next/link";
import { redirect } from "next/navigation";
import { BuyerCard } from "@/components/buyer/buyer-card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { prisma } from "@/lib/db";
import { assetFactsFrom, buyerFactsFrom, matchAsset } from "@/lib/match";
import { assetListInclude } from "@/lib/search/assets";
import { buyerListInclude, LIVE_BUYER } from "@/lib/search/buyers";

export async function SellerDashboard({ userId }: { userId: string }) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!seller) redirect("/profile");

  const [published, drafts, pending, headline] = await Promise.all([
    prisma.asset.count({ where: { sellerId: seller.id, status: "PUBLISHED" } }),
    prisma.asset.count({ where: { sellerId: seller.id, status: "DRAFT" } }),
    prisma.contactRequest.count({ where: { targetId: userId, status: "PENDING" } }),
    prisma.asset.findFirst({
      where: { sellerId: seller.id, status: "PUBLISHED" },
      include: assetListInclude,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  // Only buyers whose ticket window covers the asking price and who target the
  // right category or jurisdiction are worth scoring.
  const buyers = headline
    ? await prisma.buyerProfile.findMany({
        where: {
          ...LIVE_BUYER,
          ticketMaxEur: { gte: headline.askingPriceEur },
          ticketMinEur: { lte: headline.askingPriceEur },
          OR: [
            { categories: { some: { categoryId: headline.categoryId } } },
            { countries: { some: { countryId: headline.countryId } } },
          ],
        },
        include: buyerListInclude,
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const facts = headline ? assetFactsFrom(headline) : null;
  const ranked = facts
    ? buyers
        .map((buyer) => ({ buyer, match: matchAsset(facts, buyerFactsFrom(buyer)) }))
        .filter(({ match }) => match.label !== "weak")
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 2)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{seller.companyName}</h1>
          <p className="mt-1 text-sm text-muted">
            Publish assets, then approach the buyers whose mandate already fits.
          </p>
        </div>
        <LinkButton href="/my-assets/new">Publish an asset</LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Published listings" value={published} />
        <Stat label="Drafts" value={drafts} hint="Not visible to buyers" />
        <Stat label="Requests to answer" value={pending} />
      </div>

      {headline ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Buyers who fit your latest listing
              </h2>
              <p className="text-sm text-muted">
                Matched against #{headline.reference} {headline.title}.
              </p>
            </div>
            <Link href="/buyers" className="text-sm text-brand hover:underline">
              Browse all buyers
            </Link>
          </div>

          {ranked.length === 0 ? (
            <EmptyState
              title="No close match right now"
              description="Nobody currently published overlaps on category, jurisdiction and ticket size. The full buyer list is still worth a look."
              action={<LinkButton href="/buyers">Browse buyers</LinkButton>}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ranked.map(({ buyer, match }) => (
                <BuyerCard
                  key={buyer.id}
                  buyer={buyer}
                  href={`/buyers/${buyer.id}`}
                  footer={
                    <div className="flex flex-wrap gap-1.5">
                      {match.reasons.map((reason) => (
                        <Badge key={reason} tone="positive">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <EmptyState
          title="No published listing yet"
          description="Publish your first asset and this page starts showing the buyers it matches."
          action={<LinkButton href="/my-assets/new">Publish an asset</LinkButton>}
        />
      )}
    </div>
  );
}
