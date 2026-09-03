import type { Role, UserStatus, AssetStatus, ContactStatus } from "@/lib/domain/enums";

// Authorisation rules that need more than a role check. Pure functions: no
// database, no session, no framework. Plain role checks go through requireRole.

export type Actor = { id: string; role: Role; status: UserStatus };

const isActive = (actor: Actor) => actor.status === "ACTIVE";

const canBrowseAssets = (actor: Actor) => actor.role === "BUYER" && isActive(actor);

const canBrowseBuyers = (actor: Actor) => actor.role === "SELLER" && isActive(actor);

const canPublishAssets = (actor: Actor) => actor.role === "SELLER" && isActive(actor);

export const canModerate = (actor: Actor) => actor.role === "MANAGER" && isActive(actor);

type AssetView = {
  status: AssetStatus;
  sellerUserId: string;
  sellerStatus: UserStatus;
};

/**
 * A suspended seller keeps their listings in PUBLISHED state and simply drops
 * out of the market, so reinstating them restores the catalogue with no second
 * pass over the asset rows.
 */
export function canViewAsset(actor: Actor, asset: AssetView) {
  if (canModerate(actor)) return true;
  if (asset.sellerUserId === actor.id) return isActive(actor);
  return (
    isActive(actor) && asset.status === "PUBLISHED" && asset.sellerStatus === "ACTIVE"
  );
}

export function canEditAsset(actor: Actor, asset: { sellerUserId: string }) {
  return canPublishAssets(actor) && asset.sellerUserId === actor.id;
}

export function canContactSeller(
  actor: Actor & { profilePublished: boolean },
  asset: AssetView,
) {
  return (
    canBrowseAssets(actor) &&
    actor.profilePublished &&
    asset.status === "PUBLISHED" &&
    asset.sellerStatus === "ACTIVE" &&
    asset.sellerUserId !== actor.id
  );
}

export function canContactBuyer(
  actor: Actor,
  buyer: { userId: string; isPublished: boolean; status: UserStatus },
) {
  return (
    canBrowseBuyers(actor) &&
    buyer.isPublished &&
    buyer.status === "ACTIVE" &&
    buyer.userId !== actor.id
  );
}

type RequestView = {
  initiatorId: string;
  targetId: string;
  status: ContactStatus;
};

export function canRespondToRequest(actor: Actor, request: RequestView) {
  return (
    isActive(actor) && request.targetId === actor.id && request.status === "PENDING"
  );
}

/**
 * Contact details are released once outreach is accepted. Managers see them
 * regardless, including when there is no request to look at, which is why the
 * request is nullable here rather than checked at every call site.
 */
export function contactDetailsVisible(actor: Actor, request: RequestView | null) {
  if (canModerate(actor)) return true;
  if (!request) return false;
  const party = request.initiatorId === actor.id || request.targetId === actor.id;
  return party && request.status === "ACCEPTED";
}
