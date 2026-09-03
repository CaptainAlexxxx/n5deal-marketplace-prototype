"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/domain/enums";
import { firstIssue, str, type FormState } from "@/lib/form";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Tell us who you are"),
  // Manager accounts are provisioned by the platform, not through this form.
  role: ROLES.schema.exclude(["MANAGER"], {
    errorMap: () => ({ message: "Choose whether you are buying or selling" }),
  }),
});

/** Only same-site paths are accepted, otherwise the redirect is an open door. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: safeNext(str(formData, "next")),
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email or password is wrong" };
    throw error;
  }
  return {};
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
    name: str(formData, "name"),
    role: str(formData, "role"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { email, password, name, role } = parsed.data;
  const normalised = email.toLowerCase();

  const passwordHash = await bcrypt.hash(password, 10);

  // Profiles start unpublished. Both roles have to complete onboarding before
  // they appear in the marketplace or can contact anyone.
  try {
    await prisma.user.create({
      data: {
        email: normalised,
        passwordHash,
        role,
        ...(role === "BUYER"
          ? {
              buyerProfile: {
                create: {
                  displayName: name,
                  headline: "",
                  thesis: "",
                  investorType: "FINANCIAL",
                  timeline: "EXPLORING",
                  ticketMinEur: 0,
                  ticketMaxEur: 0,
                  contactName: name,
                  isPublished: false,
                },
              },
            }
          : {
              sellerProfile: {
                create: { companyName: name, about: "", contactName: name },
              },
            }),
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { error: "That email is already registered" };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email: normalised, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, please sign in" };
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
