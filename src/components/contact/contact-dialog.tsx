"use client";

import { useActionState, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState, type FormAction } from "@/lib/form";

export function ContactDialog({
  action,
  hiddenField,
  hiddenValue,
  title,
  description,
  triggerLabel,
  placeholder,
  disabledReason,
}: {
  action: FormAction;
  hiddenField: string;
  hiddenValue: string;
  title: string;
  description: string;
  triggerLabel: string;
  placeholder: string;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  if (disabledReason) {
    return (
      <div className="rounded-lg border border-line bg-elevated px-4 py-3 text-sm text-muted">
        {disabledReason}
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>{triggerLabel}</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-card focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {description}
          </Dialog.Description>

          {/* On success the parent re-renders this away and shows the request status. */}
          <form action={formAction} className="mt-5 space-y-4">
            <input type="hidden" name={hiddenField} value={hiddenValue} />
            <Field
              label="Message"
              hint="Contact details are exchanged only after the other side accepts."
            >
              <Textarea
                name="message"
                rows={5}
                minLength={30}
                required
                placeholder={placeholder}
              />
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
              <SubmitButton pendingLabel="Sending...">Send request</SubmitButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
