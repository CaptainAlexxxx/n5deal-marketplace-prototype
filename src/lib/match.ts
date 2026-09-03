// Fit score between a listed asset and a buyer mandate. Every point traces to a
// field one of the two sides filled in, and the reasons are returned so the UI
// can show the arithmetic.

const WEIGHTS = { category: 35, country: 25, budget: 30, state: 10 };

type AssetFacts = {
  categorySlug: string;
  categoryName: string;
  countrySlug: string;
  countryName: string;
  askingPriceEur: number;
  businessStatus: string;
};

export type BuyerFacts = {
  categorySlugs: string[];
  countrySlugs: string[];
  ticketMinEur: number;
  ticketMaxEur: number;
  preferredBusinessStatus: string | null;
};

export type MatchResult = {
  score: number;
  reasons: string[];
  misses: string[];
  label: "strong" | "partial" | "weak";
};

/** Structural shapes, so this module stays free of Prisma types. */
export function assetFactsFrom(asset: {
  category: { slug: string; name: string };
  country: { slug: string; name: string };
  askingPriceEur: number;
  businessStatus: string;
}): AssetFacts {
  return {
    categorySlug: asset.category.slug,
    categoryName: asset.category.name,
    countrySlug: asset.country.slug,
    countryName: asset.country.name,
    askingPriceEur: asset.askingPriceEur,
    businessStatus: asset.businessStatus,
  };
}

export function buyerFactsFrom(profile: {
  categories: { category: { slug: string } }[];
  countries: { country: { slug: string } }[];
  ticketMinEur: number;
  ticketMaxEur: number;
  preferredBusinessStatus: string | null;
}): BuyerFacts {
  return {
    categorySlugs: profile.categories.map((c) => c.category.slug),
    countrySlugs: profile.countries.map((c) => c.country.slug),
    ticketMinEur: profile.ticketMinEur,
    ticketMaxEur: profile.ticketMaxEur,
    preferredBusinessStatus: profile.preferredBusinessStatus,
  };
}

export function matchAsset(asset: AssetFacts, buyer: BuyerFacts): MatchResult {
  const reasons: string[] = [];
  const misses: string[] = [];
  let score = 0;

  if (buyer.categorySlugs.includes(asset.categorySlug)) {
    score += WEIGHTS.category;
    reasons.push(`Targets ${asset.categoryName.toLowerCase()} assets`);
  } else if (buyer.categorySlugs.length) {
    misses.push("Different business category");
  }

  if (buyer.countrySlugs.includes(asset.countrySlug)) {
    score += WEIGHTS.country;
    reasons.push(`Looking in ${asset.countryName}`);
  } else if (buyer.countrySlugs.length) {
    misses.push("Outside their target jurisdictions");
  }

  const budgetSet = buyer.ticketMaxEur > 0;
  if (
    budgetSet &&
    asset.askingPriceEur >= buyer.ticketMinEur &&
    asset.askingPriceEur <= buyer.ticketMaxEur
  ) {
    score += WEIGHTS.budget;
    reasons.push("Asking price sits inside their ticket range");
  } else if (budgetSet) {
    misses.push(
      asset.askingPriceEur > buyer.ticketMaxEur
        ? "Above their ticket range"
        : "Below their ticket range",
    );
  }

  if (!buyer.preferredBusinessStatus) {
    score += WEIGHTS.state;
  } else if (buyer.preferredBusinessStatus === asset.businessStatus) {
    score += WEIGHTS.state;
    reasons.push(
      asset.businessStatus === "ACTIVE_BUSINESS"
        ? "Wants a trading business"
        : "Wants a licence without operations",
    );
  } else {
    misses.push("Prefers a different kind of entity");
  }

  return {
    score,
    reasons,
    misses,
    label: score >= 75 ? "strong" : score >= 45 ? "partial" : "weak",
  };
}
