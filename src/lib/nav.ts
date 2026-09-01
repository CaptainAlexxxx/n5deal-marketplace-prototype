import type { NavLink } from "@/components/layout/app-nav";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/domain/enums";

export async function navFor(user: { id: string; role: Role }): Promise<NavLink[]> {
  if (user.role === "MANAGER") {
    return [
      { href: "/", label: "Overview" },
      { href: "/admin/participants", label: "Participants" },
      { href: "/admin/assets", label: "Assets" },
      { href: "/admin/log", label: "Moderation log" },
    ];
  }

  const pending = await prisma.contactRequest.count({
    where: { targetId: user.id, status: "PENDING" },
  });

  if (user.role === "BUYER") {
    return [
      { href: "/", label: "Dashboard" },
      { href: "/assets", label: "Assets" },
      { href: "/contacts", label: "Contacts", badge: pending },
      { href: "/profile", label: "My profile" },
    ];
  }

  return [
    { href: "/", label: "Dashboard" },
    { href: "/buyers", label: "Buyers" },
    { href: "/my-assets", label: "My listings" },
    { href: "/contacts", label: "Contacts", badge: pending },
    { href: "/profile", label: "Company" },
  ];
}
