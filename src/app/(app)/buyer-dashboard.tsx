import Link from "next/link";
import { AssetCard } from "@/components/asset/asset-card";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { prisma } from "@/lib/db";
import { assetFactsFrom, buyerFactsFrom, matchAsset } from "@/lib/match";
import { assetListInclude, LIVE_ASSET } from "@/lib/search/assets";
import { buyerMandateInclude } from "@/lib/search/buyers";

/** How many listings get scored before the top four are shown. */
const CANDIDATES = 40;

export async function BuyerDashboard({ userId }: { userId: string }) {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
    include: buyerMandateInclude,
  });
  const facts = profile ? buyerFactsFrom(profile) : null;

  // Narrow to listings that overlap the mandate on at least one axis first, so
  // recency does not hide a strong match further down the catalogue.
  const overlaps =
    facts && (facts.categorySlugs.length || facts.countrySlugs.length)
      ? [
          ...(facts.categorySlugs.length
            ? [{ category: { slug: { in: facts.categorySlugs } } }]
            : []),
          ...(facts.countrySlugs.length
            ? [{ country: { slug: { in: facts.countrySlugs } } }]
            : []),
        ]
      : null;

  const [available, sent, accepted, candidates] = await Promise.all([
    prisma.asset.count({ where: LIVE_ASSET }),
    prisma.contactRequest.count({ where: { initiatorId: userId, status: "PENDING" } }),
    prisma.contactRequest.count({ where: { initiatorId: userId, status: "ACCEPTED" } }),
    prisma.asset.findMany({
      where: overlaps ? { ...LIVE_ASSET, OR: overlaps } : LIVE_ASSET,
      include: assetListInclude,
      orderBy: { publishedAt: "desc" },
      take: CANDIDATES,
    }),
  ]);

  const scored = facts
    ? candidates
        .map((asset) => ({ asset, match: matchAsset(assetFactsFrom(asset), facts) }))
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {profile?.displayName ?? "Welcome"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ranked against the mandate on your profile.
        </p>
      </div>

      {profile && !profile.isPublished ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-warning/40 bg-warning/10 p-5">
          <div>
            <p className="text-sm font-medium text-ink">Your profile is not published</p>
            <p className="mt-1 text-sm text-muted">
              Sellers cannot find you and you cannot start a conversation until it is live.
            </p>
          </div>
          <LinkButton href="/profile">Complete profile</LinkButton>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Assets available" value={available} />
        <Stat label="Awaiting a reply" value={sent} hint="Requests you sent" />
        <Stat
          label="Open conversations"
          value={accepted}
          hint="Contact details exchanged"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold text-ink">Closest to your mandate</h2>
          <Link href="/assets" className="text-sm text-brand hover:underline">
            Browse all assets
          </Link>
        </div>

        {scored.length === 0 ? (
          <EmptyState
            title="Nothing to score yet"
            description="Add your categories, jurisdictions and ticket range and listings get ranked against them."
            action={<LinkButton href="/profile">Edit profile</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scored.map(({ asset, match }) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                href={`/assets/${asset.id}`}
                match={match}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
