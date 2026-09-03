import { requireActive } from "@/lib/auth/guards";
import { BuyerDashboard } from "./buyer-dashboard";
import { ManagerOverview } from "./manager-overview";
import { SellerDashboard } from "./seller-dashboard";

export const metadata = { title: "Dashboard | N5Deal" };

export default async function DashboardPage() {
  const user = await requireActive();

  if (user.role === "MANAGER") return <ManagerOverview />;
  if (user.role === "SELLER") return <SellerDashboard userId={user.id} />;
  return <BuyerDashboard userId={user.id} />;
}
