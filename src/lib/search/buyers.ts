import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BUSINESS_STATUSES, INVESTOR_TYPES, LABELS, TIMELINES } from "@/lib/domain/enums";
import {
  PAGE_SIZE,
  type Option,
  type ParsedFilters,
  type SearchConfig,
} from "./params";

export function buyerSearchConfig(
  categories: Option[],
  countries: Option[],
): SearchConfig {
  return {
    searchPlaceholder: "Search buyers by name, headline or investment thesis",
    facets: [
      { kind: "multi", key: "category", label: "Interested in", options: categories },
      {
        kind: "multi",
        key: "country",
        label: "Target jurisdiction",
        options: countries,
        collapsedAfter: 8,
      },
      {
        kind: "multi",
        key: "investor",
        label: "Investor type",
        options: INVESTOR_TYPES.values.map((v) => ({
          value: v,
          label: LABELS.investorType[v],
        })),
      },
      {
        kind: "multi",
        key: "timeline",
        label: "Readiness",
        options: TIMELINES.values.map((v) => ({ value: v, label: LABELS.timeline[v] })),
      },
      {
        kind: "multi",
        key: "state",
        label: "Prefers",
        options: BUSINESS_STATUSES.values.map((v) => ({
          value: v,
          label: LABELS.businessStatus[v],
        })),
      },
      {
        kind: "range",
        key: "ticket",
        label: "Deal size they can cover",
        placeholderMin: "Your asset from",
        placeholderMax: "to",
      },
    ],
    sorts: [
      { value: "newest", label: "Newest profiles" },
      { value: "ticket_desc", label: "Largest ticket" },
      { value: "ticket_asc", label: "Smallest ticket" },
      { value: "name", label: "Name A-Z" },
    ],
    defaultSort: "newest",
  };
}

const ORDER: Record<string, Prisma.BuyerProfileOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  ticket_desc: { ticketMaxEur: "desc" },
  ticket_asc: { ticketMinEur: "asc" },
  name: { displayName: "asc" },
};

/** The mandate itself: what fit scoring and the profile editor both need. */
export const buyerMandateInclude = {
  categories: { include: { category: true } },
  countries: { include: { country: true } },
} satisfies Prisma.BuyerProfileInclude;

export const buyerListInclude = {
  ...buyerMandateInclude,
  user: { select: { id: true, email: true, status: true } },
} satisfies Prisma.BuyerProfileInclude;

export type BuyerListItem = Prisma.BuyerProfileGetPayload<{
  include: typeof buyerListInclude;
}>;

/** What a signed-in seller is allowed to see in the buyer catalogue. */
export const LIVE_BUYER: Prisma.BuyerProfileWhereInput = {
  isPublished: true,
  user: { status: "ACTIVE" },
};

export type BuyerScope = { kind: "catalogue" } | { kind: "manager" };

function buyerWhere(
  filters: ParsedFilters,
  scope: BuyerScope,
): Prisma.BuyerProfileWhereInput {
  const and: Prisma.BuyerProfileWhereInput[] = [];

  if (scope.kind === "catalogue") {
    and.push(LIVE_BUYER);
  }

  if (filters.q) {
    and.push({
      OR: [
        { displayName: { contains: filters.q } },
        { headline: { contains: filters.q } },
        { thesis: { contains: filters.q } },
        ...(scope.kind === "manager"
          ? [{ user: { email: { contains: filters.q } } }]
          : []),
      ],
    });
  }

  const categories = filters.multi.category ?? [];
  if (categories.length) {
    and.push({ categories: { some: { category: { slug: { in: categories } } } } });
  }

  const countries = filters.multi.country ?? [];
  if (countries.length) {
    and.push({ countries: { some: { country: { slug: { in: countries } } } } });
  }

  const investors = filters.multi.investor ?? [];
  if (investors.length) and.push({ investorType: { in: investors } });

  const timelines = filters.multi.timeline ?? [];
  if (timelines.length) and.push({ timeline: { in: timelines } });

  const states = filters.multi.state ?? [];
  if (states.length) {
    // A buyer with no stated preference is open to both, so they stay in.
    and.push({
      OR: [{ preferredBusinessStatus: { in: states } }, { preferredBusinessStatus: null }],
    });
  }

  // The seller types the price of the asset they are placing; the filter returns
  // buyers whose declared ticket window overlaps that number.
  const ticket = filters.range.ticket;
  if (ticket && (ticket.min !== null || ticket.max !== null)) {
    if (ticket.min !== null) and.push({ ticketMaxEur: { gte: ticket.min } });
    if (ticket.max !== null) and.push({ ticketMinEur: { lte: ticket.max } });
  }

  return and.length ? { AND: and } : {};
}

export async function searchBuyers(filters: ParsedFilters, scope: BuyerScope) {
  const where = buyerWhere(filters, scope);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.buyerProfile.findMany({
      where,
      include: buyerListInclude,
      orderBy: [ORDER[filters.sort] ?? ORDER.newest, { id: "asc" }],
      skip,
      take: PAGE_SIZE,
    }),
    prisma.buyerProfile.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
