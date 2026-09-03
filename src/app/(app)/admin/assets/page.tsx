import { ModerationDialog } from "@/components/admin/moderation-dialog";
import { AssetCard } from "@/components/asset/asset-card";
import { Catalogue } from "@/components/search/catalogue";
import { EmptyState } from "@/components/ui/empty-state";
import { reinstateAssetAction, suspendAssetAction } from "@/app/actions/moderation";
import { requireRole } from "@/lib/auth/guards";
import { LABELS, type AssetStatus } from "@/lib/domain/enums";
import { referenceOptions } from "@/lib/domain/reference";
import { assetSearchConfig, searchAssets } from "@/lib/search/assets";
import { parseFilters, type RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "All assets | N5Deal" };

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireRole("MANAGER");

  const [raw, { categories, countries }] = await Promise.all([
    searchParams,
    referenceOptions(),
  ]);

  const config = assetSearchConfig(categories, countries);
  const filters = parseFilters(raw, config);
  const results = await searchAssets(filters, { kind: "manager" });

  return (
    <Catalogue
      title="All assets"
      subtitle="Includes drafts, archived listings and assets belonging to suspended sellers."
      config={config}
      filters={filters}
      total={results.total}
      pageCount={results.pageCount}
    >
      {results.items.length === 0 ? (
        <EmptyState
          title="No assets match these filters"
          description="Try widening the jurisdiction list or removing the price range."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.items.map((asset) => {
            const status = asset.status as AssetStatus;
            const sellerName = asset.seller.companyName;

            return (
              <div key={asset.id} className="space-y-2">
                <AssetCard asset={asset} href={`/assets/${asset.id}`} showStatus />

                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-muted">{sellerName}</span>
                  {status === "PUBLISHED" ? (
                    <ModerationDialog
                      action={suspendAssetAction}
                      targetId={asset.id}
                      targetLabel={`#${asset.reference} ${asset.title}`}
                      triggerLabel="Suspend listing"
                      title="Suspend listing"
                      description="It will be hidden from the public catalogue until a manager reinstates it."
                      confirmLabel="Suspend listing"
                      tone="secondary"
                    />
                  ) : status === "SUSPENDED" ? (
                    <ModerationDialog
                      action={reinstateAssetAction}
                      targetId={asset.id}
                      targetLabel={`#${asset.reference} ${asset.title}`}
                      triggerLabel="Publish again"
                      title="Reinstate listing"
                      description="It goes back into the public catalogue immediately."
                      confirmLabel="Publish again"
                      tone="primary"
                    />
                  ) : (
                    <span className="text-xs text-muted">
                      {LABELS.assetStatus[status]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Catalogue>
  );
}
