"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emptyFormState } from "@/lib/form";

const DEMO_ACCOUNTS = [
  { label: "Buyer", email: "buyer@n5deal.demo", note: "Lindwall Ventures" },
  { label: "Seller", email: "seller@n5deal.demo", note: "Harbour Point Advisory" },
  { label: "Manager", email: "manager@n5deal.demo", note: "Platform moderation" },
  { label: "Suspended", email: "buyer.blocked@n5deal.demo", note: "Blocked account view" },
];

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, emptyFormState);
  const [email, setEmail] = useState("buyer@n5deal.demo");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Marketplace for regulated financial assets and licensed entities.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {state.error ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <SubmitButton className="w-full" pendingLabel="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Demo accounts (password demo1234)
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("demo1234");
              }}
              className="rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-brand/60"
            >
              <span className="block text-sm text-ink">{account.label}</span>
              <span className="block text-[11px] text-muted">{account.note}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-brand hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
