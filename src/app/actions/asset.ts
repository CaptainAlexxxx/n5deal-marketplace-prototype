"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { actingUser } from "@/lib/auth/guards";
import { canEditAsset } from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import {
  ASSET_STATUSES,
  BUSINESS_STATUSES,
  LABELS,
  LICENSE_TYPES,
} from "@/lib/domain/enums";
import { firstIssue, many, num, str, type FormState } from "@/lib/form";

const CURRENT_YEAR = new Date().getFullYear();

/** Where public listing numbers begin, matching the seeded block. */
const FIRST_REFERENCE = 700;

const draftSchema = z.object({
  title: z.string().min(8, "Give the listing a descriptive title"),
  summary: z.string().max(300, "Keep the summary under 300 characters"),
  description: z.string().max(8000),
  categorySlug: z.string().min(1, "Pick a business category"),
  countrySlug: z.string().min(1, "Pick a jurisdiction"),
  licenseType: LICENSE_TYPES.schema,
  regulator: z.string().min(2, "Name the supervising authority"),
  businessStatus: BUSINESS_STATUSES.schema,
  askingPriceEur: z.number().int().positive("Set an asking price"),
  annualRevenueEur: z.number().int().min(0).nullable(),
  ebitdaEur: z.number().int().nullable(),
  employees: z.number().int().min(0),
  yearOfIssue: z
    .number()
    .int()
    .min(1900, "That licence year looks wrong")
    .max(CURRENT_YEAR, "The licence year cannot be in the future"),
  benefitSlugs: z.array(z.string()),
});

type Publishable = {
  summary: string;
  description: string;
  businessStatus: string;
  annualRevenueEur: number | null;
  ebitdaEur: number | null;
};

/** Publishing demands more than a draft. Shared by the form and the status buttons. */
function publishBlocker(asset: Publishable): string | null {
  if (asset.summary.length < 40) return "Write a summary a buyer can judge in one glance";
  if (asset.description.length < 200) return "Describe the asset properly before publishing";
  if (asset.businessStatus === "ACTIVE_BUSINESS" && asset.annualRevenueEur === null) {
    return "An active business needs an annual revenue figure";
  }
  if (
    asset.ebitdaEur !== null &&
    asset.annualRevenueEur !== null &&
    asset.ebitdaEur > asset.annualRevenueEur
  ) {
    return "EBITDA cannot be higher than revenue";
  }
  return null;
}

function readAsset(formData: FormData) {
  return {
    title: str(formData, "title"),
    summary: str(formData, "summary"),
    description: str(formData, "description"),
    categorySlug: str(formData, "categorySlug"),
    countrySlug: str(formData, "countrySlug"),
    licenseType: str(formData, "licenseType"),
    regulator: str(formData, "regulator"),
    businessStatus: str(formData, "businessStatus"),
    askingPriceEur: num(formData, "askingPriceEur") ?? 0,
    annualRevenueEur: num(formData, "annualRevenueEur"),
    ebitdaEur: num(formData, "ebitdaEur"),
    employees: num(formData, "employees") ?? 0,
    yearOfIssue: num(formData, "yearOfIssue") ?? CURRENT_YEAR,
    benefitSlugs: many(formData, "benefits"),
  };
}

export async function saveAssetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("SELLER");
  const assetId = str(formData, "assetId") || null;
  const publish = str(formData, "publish") === "on";

  const parsed = draftSchema.safeParse(readAsset(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const data = parsed.data;

  if (publish) {
    const blocker = publishBlocker(data);
    if (blocker) return { error: blocker };
  }

  const [seller, category, country, benefits] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { userId: actor.id } }),
    prisma.category.findUnique({ where: { slug: data.categorySlug } }),
    prisma.country.findUnique({ where: { slug: data.countrySlug } }),
    prisma.benefit.findMany({ where: { slug: { in: data.benefitSlugs } } }),
  ]);
  if (!seller) return { error: "Seller profile is missing" };
  if (!category || !country) return { error: "Unknown category or jurisdiction" };
  if (benefits.length !== new Set(data.benefitSlugs).size) {
    return { error: "Unknown item in the included list" };
  }

  const shared = {
    title: data.title,
    summary: data.summary,
    description: data.description,
    categoryId: category.id,
    countryId: country.id,
    licenseType: data.licenseType,
    regulator: data.regulator,
    businessStatus: data.businessStatus,
    askingPriceEur: data.askingPriceEur,
    annualRevenueEur: data.annualRevenueEur,
    ebitdaEur: data.ebitdaEur,
    employees: data.employees,
    yearOfIssue: data.yearOfIssue,
  };

  let targetId = assetId;

  if (assetId) {
    const existing = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { seller: { select: { userId: true } } },
    });
    if (!existing || !canEditAsset(actor, { sellerUserId: existing.seller.userId })) {
      return { error: "You cannot edit that listing" };
    }
    if (existing.status === "SUSPENDED") {
      return { error: "A suspended listing can only be changed by a platform manager" };
    }

    await prisma.$transaction([
      prisma.assetBenefit.deleteMany({ where: { assetId } }),
      prisma.asset.update({
        where: { id: assetId },
        data: {
          ...shared,
          status: publish ? "PUBLISHED" : existing.status === "PUBLISHED" ? "DRAFT" : existing.status,
          publishedAt: publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          benefits: { create: benefits.map((b) => ({ benefitId: b.id })) },
        },
      }),
    ]);
  } else {
    const created = await createWithReference({
      ...shared,
      sellerId: seller.id,
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? new Date() : null,
      benefits: { create: benefits.map((b) => ({ benefitId: b.id })) },
    });
    if (!created) return { error: "Could not allocate a listing number, try again" };
    targetId = created.id;
  }

  revalidatePath("/my-assets");
  revalidatePath("/assets");
  if (targetId) revalidatePath(`/assets/${targetId}`);

  if (!assetId && targetId) redirect(`/my-assets/${targetId}/edit?saved=1`);
  return { ok: publish ? "Listing published" : "Draft saved" };
}

/**
 * SQLite will not serialise the max() against a concurrent insert, so the unique
 * index is the real guard and a collision just means taking the next number.
 */
async function createWithReference(data: Omit<Prisma.AssetUncheckedCreateInput, "reference">) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const highest = await prisma.asset.aggregate({ _max: { reference: true } });
    const reference = Math.max(FIRST_REFERENCE, (highest._max.reference ?? 0) + 1);
    try {
      return await prisma.asset.create({ data: { ...data, reference } });
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
    }
  }
  return null;
}

const statusSchema = z.object({
  assetId: z.string().min(1),
  next: ASSET_STATUSES.schema.exclude(["SUSPENDED"]),
});

export async function setAssetStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("SELLER");
  const parsed = statusSchema.safeParse({
    assetId: str(formData, "assetId"),
    next: str(formData, "next"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const asset = await prisma.asset.findUnique({
    where: { id: parsed.data.assetId },
    include: { seller: { select: { userId: true } } },
  });
  if (!asset || !canEditAsset(actor, { sellerUserId: asset.seller.userId })) {
    return { error: "You cannot change that listing" };
  }
  if (asset.status === "SUSPENDED") {
    return { error: "A suspended listing can only be changed by a platform manager" };
  }

  if (parsed.data.next === "PUBLISHED") {
    const blocker = publishBlocker(asset);
    if (blocker) return { error: `${blocker}. Open the listing and complete it first.` };
  }

  // Coming back from the archive counts as a fresh listing, otherwise it
  // reappears buried at the bottom of "Newest listings".
  const republished = parsed.data.next === "PUBLISHED" && asset.status === "ARCHIVED";

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      status: parsed.data.next,
      publishedAt:
        parsed.data.next !== "PUBLISHED"
          ? asset.publishedAt
          : republished || !asset.publishedAt
            ? new Date()
            : asset.publishedAt,
    },
  });

  revalidatePath("/my-assets");
  revalidatePath("/assets");
  revalidatePath(`/assets/${asset.id}`);
  return { ok: `Listing moved to ${LABELS.assetStatus[parsed.data.next].toLowerCase()}` };
}
