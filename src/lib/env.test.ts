import { describe, expect, it } from "vitest";
import { assertProductionEnv, isDemoMode } from "./env";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("assertProductionEnv", () => {
  it("ignores non-production", () => {
    expect(() => assertProductionEnv(env({ NODE_ENV: "development" }))).not.toThrow();
  });

  it("rejects a missing or blank secret in production", () => {
    expect(() => assertProductionEnv(env({ NODE_ENV: "production" }))).toThrow(/not set/);
    expect(() => assertProductionEnv(env({ NODE_ENV: "production", AUTH_SECRET: " " }))).toThrow(
      /not set/,
    );
  });

  it("rejects the demo secrets in production", () => {
    for (const AUTH_SECRET of [
      "dev-only-secret-not-for-any-deployment-2f8c1a9b47e3",
      "dev-only-secret-do-not-use-in-production-2f8c1a9b47e3",
    ]) {
      expect(() => assertProductionEnv(env({ NODE_ENV: "production", AUTH_SECRET }))).toThrow(
        /demo value/,
      );
    }
  });

  it("accepts a real secret", () => {
    expect(() =>
      assertProductionEnv(env({ NODE_ENV: "production", AUTH_SECRET: "x".repeat(44) })),
    ).not.toThrow();
  });
});

describe("isDemoMode", () => {
  it("is only on for the exact string true", () => {
    expect(isDemoMode(env({ DEMO_MODE: "true" }))).toBe(true);
    expect(isDemoMode(env({ DEMO_MODE: "1" }))).toBe(false);
    expect(isDemoMode(env({}))).toBe(false);
  });
});
