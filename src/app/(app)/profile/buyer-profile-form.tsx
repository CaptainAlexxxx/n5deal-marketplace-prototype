"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBuyerProfileAction } from "@/app/actions/profile";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { CheckboxRow, Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { optionsFor } from "@/lib/domain/enums";
import type { Option } from "@/lib/search/params";
import { emptyFormState } from "@/lib/form";

export type BuyerProfileValues = {
  displayName: string;
  headline: string;
  thesis: string;
  investorType: string;
  timeline: string;
  ticketMinEur: number;
  ticketMaxEur: number;
  preferredBusinessStatus: string | null;
  contactName: string;
  phone: string | null;
  isPublished: boolean;
  categorySlugs: string[];
  countrySlugs: string[];
};

export function BuyerProfileForm({
  values,
  categories,
  countries,
}: {
  values: BuyerProfileValues;
  categories: Option[];
  countries: Option[];
}) {
  const [state, action] = useActionState(saveBuyerProfileAction, emptyFormState);
  const [publish, setPublish] = useState(values.isPublished);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Your buyer profile</h1>
          <p className="mt-1 text-sm text-muted">
            This is what sellers see before they decide whether to approach you.
          </p>
        </div>
        <Badge tone={values.isPublished ? "positive" : "warning"}>
          {values.isPublished ? "Published" : "Not published"}
        </Badge>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Identity" description="Shown on your card in the buyer list." />
          <div className="space-y-4 p-5">
            <Field label="Display name">
              <Input name="displayName" defaultValue={values.displayName} required />
            </Field>
            <Field label="Headline" hint="One line that tells a seller what you want.">
              <Input
                name="headline"
                defaultValue={values.headline}
                maxLength={120}
                placeholder="EEA e-money licences with live IBAN issuing"
              />
            </Field>
            <Field label="Contact name">
              <Input name="contactName" defaultValue={values.contactName} required />
            </Field>
            <Field label="Phone" hint="Released only after you accept an approach.">
              <Input name="phone" defaultValue={values.phone ?? ""} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Mandate" description="Drives both filtering and fit scoring." />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Investor type">
                <Select name="investorType" defaultValue={values.investorType}>
                  {optionsFor("investorType").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Readiness">
                <Select name="timeline" defaultValue={values.timeline}>
                  {optionsFor("timeline").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ticket from (EUR)">
                <Input
                  name="ticketMinEur"
                  type="number"
                  min={0}
                  defaultValue={values.ticketMinEur}
                />
              </Field>
              <Field label="Ticket to (EUR)">
                <Input
                  name="ticketMaxEur"
                  type="number"
                  min={0}
                  defaultValue={values.ticketMaxEur}
                />
              </Field>
            </div>
            <Field label="Entity preference">
              <Select
                name="preferredBusinessStatus"
                defaultValue={values.preferredBusinessStatus ?? ""}
              >
                <option value="">Either</option>
                {optionsFor("businessStatus").map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Investment thesis"
          description="The more specific this is, the fewer irrelevant approaches you get."
        />
        <div className="p-5">
          <Textarea
            name="thesis"
            rows={6}
            defaultValue={values.thesis}
            placeholder="We operate a payroll platform in the Nordics and need our own EMI rather than a sponsor bank..."
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Business categories" />
          <div className="p-3">
            {categories.map((option) => (
              <CheckboxRow
                key={option.value}
                name="categories"
                value={option.value}
                label={option.label}
                defaultChecked={values.categorySlugs.includes(option.value)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Target jurisdictions" />
          <div className="grid grid-cols-2 gap-x-2 p-3">
            {countries.map((option) => (
              <CheckboxRow
                key={option.value}
                name="countries"
                value={option.value}
                label={option.label}
                defaultChecked={values.countrySlugs.includes(option.value)}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="publish"
            checked={publish}
            onChange={(event) => setPublish(event.target.checked)}
            className="h-4 w-4 rounded border-line bg-surface accent-brand"
          />
          <span className="text-sm text-ink">
            Publish my profile to sellers
            <span className="ml-2 text-xs text-muted">
              Required before you can contact anyone.
            </span>
          </span>
        </label>
        <SubmitButton pendingLabel="Saving...">
          {publish ? "Save and publish" : "Save as draft"}
        </SubmitButton>
      </Card>
    </form>
  );
}
