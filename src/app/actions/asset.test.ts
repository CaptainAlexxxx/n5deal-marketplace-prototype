import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAs, form, makeAsset, makeSeller, makeUser, resetDb } from "@/test/factories";
import { prisma } from "@/lib/db";
import { suspendAssetAction } from "./moderation";
import { saveAssetAction, setAssetStatusAction } from "./asset";

vi.mock("@/lib/auth/guards", () => ({ actingUser: vi.fn() }));

const prev = {};
const EDITED_TITLE = "Maltese EMI, edited title";

function editForm(assetId: string, extra: Record<string, string> = {}) {
  return form({
    assetId,
    title: EDITED_TITLE,
    summary: "s".repeat(50),
    description: "d".repeat(250),
    categorySlug: "emi",
    countrySlug: "malta",
    licenseType: "EMI",
    regulator: "MFSA",
    businessStatus: "LICENSE_ONLY",
    askingPriceEur: "250000",
    employees: "3",
    yearOfIssue: "2020",
    ...extra,
  });
}

beforeEach(resetDb);

describe("saveAssetAction", () => {
  it("never overwrites a concurrent suspension", async () => {
    for (let i = 0; i < 5; i++) {
      await resetDb();
      const manager = await makeUser("MANAGER");
      const seller = await makeSeller();
      const asset = await makeAsset(seller.profile.id);

      // Each action reads the mocked user synchronously when it starts.
      actAs(seller.user);
      const save = saveAssetAction(prev, editForm(asset.id, { publish: "on" }));
      actAs(manager);
      const suspend = suspendAssetAction(
        prev,
        form({ targetId: asset.id, reason: "Misleading figures in the listing." }),
      );
      await Promise.all([save, suspend]);

      const stored = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
      expect(stored.status).toBe("SUSPENDED");
    }
  });

  it("refuses to edit an already suspended listing", async () => {
    const seller = await makeSeller();
    const asset = await makeAsset(seller.profile.id, { status: "SUSPENDED" });
    actAs(seller.user);

    const result = await saveAssetAction(prev, editForm(asset.id, { publish: "on" }));

    expect(result.error).toMatch(/suspended/);
    const stored = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(stored.status).toBe("SUSPENDED");
    expect(stored.title).not.toBe(EDITED_TITLE);
  });

  it("resets publishedAt when the edit form republishes an archived listing", async () => {
    const seller = await makeSeller();
    const old = new Date("2025-01-01T00:00:00Z");
    const asset = await makeAsset(seller.profile.id, { status: "ARCHIVED", publishedAt: old });
    actAs(seller.user);

    const result = await saveAssetAction(prev, editForm(asset.id, { publish: "on" }));

    expect(result.ok).toBeTruthy();
    const stored = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(stored.status).toBe("PUBLISHED");
    expect(stored.publishedAt!.getTime()).toBeGreaterThan(old.getTime());
  });

  it("keeps publishedAt when a published listing is saved again", async () => {
    const seller = await makeSeller();
    const asset = await makeAsset(seller.profile.id);
    actAs(seller.user);

    await saveAssetAction(prev, editForm(asset.id, { publish: "on" }));

    const stored = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(stored.publishedAt).toEqual(asset.publishedAt);
  });
});

describe("setAssetStatusAction", () => {
  it("resets publishedAt on archive to published, same as the edit form", async () => {
    const seller = await makeSeller();
    const old = new Date("2025-01-01T00:00:00Z");
    const asset = await makeAsset(seller.profile.id, { status: "ARCHIVED", publishedAt: old });
    actAs(seller.user);

    await setAssetStatusAction(prev, form({ assetId: asset.id, next: "PUBLISHED" }));

    const stored = await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } });
    expect(stored.publishedAt!.getTime()).toBeGreaterThan(old.getTime());
  });
});
