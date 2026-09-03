import { notFound } from "next/navigation";
import { AssetCard } from "@/components/asset/asset-card";
import { AssetStatusActions } from "@/components/asset/asset-status-actions";
import { Catalogue } from "@/components/search/catalogue";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { referenceOptions } from "@/lib/domain/reference";
import { assetSearchConfig, searchAssets } from "@/lib/search/assets";
import { parseFilters, type RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "My listings | N5Deal" };

export default async function MyAssetsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireRole("SELLER");
  const [raw, { categories, countries }, seller] = await Promise.all([
    searchParams,
    referenceOptions(),
    prisma.sellerProfile.findUnique({ where: { userId: user.id } }),
  ]);
  if (!seller) notFound();

  const config = assetSearchConfig(categories, countries);
  const filters = parseFilters(raw, config);
  const results = await searchAssets(filters, {
    kind: "seller",
    sellerProfileId: seller.id,
  });

  return (
    <Catalogue
      title="My listings"
      subtitle="Drafts stay private until you publish them."
      config={config}
      filters={filters}
      total={results.total}
      pageCount={results.pageCount}
      action={<LinkButton href="/my-assets/new">Publish an asset</LinkButton>}
    >
      {results.items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Create your first listing. You can save it as a draft and publish once the numbers are confirmed."
          action={<LinkButton href="/my-assets/new">Publish an asset</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.items.map((asset) => (
            <div key={asset.id} className="space-y-2">
              <AssetCard asset={asset} href={`/assets/${asset.id}`} showStatus />
              <AssetStatusActions assetId={asset.id} status={asset.status} />
            </div>
          ))}
        </div>
      )}
    </Catalogue>
  );
}
