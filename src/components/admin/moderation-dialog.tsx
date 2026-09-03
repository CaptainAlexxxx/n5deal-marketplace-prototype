"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState, type FormAction } from "@/lib/form";

export function ModerationDialog({
  action,
  targetId,
  targetLabel,
  triggerLabel,
  title,
  description,
  confirmLabel,
  tone = "secondary",
}: {
  action: FormAction;
  targetId: string;
  targetLabel: string;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary" | "secondary";
}) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant={tone} size="sm">
          {triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-card focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            <span className="font-medium text-ink">{targetLabel}</span>. {description}
          </Dialog.Description>

          {state.ok ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
                {state.ok}
              </p>
              <Dialog.Close asChild>
                <Button variant="secondary" className="w-full">
                  Close
                </Button>
              </Dialog.Close>
            </div>
          ) : (
            <form action={formAction} className="mt-5 space-y-4">
              <input type="hidden" name="targetId" value={targetId} />
              <Field label="Reason" hint="Between 10 and 500 characters.">
                <Textarea name="reason" rows={4} minLength={10} maxLength={500} required />
              </Field>

              {state.error ? (
                <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {state.error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                </Dialog.Close>
                <SubmitButton variant={tone} pendingLabel="Saving...">
                  {confirmLabel}
                </SubmitButton>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
