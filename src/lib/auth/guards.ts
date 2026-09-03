import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role, UserStatus } from "@/lib/domain/enums";
import type { Actor } from "./policies";

export type CurrentUser = Actor & {
  email: string;
  suspendReason: string | null;
};

/**
 * Status is re-read per request rather than trusted from the token, so a
 * suspension lands on the next click. Removed accounts are still resolved: their
 * cookie outlives the removal and they need somewhere to read the reason.
 */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true, suspendReason: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    status: user.status as UserStatus,
    suspendReason: user.suspendReason,
  };
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireActive() {
  const user = await requireUser();
  if (user.status !== "ACTIVE") redirect("/suspended");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireActive();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** Server actions need a thrown error rather than a redirect. */
export async function actingUser(...roles: Role[]) {
  const user = await currentUser();
  if (!user) throw new Error("Not signed in");
  if (user.status !== "ACTIVE") throw new Error("Account is suspended");
  if (roles.length && !roles.includes(user.role)) throw new Error("Not allowed");
  return user;
}
