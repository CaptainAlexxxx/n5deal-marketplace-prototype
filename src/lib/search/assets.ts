import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BUSINESS_STATUSES, LABELS, LICENSE_TYPES } from "@/lib/domain/enums";
import {
  MAX_INT,
  PAGE_SIZE,
  type Option,
  type ParsedFilters,
  type SearchConfig,
} from "./params";

/** What a signed-in buyer is allowed to see in the catalogue. */
export const LIVE_ASSET: Prisma.AssetWhereInput = {
  status: "PUBLISHED",
  seller: { user: { status: "ACTIVE" } },
};

export function assetSearchConfig(
  categories: Option[],
  countries: Option[],
): SearchConfig {
  return {
    searchPlaceholder: "Search by title, regulator or listing number",
    facets: [
      { kind: "multi", key: "category", label: "Business category", options: categories },
      {
        kind: "multi",
        key: "country",
        label: "Jurisdiction",
        options: countries,
        collapsedAfter: 8,
      },
      {
        kind: "multi",
        key: "license",
        label: "Licence type",
        options: LICENSE_TYPES.values.map((v) => ({
          value: v,
          label: LABELS.licenseType[v],
        })),
        collapsedAfter: 6,
      },
      {
        kind: "multi",
        key: "state",
        label: "Business status",
        options: BUSINESS_STATUSES.values.map((v) => ({
          value: v,
          label: LABELS.businessStatus[v],
        })),
      },
      {
        kind: "range",
        key: "price",
        label: "Asking price",
        placeholderMin: "From",
        placeholderMax: "To",
      },
      {
        kind: "range",
        key: "revenue",
        label: "Annual revenue",
        placeholderMin: "From",
        placeholderMax: "To",
      },
    ],
    sorts: [
      { value: "newest", label: "Newest listings" },
      { value: "popular", label: "Most viewed" },
      { value: "price_asc", label: "Price: low to high" },
      { value: "price_desc", label: "Price: high to low" },
    ],
    defaultSort: "newest",
  };
}

const ORDER: Record<string, Prisma.AssetOrderByWithRelationInput> = {
  newest: { publishedAt: "desc" },
  popular: { views: "desc" },
  price_asc: { askingPriceEur: "asc" },
  price_desc: { askingPriceEur: "desc" },
};

export const assetListInclude = {
  category: true,
  country: true,
  benefits: { include: { benefit: true } },
  seller: { select: { id: true, companyName: true, user: { select: { status: true } } } },
} satisfies Prisma.AssetInclude;

export type AssetListItem = Prisma.AssetGetPayload<{ include: typeof assetListInclude }>;

/**
 * The manager scope deliberately carries no status filter: drafts, archived
 * listings and assets of suspended sellers all have to be visible to moderation.
 */
export type AssetScope =
  | { kind: "catalogue" }
  | { kind: "seller"; sellerProfileId: string }
  | { kind: "manager" };

function assetWhere(filters: ParsedFilters, scope: AssetScope): Prisma.AssetWhereInput {
  const and: Prisma.AssetWhereInput[] = [];

  if (scope.kind === "catalogue") {
    and.push(LIVE_ASSET);
  } else if (scope.kind === "seller") {
    and.push({ sellerId: scope.sellerProfileId });
  }

  if (filters.q) {
    // SQLite LIKE is case-insensitive for ASCII, so Prisma's `mode: "insensitive"`
    // is neither needed nor supported here.
    const digits = /^#?(\d+)$/.exec(filters.q);
    const reference = digits ? Number(digits[1]) : null;
    and.push({
      OR: [
        { title: { contains: filters.q } },
        { summary: { contains: filters.q } },
        { description: { contains: filters.q } },
        { regulator: { contains: filters.q } },
        { seller: { companyName: { contains: filters.q } } },
        ...(reference !== null && reference <= MAX_INT ? [{ reference }] : []),
      ],
    });
  }

  const categories = filters.multi.category ?? [];
  if (categories.length) and.push({ category: { slug: { in: categories } } });

  const countries = filters.multi.country ?? [];
  if (countries.length) and.push({ country: { slug: { in: countries } } });

  const licenses = filters.multi.license ?? [];
  if (licenses.length) and.push({ licenseType: { in: licenses } });

  const states = filters.multi.state ?? [];
  if (states.length) and.push({ businessStatus: { in: states } });

  const price = filters.range.price;
  if (price && (price.min !== null || price.max !== null)) {
    and.push({
      askingPriceEur: {
        ...(price.min !== null ? { gte: price.min } : {}),
        ...(price.max !== null ? { lte: price.max } : {}),
      },
    });
  }

  const revenue = filters.range.revenue;
  if (revenue && (revenue.min !== null || revenue.max !== null)) {
    const bounded: Prisma.AssetWhereInput = {
      annualRevenueEur: {
        ...(revenue.min !== null ? { gte: revenue.min } : {}),
        ...(revenue.max !== null ? { lte: revenue.max } : {}),
      },
    };
    // A ceiling alone should not hide licences that report no revenue at all.
    and.push(
      revenue.min === null
        ? { OR: [bounded, { annualRevenueEur: null }] }
        : bounded,
    );
  }

  return and.length ? { AND: and } : {};
}

export async function searchAssets(filters: ParsedFilters, scope: AssetScope) {
  const where = assetWhere(filters, scope);
  const skip = (filters.page - 1) * PAGE_SIZE;

  // Drafts have no publishedAt and SQLite sorts NULLs last, which would bury a
  // seller's newest draft at the bottom of their own list.
  const newest: Prisma.AssetOrderByWithRelationInput =
    scope.kind === "seller" ? { createdAt: "desc" } : ORDER.newest;

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: assetListInclude,
      orderBy: [
        filters.sort === "newest" ? newest : (ORDER[filters.sort] ?? newest),
        { reference: "desc" },
      ],
      skip,
      take: PAGE_SIZE,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
