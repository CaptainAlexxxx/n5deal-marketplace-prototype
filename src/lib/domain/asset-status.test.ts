import { describe, expect, it } from "vitest";
import { applyTransition } from "./asset-status";

const earlier = new Date("2026-01-01T00:00:00Z");
const now = new Date("2026-06-01T00:00:00Z");

describe("applyTransition", () => {
  it("stamps publishedAt on the first publish", () => {
    expect(applyTransition({ status: "DRAFT", publishedAt: null }, "PUBLISHED", now)).toEqual({
      status: "PUBLISHED",
      publishedAt: now,
    });
  });

  it("keeps publishedAt when a published listing is saved again", () => {
    expect(
      applyTransition({ status: "PUBLISHED", publishedAt: earlier }, "PUBLISHED", now).publishedAt,
    ).toBe(earlier);
  });

  it("resets publishedAt when republishing from the archive", () => {
    expect(
      applyTransition({ status: "ARCHIVED", publishedAt: earlier }, "PUBLISHED", now).publishedAt,
    ).toBe(now);
  });

  it("keeps publishedAt when moving away from published", () => {
    expect(
      applyTransition({ status: "PUBLISHED", publishedAt: earlier }, "ARCHIVED", now),
    ).toEqual({ status: "ARCHIVED", publishedAt: earlier });
  });
});
