import { BuyerCard } from "@/components/buyer/buyer-card";
import { Catalogue } from "@/components/search/catalogue";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { referenceOptions } from "@/lib/domain/reference";
import { buyerSearchConfig, searchBuyers } from "@/lib/search/buyers";
import { parseFilters, type RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "Buyers | N5Deal" };

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireRole("SELLER");
  const [raw, { categories, countries }] = await Promise.all([
    searchParams,
    referenceOptions(),
  ]);

  const config = buyerSearchConfig(categories, countries);
  const filters = parseFilters(raw, config);
  const results = await searchBuyers(filters, { kind: "catalogue" });

  return (
    <Catalogue
      title="Buyers"
      subtitle="Published mandates from acquirers active on the platform. Contact details are exchanged after the buyer accepts."
      config={config}
      filters={filters}
      total={results.total}
      pageCount={results.pageCount}
    >
      {results.items.length === 0 ? (
        <EmptyState
          title="No buyers match these filters"
          description="Widen the jurisdictions or clear the deal size filter. Buyers only appear here once they publish their mandate."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.items.map((buyer) => (
            <BuyerCard key={buyer.id} buyer={buyer} href={`/buyers/${buyer.id}`} />
          ))}
        </div>
      )}
    </Catalogue>
  );
}
