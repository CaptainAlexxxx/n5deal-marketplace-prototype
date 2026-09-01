"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-lg p-6 text-center">
      <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        The action could not be completed. If your account status changed while this tab
        was open, sign in again.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => window.location.assign("/")}>
          Back to dashboard
        </Button>
      </div>
    </Card>
  );
}
