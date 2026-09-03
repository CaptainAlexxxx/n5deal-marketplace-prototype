"use client";

import { useActionState } from "react";
import { saveSellerProfileAction } from "@/app/actions/profile";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form";

export type SellerProfileValues = {
  companyName: string;
  about: string;
  website: string | null;
  contactName: string;
  phone: string | null;
};

export function SellerProfileForm({ values }: { values: SellerProfileValues }) {
  const [state, action] = useActionState(saveSellerProfileAction, emptyFormState);

  return (
    <form action={action} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Company profile</h1>
        <p className="mt-1 text-sm text-muted">
          Buyers see the company name and description on every listing you publish.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive">
          {state.ok}
        </p>
      ) : null}

      <Card>
        <CardHeader title="Company" />
        <div className="space-y-4 p-5">
          <Field label="Company name">
            <Input name="companyName" defaultValue={values.companyName} required />
          </Field>
          <Field
            label="About"
            hint="What kind of mandates you take and how you prepare them."
          >
            <Textarea name="about" rows={5} defaultValue={values.about} />
          </Field>
          <Field label="Website">
            <Input
              name="website"
              type="url"
              defaultValue={values.website ?? ""}
              placeholder="https://"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Contact details"
          description="Released to a buyer only after you accept their request."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Contact name">
            <Input name="contactName" defaultValue={values.contactName} required />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={values.phone ?? ""} />
          </Field>
        </div>
      </Card>

      <SubmitButton pendingLabel="Saving...">Save profile</SubmitButton>
    </form>
  );
}
