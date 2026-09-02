"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { respondToRequestAction } from "@/app/actions/contact";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form";

export function RespondForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(respondToRequestAction, emptyFormState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <Input
        name="note"
        maxLength={500}
        placeholder="Optional note back to them"
        className="text-xs"
      />
      <div className="flex gap-2">
        <SubmitButton name="decision" value="ACCEPTED" size="sm">
          Accept and share contacts
        </SubmitButton>
        <SubmitButton name="decision" value="DECLINED" variant="ghost" size="sm">
          Decline
        </SubmitButton>
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}
