import { Brand } from "@/components/brand";
import { AppNav } from "@/components/layout/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { requireActive } from "@/lib/auth/guards";
import { navFor } from "@/lib/nav";
import { LABELS } from "@/lib/domain/enums";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireActive();
  const links = await navFor(user);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3">
          <Brand />
          <div className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
            <AppNav links={links} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-ink">{user.email}</p>
              <Badge tone="brand">{LABELS.role[user.role]}</Badge>
            </div>
            <form action={signOutAction}>
              <Button variant="secondary" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>

      <footer className="border-t border-line px-6 py-4">
        <p className="mx-auto max-w-7xl text-xs text-muted">
          Prototype built for the N5Deal technical assignment. Demo data only.
        </p>
      </footer>
    </div>
  );
}
