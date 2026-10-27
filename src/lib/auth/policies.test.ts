import { describe, expect, it } from "vitest";
import {
  canContactBuyer,
  canContactSeller,
  canEditAsset,
  canModerate,
  canRespondToRequest,
  canViewAsset,
  contactDetailsVisible,
  type Actor,
} from "./policies";
import type { AssetStatus, ContactStatus, Role, UserStatus } from "@/lib/domain/enums";

const actor = (role: Role, status: UserStatus = "ACTIVE", id = `${role}-1`): Actor => ({
  id,
  role,
  status,
});

const asset = (
  over: Partial<{ status: AssetStatus; sellerUserId: string; sellerStatus: UserStatus }> = {},
) => ({
  status: "PUBLISHED" as AssetStatus,
  sellerUserId: "SELLER-1",
  sellerStatus: "ACTIVE" as UserStatus,
  ...over,
});

const request = (
  over: Partial<{ initiatorId: string; targetId: string; status: ContactStatus }> = {},
) => ({
  initiatorId: "BUYER-1",
  targetId: "SELLER-1",
  status: "PENDING" as ContactStatus,
  ...over,
});

describe("canModerate", () => {
  it("allows only active managers", () => {
    expect(canModerate(actor("MANAGER"))).toBe(true);
    expect(canModerate(actor("MANAGER", "SUSPENDED"))).toBe(false);
    expect(canModerate(actor("MANAGER", "REMOVED"))).toBe(false);
    expect(canModerate(actor("BUYER"))).toBe(false);
    expect(canModerate(actor("SELLER"))).toBe(false);
  });
});

describe("canViewAsset", () => {
  it("lets an active buyer see a published asset of an active seller", () => {
    expect(canViewAsset(actor("BUYER"), asset())).toBe(true);
  });

  it.each<AssetStatus>(["DRAFT", "SUSPENDED", "ARCHIVED"])(
    "hides %s assets from buyers",
    (status) => {
      expect(canViewAsset(actor("BUYER"), asset({ status }))).toBe(false);
    },
  );

  it("hides published assets of a suspended or removed seller from buyers", () => {
    expect(canViewAsset(actor("BUYER"), asset({ sellerStatus: "SUSPENDED" }))).toBe(false);
    expect(canViewAsset(actor("BUYER"), asset({ sellerStatus: "REMOVED" }))).toBe(false);
  });

  it("hides everything from a suspended buyer", () => {
    expect(canViewAsset(actor("BUYER", "SUSPENDED"), asset())).toBe(false);
  });

  it("lets an active owner see their own asset in any state", () => {
    const owner = actor("SELLER");
    for (const status of ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"] as const) {
      expect(canViewAsset(owner, asset({ status }))).toBe(true);
    }
  });

  it("does not let a suspended owner see their own asset", () => {
    expect(canViewAsset(actor("SELLER", "SUSPENDED"), asset())).toBe(false);
  });

  it("does not let another seller see a draft", () => {
    const other = actor("SELLER", "ACTIVE", "SELLER-2");
    expect(canViewAsset(other, asset({ status: "DRAFT" }))).toBe(false);
  });

  it("lets a manager see everything, even of suspended sellers", () => {
    expect(
      canViewAsset(actor("MANAGER"), asset({ status: "DRAFT", sellerStatus: "SUSPENDED" })),
    ).toBe(true);
  });

  it("does not let a suspended manager through", () => {
    expect(canViewAsset(actor("MANAGER", "SUSPENDED"), asset({ status: "DRAFT" }))).toBe(false);
  });
});

describe("canEditAsset", () => {
  it("allows the active owning seller only", () => {
    expect(canEditAsset(actor("SELLER"), { sellerUserId: "SELLER-1" })).toBe(true);
    expect(
      canEditAsset(actor("SELLER", "ACTIVE", "SELLER-2"), { sellerUserId: "SELLER-1" }),
    ).toBe(false);
  });

  it("blocks a suspended owner", () => {
    expect(canEditAsset(actor("SELLER", "SUSPENDED"), { sellerUserId: "SELLER-1" })).toBe(false);
  });

  it("blocks managers and buyers even when ids match", () => {
    expect(
      canEditAsset(actor("MANAGER", "ACTIVE", "SELLER-1"), { sellerUserId: "SELLER-1" }),
    ).toBe(false);
    expect(
      canEditAsset(actor("BUYER", "ACTIVE", "SELLER-1"), { sellerUserId: "SELLER-1" }),
    ).toBe(false);
  });
});

describe("canContactSeller", () => {
  const buyer = (over: Partial<Actor & { profilePublished: boolean }> = {}) => ({
    ...actor("BUYER"),
    profilePublished: true,
    ...over,
  });

  it("allows an active buyer with a published profile on a live asset", () => {
    expect(canContactSeller(buyer(), asset())).toBe(true);
  });

  it("requires a published buyer profile", () => {
    expect(canContactSeller(buyer({ profilePublished: false }), asset())).toBe(false);
  });

  it("requires a published asset and an active seller", () => {
    expect(canContactSeller(buyer(), asset({ status: "DRAFT" }))).toBe(false);
    expect(canContactSeller(buyer(), asset({ status: "SUSPENDED" }))).toBe(false);
    expect(canContactSeller(buyer(), asset({ sellerStatus: "SUSPENDED" }))).toBe(false);
  });

  it("blocks suspended buyers", () => {
    expect(canContactSeller(buyer({ status: "SUSPENDED" }), asset())).toBe(false);
  });

  it("blocks self-contact", () => {
    expect(canContactSeller(buyer({ id: "SELLER-1" }), asset())).toBe(false);
  });

  it("blocks sellers and managers", () => {
    expect(
      canContactSeller({ ...actor("SELLER", "ACTIVE", "S-2"), profilePublished: true }, asset()),
    ).toBe(false);
    expect(canContactSeller({ ...actor("MANAGER"), profilePublished: true }, asset())).toBe(false);
  });
});

describe("canContactBuyer", () => {
  const target = (
    over: Partial<{ userId: string; isPublished: boolean; status: UserStatus }> = {},
  ) => ({ userId: "BUYER-1", isPublished: true, status: "ACTIVE" as UserStatus, ...over });

  it("allows an active seller to contact a published active buyer", () => {
    expect(canContactBuyer(actor("SELLER"), target())).toBe(true);
  });

  it("blocks unpublished or inactive buyers", () => {
    expect(canContactBuyer(actor("SELLER"), target({ isPublished: false }))).toBe(false);
    expect(canContactBuyer(actor("SELLER"), target({ status: "SUSPENDED" }))).toBe(false);
    expect(canContactBuyer(actor("SELLER"), target({ status: "REMOVED" }))).toBe(false);
  });

  it("blocks suspended sellers", () => {
    expect(canContactBuyer(actor("SELLER", "SUSPENDED"), target())).toBe(false);
  });

  it("blocks self-contact", () => {
    expect(canContactBuyer(actor("SELLER", "ACTIVE", "BUYER-1"), target())).toBe(false);
  });

  it("blocks buyers and managers", () => {
    expect(canContactBuyer(actor("BUYER", "ACTIVE", "B-2"), target())).toBe(false);
    expect(canContactBuyer(actor("MANAGER"), target())).toBe(false);
  });
});

describe("canRespondToRequest", () => {
  it("allows the active target of a pending request", () => {
    expect(canRespondToRequest(actor("SELLER"), request())).toBe(true);
  });

  it("blocks the initiator", () => {
    expect(canRespondToRequest(actor("BUYER"), request())).toBe(false);
  });

  it("blocks third parties and managers", () => {
    expect(canRespondToRequest(actor("SELLER", "ACTIVE", "SELLER-9"), request())).toBe(false);
    expect(canRespondToRequest(actor("MANAGER"), request())).toBe(false);
  });

  it.each<ContactStatus>(["ACCEPTED", "DECLINED", "CLOSED"])(
    "blocks a %s request (no second answer)",
    (status) => {
      expect(canRespondToRequest(actor("SELLER"), request({ status }))).toBe(false);
    },
  );

  it("blocks a suspended target", () => {
    expect(canRespondToRequest(actor("SELLER", "SUSPENDED"), request())).toBe(false);
  });
});

describe("contactDetailsVisible", () => {
  it("shows details to both parties once accepted", () => {
    const r = request({ status: "ACCEPTED" });
    expect(contactDetailsVisible(actor("BUYER"), r)).toBe(true);
    expect(contactDetailsVisible(actor("SELLER"), r)).toBe(true);
  });

  it.each<ContactStatus>(["PENDING", "DECLINED", "CLOSED"])(
    "hides details from parties while %s",
    (status) => {
      const r = request({ status });
      expect(contactDetailsVisible(actor("BUYER"), r)).toBe(false);
      expect(contactDetailsVisible(actor("SELLER"), r)).toBe(false);
    },
  );

  it("hides details from non-parties even when accepted", () => {
    const stranger = actor("SELLER", "ACTIVE", "SELLER-9");
    expect(contactDetailsVisible(stranger, request({ status: "ACCEPTED" }))).toBe(false);
  });

  it("always shows details to an active manager, with or without a request", () => {
    expect(contactDetailsVisible(actor("MANAGER"), request({ status: "DECLINED" }))).toBe(true);
    expect(contactDetailsVisible(actor("MANAGER"), null)).toBe(true);
  });

  it("does not show details to a suspended manager", () => {
    expect(contactDetailsVisible(actor("MANAGER", "SUSPENDED"), null)).toBe(false);
  });

  it("hides details from non-managers when there is no request", () => {
    expect(contactDetailsVisible(actor("BUYER"), null)).toBe(false);
    expect(contactDetailsVisible(actor("SELLER"), null)).toBe(false);
  });
});
