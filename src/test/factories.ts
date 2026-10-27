import { vi } from "vitest";
import { actingUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

let counter = 0;
const next = () => ++counter;

export async function resetDb() {
  await prisma.assetView.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.assetBenefit.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.buyerCategory.deleteMany();
  await prisma.buyerCountry.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.country.deleteMany();
  await prisma.category.deleteMany();
}

export function makeUser(role: "BUYER" | "SELLER" | "MANAGER", status = "ACTIVE") {
  const n = next();
  return prisma.user.create({
    data: { email: `${role.toLowerCase()}${n}@test.local`, passwordHash: "x", role, status },
  });
}

export async function makeSeller() {
  const user = await makeUser("SELLER");
  const profile = await prisma.sellerProfile.create({
    data: { userId: user.id, companyName: `Seller ${user.id}`, about: "about", contactName: "A B" },
  });
  return { user, profile };
}

export async function makeBuyer(isPublished = true) {
  const user = await makeUser("BUYER");
  const profile = await prisma.buyerProfile.create({
    data: {
      userId: user.id,
      displayName: `Buyer ${user.id}`,
      headline: "h",
      thesis: "t",
      investorType: "FINANCIAL",
      timeline: "IMMEDIATE",
      ticketMinEur: 1,
      ticketMaxEur: 10,
      contactName: "C D",
      isPublished,
    },
  });
  return { user, profile };
}

export async function makeRefs() {
  const category = await prisma.category.upsert({
    where: { slug: "emi" },
    update: {},
    create: { slug: "emi", name: "EMI" },
  });
  const country = await prisma.country.upsert({
    where: { slug: "malta" },
    update: {},
    create: { slug: "malta", name: "Malta", code: "MT" },
  });
  return { category, country };
}

export async function makeAsset(
  sellerId: string,
  overrides: { status?: string; publishedAt?: Date | null } = {},
) {
  const { category, country } = await makeRefs();
  return prisma.asset.create({
    data: {
      reference: 1000 + next(),
      sellerId,
      title: "Maltese EMI with live IBAN issuing",
      summary: "s".repeat(50),
      description: "d".repeat(250),
      categoryId: category.id,
      countryId: country.id,
      licenseType: "EMI",
      regulator: "MFSA",
      businessStatus: "LICENSE_ONLY",
      askingPriceEur: 100_000,
      employees: 3,
      yearOfIssue: 2020,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      ...overrides,
    },
  });
}

/** Makes the mocked auth guard return this user for the next actions. */
export function actAs(user: { id: string; email: string; role: string }) {
  vi.mocked(actingUser).mockResolvedValue({
    id: user.id,
    email: user.email,
    role: user.role as "BUYER" | "SELLER" | "MANAGER",
    status: "ACTIVE",
    suspendReason: null,
  });
}

export function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}
