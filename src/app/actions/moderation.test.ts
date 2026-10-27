import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAs, form, makeAsset, makeSeller, makeUser, resetDb } from "@/test/factories";
import { prisma } from "@/lib/db";
import {
  reinstateAssetAction,
  reinstateUserAction,
  removeUserAction,
  suspendAssetAction,
  suspendUserAction,
} from "./moderation";

vi.mock("@/lib/auth/guards", () => ({ actingUser: vi.fn() }));

const REASON = "Repeated policy violations on the platform.";
const prev = {};
const target = (targetId: string) => form({ targetId, reason: REASON });

beforeEach(resetDb);

describe("user moderation", () => {
  it("does not resurrect a removed user when reinstate and remove race", async () => {
    for (let i = 0; i < 5; i++) {
      await resetDb();
      const manager = await makeUser("MANAGER");
      const seller = await makeSeller();
      await prisma.user.update({ where: { id: seller.user.id }, data: { status: "SUSPENDED" } });
      actAs(manager);

      await Promise.all([
        reinstateUserAction(prev, target(seller.user.id)),
        removeUserAction(prev, target(seller.user.id)),
      ]);

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: seller.user.id } });
      expect(stored.status).toBe("REMOVED");
      expect(await prisma.moderationAction.count({ where: { action: "REMOVE_USER" } })).toBe(1);
    }
  });

  it("refuses to reinstate after removal", async () => {
    const manager = await makeUser("MANAGER");
    const seller = await makeSeller();
    actAs(manager);

    expect((await removeUserAction(prev, target(seller.user.id))).ok).toBeTruthy();
    expect((await reinstateUserAction(prev, target(seller.user.id))).error).toBeTruthy();

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: seller.user.id } });
    expect(stored.status).toBe("REMOVED");
  });

  it("logs a double suspend once", async () => {
    const manager = await makeUser("MANAGER");
    const seller = await makeSeller();
    actAs(manager);

    await Promise.all([
      suspendUserAction(prev, target(seller.user.id)),
      suspendUserAction(prev, target(seller.user.id)),
    ]);

    expect(await prisma.moderationAction.count({ where: { action: "SUSPEND_USER" } })).toBe(1);
  });

  it("archives live listings on removal but keeps a suspended one suspended", async () => {
    const manager = await makeUser("MANAGER");
    const seller = await makeSeller();
    const live = await makeAsset(seller.profile.id);
    const held = await makeAsset(seller.profile.id, { status: "SUSPENDED" });
    actAs(manager);

    await removeUserAction(prev, target(seller.user.id));

    expect((await prisma.asset.findUniqueOrThrow({ where: { id: live.id } })).status).toBe(
      "ARCHIVED",
    );
    expect((await prisma.asset.findUniqueOrThrow({ where: { id: held.id } })).status).toBe(
      "SUSPENDED",
    );
  });
});

describe("listing moderation", () => {
  it("suspends and republishes, applying each change once", async () => {
    const manager = await makeUser("MANAGER");
    const seller = await makeSeller();
    const asset = await makeAsset(seller.profile.id);
    actAs(manager);

    const [a, b] = await Promise.all([
      suspendAssetAction(prev, target(asset.id)),
      suspendAssetAction(prev, target(asset.id)),
    ]);
    expect([a, b].filter((r) => r.ok)).toHaveLength(1);
    expect((await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } })).status).toBe(
      "SUSPENDED",
    );

    const [c, d] = await Promise.all([
      reinstateAssetAction(prev, target(asset.id)),
      reinstateAssetAction(prev, target(asset.id)),
    ]);
    expect([c, d].filter((r) => r.ok)).toHaveLength(1);
    expect((await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } })).status).toBe(
      "PUBLISHED",
    );
    expect(await prisma.moderationAction.count()).toBe(2);
  });
});
