import Link from "next/link";
import { AssetCard } from "@/components/asset/asset-card";
import { Catalogue } from "@/components/search/catalogue";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { referenceOptions } from "@/lib/domain/reference";
import { assetFactsFrom, buyerFactsFrom, matchAsset } from "@/lib/match";
import { assetSearchConfig, searchAssets } from "@/lib/search/assets";
import { buyerMandateInclude } from "@/lib/search/buyers";
import { parseFilters, type RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "Assets | N5Deal" };

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireRole("BUYER");
  const [raw, { categories, countries }] = await Promise.all([
    searchParams,
    referenceOptions(),
  ]);

  const config = assetSearchConfig(categories, countries);
  const filters = parseFilters(raw, config);

  const [results, profile] = await Promise.all([
    searchAssets(filters, { kind: "catalogue" }),
    prisma.buyerProfile.findUnique({
      where: { userId: user.id },
      include: buyerMandateInclude,
    }),
  ]);

  const facts = profile ? buyerFactsFrom(profile) : null;

  return (
    <Catalogue
      title="Available assets"
      subtitle="Licensed entities and operating businesses listed by verified sellers."
      config={config}
      filters={filters}
      total={results.total}
      pageCount={results.pageCount}
      banner={
        profile && !profile.isPublished ? (
          <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink">
            Your buyer profile is not published yet, so sellers cannot see you and you
            cannot start a conversation.{" "}
            <Link href="/profile" className="font-medium text-warning hover:underline">
              Complete your profile
            </Link>
          </div>
        ) : null
      }
    >
      {results.items.length === 0 ? (
        <EmptyState
          title="No assets match these filters"
          description="Try widening the jurisdiction list or removing the price range."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.items.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              href={`/assets/${asset.id}`}
              match={facts ? matchAsset(assetFactsFrom(asset), facts) : undefined}
            />
          ))}
        </div>
      )}
    </Catalogue>
  );
}
