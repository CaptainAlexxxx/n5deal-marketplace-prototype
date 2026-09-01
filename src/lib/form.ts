import { z } from "zod";

export type FormState = { error?: string; ok?: string };

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export const emptyFormState: FormState = {};

/** Turns a zod failure into the first readable message for the form banner. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function num(formData: FormData, key: string) {
  const value = str(formData, key);
  if (value === "") return null;
  const parsed = Number(value.replace(/[\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function many(formData: FormData, key: string) {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}
