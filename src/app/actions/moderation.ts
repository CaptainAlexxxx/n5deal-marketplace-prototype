"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actingUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { firstIssue, str, type FormState } from "@/lib/form";

const schema = z.object({
  targetId: z.string().min(1),
  reason: z
    .string()
    .min(10, "Give a reason the participant can act on")
    .max(500, "Keep the reason under 500 characters"),
});

const STALE_ACCOUNT = "This account was changed by someone else, reload and try again";
const STALE_LISTING = "This listing was changed by someone else, reload and try again";

function refreshAdmin() {
  revalidatePath("/admin/participants");
  revalidatePath("/admin/assets");
  revalidatePath("/admin/log");
  revalidatePath("/");
}

export async function suspendUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("MANAGER");
  const parsed = schema.safeParse({
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetId },
    include: { buyerProfile: true, sellerProfile: true },
  });
  if (!target) return { error: "Participant not found" };
  if (target.role === "MANAGER") return { error: "Managers cannot be moderated here" };
  if (target.status !== "ACTIVE") return { error: "This account is not active" };

  // Listings keep their own status. Suspension hides the participant through the
  // catalogue queries, so reinstating restores everything without a second pass.
  const done = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: target.id, status: "ACTIVE" },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspendReason: parsed.data.reason,
      },
    });
    if (count === 0) return false;
    await tx.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: "USER",
        targetId: target.id,
        targetLabel: labelFor(target),
        action: "SUSPEND_USER",
        reason: parsed.data.reason,
      },
    });
    return true;
  });
  if (!done) return { error: STALE_ACCOUNT };

  refreshAdmin();
  return { ok: "Participant suspended" };
}

export async function reinstateUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("MANAGER");
  const parsed = schema.safeParse({
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetId },
    include: { buyerProfile: true, sellerProfile: true },
  });
  if (!target) return { error: "Participant not found" };
  if (target.role === "MANAGER") return { error: "Managers cannot be moderated here" };
  if (target.status !== "SUSPENDED") {
    return { error: "Only suspended accounts can be reinstated" };
  }

  // Conditional on SUSPENDED, so a removal that lands first cannot be undone.
  const done = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: target.id, status: "SUSPENDED" },
      data: { status: "ACTIVE", suspendedAt: null, suspendReason: null },
    });
    if (count === 0) return false;
    await tx.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: "USER",
        targetId: target.id,
        targetLabel: labelFor(target),
        action: "REINSTATE_USER",
        reason: parsed.data.reason,
      },
    });
    return true;
  });
  if (!done) return { error: STALE_ACCOUNT };

  refreshAdmin();
  return { ok: "Participant reinstated with their listings intact" };
}

export async function removeUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("MANAGER");
  const parsed = schema.safeParse({
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetId },
    include: { buyerProfile: true, sellerProfile: true },
  });
  if (!target) return { error: "Participant not found" };
  if (target.role === "MANAGER") return { error: "Managers cannot be moderated here" };
  if (target.status === "REMOVED") return { error: "This account is already removed" };

  // Removal is a soft delete. Nothing is destroyed, because a marketplace has to
  // be able to answer questions about a deal months after the fact.
  const done = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: target.id, status: { in: ["ACTIVE", "SUSPENDED"] } },
      data: {
        status: "REMOVED",
        suspendedAt: new Date(),
        suspendReason: parsed.data.reason,
      },
    });
    if (count === 0) return false;
    if (target.sellerProfile) {
      await tx.asset.updateMany({
        // A listing suspended on its own keeps that state, so the reason it
        // was pulled stays visible.
        where: { sellerId: target.sellerProfile.id, status: { not: "SUSPENDED" } },
        data: { status: "ARCHIVED" },
      });
    }
    if (target.buyerProfile) {
      await tx.buyerProfile.update({
        where: { id: target.buyerProfile.id },
        data: { isPublished: false },
      });
    }
    await tx.contactRequest.updateMany({
      where: {
        status: "PENDING",
        OR: [{ initiatorId: target.id }, { targetId: target.id }],
      },
      data: { status: "CLOSED", respondedAt: new Date() },
    });
    await tx.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: "USER",
        targetId: target.id,
        targetLabel: labelFor(target),
        action: "REMOVE_USER",
        reason: parsed.data.reason,
      },
    });
    return true;
  });
  if (!done) return { error: STALE_ACCOUNT };

  refreshAdmin();
  return { ok: "Participant removed, listings archived and open requests closed" };
}

export async function suspendAssetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("MANAGER");
  const parsed = schema.safeParse({
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.targetId } });
  if (!asset) return { error: "Listing not found" };
  if (asset.status !== "PUBLISHED") return { error: "Only published listings can be suspended" };

  const done = await prisma.$transaction(async (tx) => {
    const { count } = await tx.asset.updateMany({
      where: { id: asset.id, status: "PUBLISHED" },
      data: { status: "SUSPENDED" },
    });
    if (count === 0) return false;
    await tx.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: "ASSET",
        targetId: asset.id,
        targetLabel: `#${asset.reference} ${asset.title}`,
        action: "SUSPEND_ASSET",
        reason: parsed.data.reason,
      },
    });
    return true;
  });
  if (!done) return { error: STALE_LISTING };

  refreshAdmin();
  revalidatePath(`/assets/${asset.id}`);
  return { ok: "Listing suspended" };
}

export async function reinstateAssetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("MANAGER");
  const parsed = schema.safeParse({
    targetId: str(formData, "targetId"),
    reason: str(formData, "reason"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.targetId } });
  if (!asset) return { error: "Listing not found" };
  if (asset.status !== "SUSPENDED") return { error: "This listing is not suspended" };

  const done = await prisma.$transaction(async (tx) => {
    const { count } = await tx.asset.updateMany({
      where: { id: asset.id, status: "SUSPENDED" },
      data: { status: "PUBLISHED" },
    });
    if (count === 0) return false;
    await tx.moderationAction.create({
      data: {
        actorId: actor.id,
        targetType: "ASSET",
        targetId: asset.id,
        targetLabel: `#${asset.reference} ${asset.title}`,
        action: "REINSTATE_ASSET",
        reason: parsed.data.reason,
      },
    });
    return true;
  });
  if (!done) return { error: STALE_LISTING };

  refreshAdmin();
  revalidatePath(`/assets/${asset.id}`);
  return { ok: "Listing published again" };
}

type LabelTarget = {
  email: string;
  buyerProfile: { displayName: string } | null;
  sellerProfile: { companyName: string } | null;
};

function labelFor(user: LabelTarget) {
  const name = user.buyerProfile?.displayName ?? user.sellerProfile?.companyName;
  return name ? `${name} (${user.email})` : user.email;
}
