import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";

export const metadata = { title: "Account blocked | N5Deal" };

/**
 * Deliberately outside the (app) group: that layout requires an active account,
 * and this is the one page a blocked one still needs to reach.
 */
export default async function SuspendedPage() {
  const user = await requireUser();
  if (user.status === "ACTIVE") redirect("/");

  const removed = user.status === "REMOVED";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Brand href="/suspended" />
        <form action={signOutAction}>
          <Button variant="secondary" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-12">
        <Card className="w-full max-w-xl p-6">
          <h1 className="text-lg font-semibold text-ink">
            {removed ? "Your account has been removed" : "Your account is suspended"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {removed
              ? "A platform manager removed this account from the marketplace. Listings are archived and open conversations are closed."
              : "A platform manager has paused your access. Your listings and profile are hidden from other participants, and pending outreach is on hold."}
          </p>

          {user.suspendReason ? (
            <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-warning">
                Reason given
              </p>
              <p className="mt-1 text-sm text-ink">{user.suspendReason}</p>
            </div>
          ) : null}

          <p className="mt-4 text-sm text-muted">
            {removed
              ? "Nothing was physically deleted. Contact moderation if you believe this was a mistake."
              : "Nothing has been deleted. Contact moderation with the requested documents and a manager can reinstate the account, which restores your listings exactly as they were."}
          </p>
        </Card>
      </main>
    </div>
  );
}
