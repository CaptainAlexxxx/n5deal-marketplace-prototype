import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeAsset, makeBuyer, makeSeller, resetDb } from "@/test/factories";
import { prisma } from "@/lib/db";
import { recordAssetView } from "./asset-views";

vi.mock("@/lib/auth/guards", () => ({ actingUser: vi.fn() }));

beforeEach(resetDb);

describe("recordAssetView", () => {
  it("counts each viewer once per asset", async () => {
    const seller = await makeSeller();
    const asset = await makeAsset(seller.profile.id);
    const a = await makeBuyer();
    const b = await makeBuyer();

    expect(await recordAssetView(asset.id, a.user.id)).toBe(true);
    expect(await recordAssetView(asset.id, a.user.id)).toBe(false);
    expect(await recordAssetView(asset.id, b.user.id)).toBe(true);

    expect((await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } })).views).toBe(2);
  });
});
