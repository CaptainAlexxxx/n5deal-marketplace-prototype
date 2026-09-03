import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LABELS, ROLES, USER_STATUSES } from "@/lib/domain/enums";
import { PAGE_SIZE, type ParsedFilters, type SearchConfig } from "./params";

/** Third surface on the same engine: the manager searches people, not listings. */
export function participantSearchConfig(): SearchConfig {
  return {
    searchPlaceholder: "Search participants by email, company or fund name",
    facets: [
      {
        kind: "multi",
        key: "role",
        label: "Role",
        options: ROLES.values
          .filter((r) => r !== "MANAGER")
          .map((r) => ({ value: r, label: LABELS.role[r] })),
      },
      {
        kind: "multi",
        key: "status",
        label: "Account status",
        options: USER_STATUSES.values.map((s) => ({
          value: s,
          label: LABELS.userStatus[s],
        })),
      },
    ],
    sorts: [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "email", label: "Email A-Z" },
    ],
    defaultSort: "newest",
  };
}

const ORDER: Record<string, Prisma.UserOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  email: { email: "asc" },
};

export const participantInclude = {
  buyerProfile: { select: { id: true, displayName: true, isPublished: true } },
  sellerProfile: {
    select: { id: true, companyName: true, _count: { select: { assets: true } } },
  },
  _count: { select: { sentRequests: true, receivedRequests: true } },
} satisfies Prisma.UserInclude;

export type Participant = Prisma.UserGetPayload<{ include: typeof participantInclude }>;

function participantWhere(filters: ParsedFilters): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [{ role: { not: "MANAGER" } }];

  if (filters.q) {
    and.push({
      OR: [
        { email: { contains: filters.q } },
        { buyerProfile: { displayName: { contains: filters.q } } },
        { sellerProfile: { companyName: { contains: filters.q } } },
      ],
    });
  }

  const roles = filters.multi.role ?? [];
  if (roles.length) and.push({ role: { in: roles } });

  const statuses = filters.multi.status ?? [];
  if (statuses.length) and.push({ status: { in: statuses } });

  return { AND: and };
}

export async function searchParticipants(filters: ParsedFilters) {
  const where = participantWhere(filters);
  const skip = (filters.page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: participantInclude,
      orderBy: [ORDER[filters.sort] ?? ORDER.newest, { id: "asc" }],
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
