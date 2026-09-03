"use client";

import { useActionState, useState } from "react";
import { saveAssetAction } from "@/app/actions/asset";
import { Card, CardHeader } from "@/components/ui/card";
import { CheckboxRow, Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { optionsFor } from "@/lib/domain/enums";
import type { Option } from "@/lib/search/params";
import { emptyFormState } from "@/lib/form";

export type AssetFormValues = {
  id: string | null;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  countrySlug: string;
  licenseType: string;
  regulator: string;
  businessStatus: string;
  askingPriceEur: number | "";
  annualRevenueEur: number | "";
  ebitdaEur: number | "";
  employees: number | "";
  yearOfIssue: number | "";
  benefitSlugs: string[];
  status: string;
};

export function AssetForm({
  values,
  categories,
  countries,
  benefits,
  savedNotice,
}: {
  values: AssetFormValues;
  categories: Option[];
  countries: Option[];
  benefits: Option[];
  savedNotice?: boolean;
}) {
  const [state, action] = useActionState(saveAssetAction, emptyFormState);
  const [publish, setPublish] = useState(values.status === "PUBLISHED");
  const locked = values.status === "SUSPENDED";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="assetId" value={values.id ?? ""} />

      <div>
        <h1 className="text-2xl font-semibold text-ink">
          {values.id ? "Edit listing" : "New listing"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Drafts are private. Publishing puts the listing in front of buyers.
        </p>
      </div>

      {locked ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          A platform manager suspended this listing. Contact moderation to have it
          reviewed; edits are blocked until then.
        </p>
      ) : null}
      {savedNotice && !state.ok && !state.error ? (
        <p className="rounded-lg border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive">
          Listing created. Keep editing or publish when it is ready.
        </p>
      ) : null}
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

      <fieldset disabled={locked} className="space-y-6">
        <Card>
          <CardHeader title="Listing" />
          <div className="space-y-4 p-5">
            <Field label="Title">
              <Input
                name="title"
                defaultValue={values.title}
                required
                placeholder="Maltese EMI with live IBAN issuing"
              />
            </Field>
            <Field label="Summary" hint="One or two lines shown on the card.">
              <Textarea name="summary" rows={2} defaultValue={values.summary} maxLength={300} />
            </Field>
            <Field label="Full description">
              <Textarea name="description" rows={8} defaultValue={values.description} />
            </Field>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Regulatory" />
            <div className="space-y-4 p-5">
              <Field label="Business category">
                <Select name="categorySlug" defaultValue={values.categorySlug} required>
                  <option value="">Select</option>
                  {categories.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Jurisdiction">
                <Select name="countrySlug" defaultValue={values.countrySlug} required>
                  <option value="">Select</option>
                  {countries.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Licence type">
                <Select name="licenseType" defaultValue={values.licenseType}>
                  {optionsFor("licenseType").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Regulator" hint="The authority named on the licence.">
                <Input name="regulator" defaultValue={values.regulator} placeholder="MFSA" />
              </Field>
              <Field label="Licence issued in">
                <Input
                  name="yearOfIssue"
                  type="number"
                  min={1900}
                  defaultValue={values.yearOfIssue}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Commercials" />
            <div className="space-y-4 p-5">
              <Field label="Entity type">
                <Select name="businessStatus" defaultValue={values.businessStatus}>
                  {optionsFor("businessStatus").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Asking price (EUR)">
                <Input
                  name="askingPriceEur"
                  type="number"
                  min={1}
                  defaultValue={values.askingPriceEur}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Annual revenue (EUR)">
                  <Input
                    name="annualRevenueEur"
                    type="number"
                    min={0}
                    defaultValue={values.annualRevenueEur}
                  />
                </Field>
                <Field label="EBITDA (EUR)">
                  <Input name="ebitdaEur" type="number" defaultValue={values.ebitdaEur} />
                </Field>
              </div>
              <Field label="Employees">
                <Input
                  name="employees"
                  type="number"
                  min={0}
                  defaultValue={values.employees}
                />
              </Field>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="What is included"
            description="Shown as tags on the listing card."
          />
          <div className="grid gap-x-2 p-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <CheckboxRow
                key={benefit.value}
                name="benefits"
                value={benefit.value}
                label={benefit.label}
                defaultChecked={values.benefitSlugs.includes(benefit.value)}
              />
            ))}
          </div>
        </Card>

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
              Publish to the marketplace
              <span className="ml-2 text-xs text-muted">
                Needs a full summary and description.
              </span>
            </span>
          </label>
          <SubmitButton pendingLabel="Saving...">
            {publish ? "Save and publish" : "Save draft"}
          </SubmitButton>
        </Card>
      </fieldset>
    </form>
  );
}
