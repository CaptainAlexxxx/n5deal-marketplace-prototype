"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAssetStatusAction } from "@/app/actions/asset";
import { LinkButton } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form";

export function AssetStatusActions({
  assetId,
  status,
}: {
  assetId: string;
  status: string;
}) {
  const [state, action] = useActionState(setAssetStatusAction, emptyFormState);
  const router = useRouter();

  // Depends on the state object, not on state.ok: two successful changes in a
  // row return the same string and the refresh would stop firing.
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton href={`/my-assets/${assetId}/edit`} variant="secondary" size="sm">
          Edit
        </LinkButton>

        {status === "SUSPENDED" ? (
          <span className="text-xs text-danger">Suspended by moderation</span>
        ) : (
          <form action={action} className="flex gap-2">
            <input type="hidden" name="assetId" value={assetId} />
            {status === "PUBLISHED" ? (
              <>
                <SubmitButton name="next" value="DRAFT" variant="ghost" size="sm">
                  Unpublish
                </SubmitButton>
                <SubmitButton name="next" value="ARCHIVED" variant="ghost" size="sm">
                  Archive
                </SubmitButton>
              </>
            ) : (
              <SubmitButton name="next" value="PUBLISHED" size="sm">
                Publish
              </SubmitButton>
            )}
          </form>
        )}
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
    </div>
  );
}
