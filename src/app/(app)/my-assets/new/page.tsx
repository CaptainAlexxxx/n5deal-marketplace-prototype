import { AssetForm } from "@/components/asset/asset-form";
import { requireRole } from "@/lib/auth/guards";
import { referenceOptions } from "@/lib/domain/reference";

export const metadata = { title: "New listing | N5Deal" };

export default async function NewAssetPage() {
  await requireRole("SELLER");
  const { categories, countries, benefits } = await referenceOptions();

  return (
    <AssetForm
      categories={categories}
      countries={countries}
      benefits={benefits}
      values={{
        id: null,
        title: "",
        summary: "",
        description: "",
        categorySlug: "",
        countrySlug: "",
        licenseType: "EMI",
        regulator: "",
        businessStatus: "ACTIVE_BUSINESS",
        askingPriceEur: "",
        annualRevenueEur: "",
        ebitdaEur: "",
        employees: "",
        yearOfIssue: new Date().getFullYear(),
        benefitSlugs: [],
        status: "DRAFT",
      }}
    />
  );
}
