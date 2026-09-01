"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { emptyFormState } from "@/lib/form";

const ROLE_CHOICES = [
  {
    value: "BUYER",
    title: "I am buying",
    blurb: "Describe your acquisition interests and browse listed assets.",
  },
  {
    value: "SELLER",
    title: "I am selling",
    blurb: "Publish assets and approach buyers whose mandate fits.",
  },
];

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, emptyFormState);
  const [role, setRole] = useState("BUYER");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-muted">
          Platform manager accounts are created by N5Deal, not through this form.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="grid gap-2">
          {ROLE_CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => setRole(choice.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                role === choice.value
                  ? "border-brand bg-brand/10"
                  : "border-line hover:border-brand/50",
              )}
            >
              <span className="block text-sm font-medium text-ink">{choice.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{choice.blurb}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />

        <Field label={role === "BUYER" ? "Your name or fund" : "Company name"}>
          <Input name="name" required minLength={2} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        {state.error ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <SubmitButton className="w-full" pendingLabel="Creating...">
          Create account
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
