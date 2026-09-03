"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actingUser } from "@/lib/auth/guards";
import {
  canContactBuyer,
  canContactSeller,
  canRespondToRequest,
} from "@/lib/auth/policies";
import { prisma } from "@/lib/db";
import { firstIssue, str, type FormState } from "@/lib/form";
import { CONTACT_STATUSES } from "@/lib/domain/enums";
import type { AssetStatus, ContactStatus, UserStatus } from "@/lib/domain/enums";

const messageSchema = z
  .string()
  .min(30, "Write at least a couple of sentences so the other side can reply properly")
  .max(2000, "Keep the first message under 2000 characters");

/** Duplicate outreach is stopped by the unique index, not by a read-then-write check. */
function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function contactSellerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("BUYER");
  const assetId = str(formData, "assetId");
  const parsed = messageSchema.safeParse(str(formData, "message"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const [asset, profile] = await Promise.all([
    prisma.asset.findUnique({
      where: { id: assetId },
      include: { seller: { select: { userId: true, user: { select: { status: true } } } } },
    }),
    prisma.buyerProfile.findUnique({ where: { userId: actor.id } }),
  ]);

  if (!asset) return { error: "That listing no longer exists" };

  const allowed = canContactSeller(
    { ...actor, profilePublished: profile?.isPublished ?? false },
    {
      status: asset.status as AssetStatus,
      sellerUserId: asset.seller.userId,
      sellerStatus: asset.seller.user.status as UserStatus,
    },
  );
  if (!allowed) {
    return {
      error: profile?.isPublished
        ? "This listing is not open for contact right now"
        : "Publish your buyer profile before contacting a seller",
    };
  }

  try {
    await prisma.contactRequest.create({
      data: {
        initiatorId: actor.id,
        targetId: asset.seller.userId,
        assetId,
        message: parsed.data,
      },
    });
  } catch (error) {
    if (isDuplicate(error)) {
      return { error: "You have already contacted this seller about the asset" };
    }
    throw error;
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/contacts");
  return { ok: "Request sent. The seller sees your message and decides whether to share contact details." };
}

export async function contactBuyerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser("SELLER");
  const buyerProfileId = str(formData, "buyerProfileId");
  const parsed = messageSchema.safeParse(str(formData, "message"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const buyer = await prisma.buyerProfile.findUnique({
    where: { id: buyerProfileId },
    include: { user: { select: { id: true, status: true } } },
  });
  if (!buyer) return { error: "That buyer profile no longer exists" };

  const allowed = canContactBuyer(actor, {
    userId: buyer.user.id,
    isPublished: buyer.isPublished,
    status: buyer.user.status as UserStatus,
  });
  if (!allowed) return { error: "This buyer is not open for contact right now" };

  try {
    await prisma.contactRequest.create({
      data: {
        initiatorId: actor.id,
        targetId: buyer.user.id,
        buyerProfileId,
        message: parsed.data,
      },
    });
  } catch (error) {
    if (isDuplicate(error)) return { error: "You have already contacted this buyer" };
    throw error;
  }

  revalidatePath(`/buyers/${buyerProfileId}`);
  revalidatePath("/contacts");
  return { ok: "Request sent. The buyer decides whether to open the conversation." };
}

const respondSchema = z.object({
  requestId: z.string().min(1),
  decision: CONTACT_STATUSES.schema.extract(["ACCEPTED", "DECLINED"]),
  note: z.string().max(500).optional(),
});

export async function respondToRequestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await actingUser();
  const parsed = respondSchema.safeParse({
    requestId: str(formData, "requestId"),
    decision: str(formData, "decision"),
    note: str(formData, "note") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const request = await prisma.contactRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { initiator: { select: { status: true } } },
  });
  if (!request) return { error: "Request not found" };

  const view = {
    initiatorId: request.initiatorId,
    targetId: request.targetId,
    status: request.status as ContactStatus,
  };
  if (!canRespondToRequest(actor, view)) {
    return { error: "This request is not yours to answer, or it was already answered" };
  }

  // Accepting releases both sides' contact details, so a request left over from a
  // participant who has since been blocked can only be declined.
  if (parsed.data.decision === "ACCEPTED" && request.initiator.status !== "ACTIVE") {
    return {
      error: "The sender is no longer active on the platform, so this request can only be declined",
    };
  }

  // Answered as a conditional update so a double submit cannot turn a decline
  // into an accept and release details the target withheld.
  const { count } = await prisma.contactRequest.updateMany({
    where: { id: request.id, targetId: actor.id, status: "PENDING" },
    data: {
      status: parsed.data.decision,
      responseNote: parsed.data.note ?? null,
      respondedAt: new Date(),
    },
  });
  if (count === 0) return { error: "This request was already answered" };

  revalidatePath("/contacts");
  return {
    ok:
      parsed.data.decision === "ACCEPTED"
        ? "Accepted. Contact details are now visible to both sides."
        : "Declined. The other side is told, without your contact details.",
  };
}
