"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actingUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { BUSINESS_STATUSES, INVESTOR_TYPES, TIMELINES } from "@/lib/domain/enums";
import { firstIssue, many, num, str, type FormState } from "@/lib/form";

// Saving keeps a half-written profile; publishing is what puts a participant in
// front of the market, so that is where the requirements bite.
const buyerDraft = z.object({
  displayName: z.string().min(2, "Give your fund or company a name"),
  headline: z.string().max(120, "Keep the headline under 120 characters"),
  thesis: z.string().max(3000),
  investorType: INVESTOR_TYPES.schema,
  timeline: TIMELINES.schema,
  ticketMinEur: z.number().int().min(0),
  ticketMaxEur: z.number().int().min(0),
  preferredBusinessStatus: BUSINESS_STATUSES.schema.nullable(),
  contactName: z.string().min(2, "Who should sellers ask for?"),
  phone: z.string().max(40).nullable(),
  categorySlugs: z.array(z.string()),
  countrySlugs: z.array(z.string()),
});

const buyerPublish = buyerDraft
  .extend({
    headline: z.string().min(10, "Write a headline sellers can scan in one line"),
    thesis: z
      .string()
      .min(80, "Describe your mandate in at least a few sentences so sellers can self-select"),
    ticketMaxEur: z.number().int().positive("Set the top of your ticket range"),
    categorySlugs: z.array(z.string()).min(1, "Pick at least one business category"),
    countrySlugs: z.array(z.string()).min(1, "Pick at least one target jurisdiction"),
  })
  .refine((v) => v.ticketMaxEur >= v.ticketMinEur, {
    message: "The top of the ticket range must be above the bottom",
  });

export async function saveBuyerProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("BUYER");
  const publish = str(formData, "publish") === "on";

  const input = {
    displayName: str(formData, "displayName"),
    headline: str(formData, "headline"),
    thesis: str(formData, "thesis"),
    investorType: str(formData, "investorType"),
    timeline: str(formData, "timeline"),
    ticketMinEur: num(formData, "ticketMinEur") ?? 0,
    ticketMaxEur: num(formData, "ticketMaxEur") ?? 0,
    preferredBusinessStatus: str(formData, "preferredBusinessStatus") || null,
    contactName: str(formData, "contactName"),
    phone: str(formData, "phone") || null,
    categorySlugs: many(formData, "categories"),
    countrySlugs: many(formData, "countries"),
  };

  const parsed = publish ? buyerPublish.safeParse(input) : buyerDraft.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const data = parsed.data;

  const [categories, countries] = await Promise.all([
    prisma.category.findMany({ where: { slug: { in: data.categorySlugs } } }),
    prisma.country.findMany({ where: { slug: { in: data.countrySlugs } } }),
  ]);
  if (
    categories.length !== new Set(data.categorySlugs).size ||
    countries.length !== new Set(data.countrySlugs).size
  ) {
    return { error: "Unknown category or jurisdiction in the submitted form" };
  }

  const profile = await prisma.buyerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return { error: "Buyer profile is missing" };

  await prisma.$transaction([
    prisma.buyerCategory.deleteMany({ where: { buyerProfileId: profile.id } }),
    prisma.buyerCountry.deleteMany({ where: { buyerProfileId: profile.id } }),
    prisma.buyerProfile.update({
      where: { id: profile.id },
      data: {
        displayName: data.displayName,
        headline: data.headline,
        thesis: data.thesis,
        investorType: data.investorType,
        timeline: data.timeline,
        ticketMinEur: data.ticketMinEur,
        ticketMaxEur: data.ticketMaxEur,
        preferredBusinessStatus: data.preferredBusinessStatus,
        contactName: data.contactName,
        phone: data.phone,
        isPublished: publish,
        categories: { create: categories.map((c) => ({ categoryId: c.id })) },
        countries: { create: countries.map((c) => ({ countryId: c.id })) },
      },
    }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/buyers");
  return {
    ok: publish
      ? "Profile published. Sellers can find you and start a conversation."
      : "Saved as a draft. Publish it to become visible to sellers.",
  };
}

const sellerSchema = z.object({
  companyName: z.string().min(2, "Enter the company name"),
  about: z
    .string()
    .min(40, "Tell buyers what kind of mandates you take, at least a couple of lines")
    .max(3000),
  website: z.string().url("Website must be a full URL including https://").nullable(),
  contactName: z.string().min(2, "Who should buyers ask for?"),
  phone: z.string().max(40).nullable(),
});

export async function saveSellerProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("SELLER");
  const parsed = sellerSchema.safeParse({
    companyName: str(formData, "companyName"),
    about: str(formData, "about"),
    website: str(formData, "website") || null,
    contactName: str(formData, "contactName"),
    phone: str(formData, "phone") || null,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const profile = await prisma.sellerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return { error: "Company profile is missing" };

  await prisma.sellerProfile.update({ where: { id: profile.id }, data: parsed.data });

  revalidatePath("/profile");
  return { ok: "Company profile saved" };
}
