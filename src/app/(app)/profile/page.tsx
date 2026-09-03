import { redirect } from "next/navigation";
import { requireActive } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { referenceOptions } from "@/lib/domain/reference";
import { buyerMandateInclude } from "@/lib/search/buyers";
import { BuyerProfileForm } from "./buyer-profile-form";
import { SellerProfileForm } from "./seller-profile-form";

export const metadata = { title: "Profile | N5Deal" };

export default async function ProfilePage() {
  const user = await requireActive();
  if (user.role === "MANAGER") redirect("/");

  if (user.role === "SELLER") {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) redirect("/");
    return (
      <SellerProfileForm
        values={{
          companyName: profile.companyName,
          about: profile.about,
          website: profile.website,
          contactName: profile.contactName,
          phone: profile.phone,
        }}
      />
    );
  }

  const [profile, { categories, countries }] = await Promise.all([
    prisma.buyerProfile.findUnique({
      where: { userId: user.id },
      include: buyerMandateInclude,
    }),
    referenceOptions(),
  ]);
  if (!profile) redirect("/");

  return (
    <BuyerProfileForm
      categories={categories}
      countries={countries}
      values={{
        displayName: profile.displayName,
        headline: profile.headline,
        thesis: profile.thesis,
        investorType: profile.investorType,
        timeline: profile.timeline,
        ticketMinEur: profile.ticketMinEur,
        ticketMaxEur: profile.ticketMaxEur,
        preferredBusinessStatus: profile.preferredBusinessStatus,
        contactName: profile.contactName,
        phone: profile.phone,
        isPublished: profile.isPublished,
        categorySlugs: profile.categories.map((c) => c.category.slug),
        countrySlugs: profile.countries.map((c) => c.country.slug),
      }}
    />
  );
}
