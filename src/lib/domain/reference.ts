import { cache } from "react";
import { prisma } from "@/lib/db";

/** Facet option lists come from the lookup tables, so adding a jurisdiction is a
 * seed change rather than a code change. Cached per request. */
export const referenceOptions = cache(async () => {
  const [categories, countries, benefits] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.benefit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    categories: categories.map((c) => ({ value: c.slug, label: c.name })),
    countries: countries.map((c) => ({ value: c.slug, label: c.name })),
    benefits: benefits.map((b) => ({ value: b.slug, label: b.name })),
  };
});
