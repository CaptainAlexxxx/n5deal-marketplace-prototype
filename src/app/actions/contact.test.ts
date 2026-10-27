import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAs, form, makeAsset, makeBuyer, makeSeller, resetDb } from "@/test/factories";
import { prisma } from "@/lib/db";
import { contactBuyerAction, contactSellerAction, respondToRequestAction } from "./contact";

vi.mock("@/lib/auth/guards", () => ({ actingUser: vi.fn() }));

const MESSAGE = "We would like to talk about this asset and the timeline for a transfer.";
const prev = {};

beforeEach(resetDb);

describe("duplicate outreach", () => {
  it("lets a buyer contact a seller about an asset only once", async () => {
    const seller = await makeSeller();
    const buyer = await makeBuyer();
    const asset = await makeAsset(seller.profile.id);
    actAs(buyer.user);

    const first = await contactSellerAction(prev, form({ assetId: asset.id, message: MESSAGE }));
    const second = await contactSellerAction(prev, form({ assetId: asset.id, message: MESSAGE }));

    expect(first.ok).toBeTruthy();
    expect(second.error).toMatch(/already contacted/);
    expect(await prisma.contactRequest.count()).toBe(1);
  });

  it("lets a seller contact a buyer only once, and still allows the other direction", async () => {
    const seller = await makeSeller();
    const buyer = await makeBuyer();
    const asset = await makeAsset(seller.profile.id);

    actAs(seller.user);
    const args = form({ buyerProfileId: buyer.profile.id, message: MESSAGE });
    expect((await contactBuyerAction(prev, args)).ok).toBeTruthy();
    expect((await contactBuyerAction(prev, args)).error).toMatch(/already contacted/);

    actAs(buyer.user);
    const reverse = await contactSellerAction(prev, form({ assetId: asset.id, message: MESSAGE }));
    expect(reverse.ok).toBeTruthy();
    expect(await prisma.contactRequest.count()).toBe(2);
  });

  it("lets only one of several racing submits through", async () => {
    const seller = await makeSeller();
    const buyer = await makeBuyer();
    const asset = await makeAsset(seller.profile.id);
    actAs(buyer.user);

    const results = await Promise.all(
      [1, 2, 3].map(() => contactSellerAction(prev, form({ assetId: asset.id, message: MESSAGE }))),
    );

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await prisma.contactRequest.count()).toBe(1);
  });
});

describe("contact request subject check", () => {
  it("rejects a row with neither or both of assetId and buyerProfileId", async () => {
    const seller = await makeSeller();
    const buyer = await makeBuyer();
    const asset = await makeAsset(seller.profile.id);
    const base = { initiatorId: buyer.user.id, targetId: seller.user.id, message: MESSAGE };

    await expect(prisma.contactRequest.create({ data: base })).rejects.toThrow();
    await expect(
      prisma.contactRequest.create({
        data: { ...base, assetId: asset.id, buyerProfileId: buyer.profile.id },
      }),
    ).rejects.toThrow();
    expect(await prisma.contactRequest.count()).toBe(0);
  });
});

describe("respondToRequestAction", () => {
  it("lets exactly one of two concurrent answers win", async () => {
    for (let i = 0; i < 5; i++) {
      await resetDb();
      const seller = await makeSeller();
      const buyer = await makeBuyer();
      const asset = await makeAsset(seller.profile.id);
      const request = await prisma.contactRequest.create({
        data: {
          initiatorId: buyer.user.id,
          targetId: seller.user.id,
          assetId: asset.id,
          message: MESSAGE,
        },
      });
      actAs(seller.user);

      const [accept, decline] = await Promise.all([
        respondToRequestAction(prev, form({ requestId: request.id, decision: "ACCEPTED" })),
        respondToRequestAction(prev, form({ requestId: request.id, decision: "DECLINED" })),
      ]);

      expect([accept, decline].filter((r) => r.ok)).toHaveLength(1);
      const stored = await prisma.contactRequest.findUniqueOrThrow({ where: { id: request.id } });
      expect(stored.status).toBe(accept.ok ? "ACCEPTED" : "DECLINED");
    }
  });

  it("does not let an answered request be flipped later", async () => {
    const seller = await makeSeller();
    const buyer = await makeBuyer();
    const asset = await makeAsset(seller.profile.id);
    const request = await prisma.contactRequest.create({
      data: {
        initiatorId: buyer.user.id,
        targetId: seller.user.id,
        assetId: asset.id,
        message: MESSAGE,
      },
    });
    actAs(seller.user);

    await respondToRequestAction(prev, form({ requestId: request.id, decision: "DECLINED" }));
    const again = await respondToRequestAction(
      prev,
      form({ requestId: request.id, decision: "ACCEPTED" }),
    );

    expect(again.error).toBeTruthy();
    const stored = await prisma.contactRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(stored.status).toBe("DECLINED");
  });
});
