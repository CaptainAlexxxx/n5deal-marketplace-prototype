import { notFound, redirect } from "next/navigation";
import { AssetForm } from "@/components/asset/asset-form";
import { requireRole } from "@/lib/auth/guards";
import { canEditAsset } from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import { referenceOptions } from "@/lib/domain/reference";
import type { RawSearchParams } from "@/lib/search/params";

export const metadata = { title: "Edit listing | N5Deal" };

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await requireRole("SELLER");
  const [{ id }, query, { categories, countries, benefits }] = await Promise.all([
    params,
    searchParams,
    referenceOptions(),
  ]);

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      country: true,
      benefits: { include: { benefit: true } },
      seller: { select: { userId: true } },
    },
  });
  if (!asset) notFound();
  if (!canEditAsset(user, { sellerUserId: asset.seller.userId })) redirect("/my-assets");

  return (
    <AssetForm
      categories={categories}
      countries={countries}
      benefits={benefits}
      savedNotice={query.saved === "1"}
      values={{
        id: asset.id,
        title: asset.title,
        summary: asset.summary,
        description: asset.description,
        categorySlug: asset.category.slug,
        countrySlug: asset.country.slug,
        licenseType: asset.licenseType,
        regulator: asset.regulator,
        businessStatus: asset.businessStatus,
        askingPriceEur: asset.askingPriceEur,
        annualRevenueEur: asset.annualRevenueEur ?? "",
        ebitdaEur: asset.ebitdaEur ?? "",
        employees: asset.employees,
        yearOfIssue: asset.yearOfIssue,
        benefitSlugs: asset.benefits.map((b) => b.benefit.slug),
        status: asset.status,
      }}
    />
  );
}
