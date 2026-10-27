import { describe, expect, it } from "vitest";
import { assetFactsFrom, buyerFactsFrom, matchAsset, type BuyerFacts } from "./match";

type Facts = Parameters<typeof matchAsset>[0];

const asset = (over: Partial<Facts> = {}): Facts => ({
  categorySlug: "emi",
  categoryName: "EMI",
  countrySlug: "lt",
  countryName: "Lithuania",
  askingPriceEur: 500_000,
  businessStatus: "ACTIVE_BUSINESS",
  ...over,
});

const buyer = (over: Partial<BuyerFacts> = {}): BuyerFacts => ({
  categorySlugs: ["emi"],
  countrySlugs: ["lt"],
  ticketMinEur: 100_000,
  ticketMaxEur: 1_000_000,
  preferredBusinessStatus: "ACTIVE_BUSINESS",
  ...over,
});

describe("matchAsset scoring", () => {
  it("scores 100 and strong on a full match", () => {
    const r = matchAsset(asset(), buyer());
    expect(r.score).toBe(100);
    expect(r.label).toBe("strong");
    expect(r.misses).toEqual([]);
    expect(r.reasons).toEqual([
      "Targets emi assets",
      "Looking in Lithuania",
      "Asking price sits inside their ticket range",
      "Wants a trading business",
    ]);
  });

  it("weights category 35, country 25, budget 30, entity 10", () => {
    const none = buyer({
      categorySlugs: ["x"],
      countrySlugs: ["x"],
      ticketMinEur: 1,
      ticketMaxEur: 2,
      preferredBusinessStatus: "LICENSE_ONLY",
    });
    expect(matchAsset(asset(), none).score).toBe(0);
    expect(matchAsset(asset(), { ...none, categorySlugs: ["emi"] }).score).toBe(35);
    expect(matchAsset(asset(), { ...none, countrySlugs: ["lt"] }).score).toBe(25);
    expect(matchAsset(asset(), { ...none, ticketMinEur: 0, ticketMaxEur: 600_000 }).score).toBe(
      30,
    );
    expect(
      matchAsset(asset(), { ...none, preferredBusinessStatus: "ACTIVE_BUSINESS" }).score,
    ).toBe(10);
  });

  it("lowercases the category name in the reason", () => {
    const r = matchAsset(asset({ categoryName: "Payment Institution" }), buyer());
    expect(r.reasons[0]).toBe("Targets payment institution assets");
  });
});

describe("jurisdictions and categories", () => {
  it("reports a miss when the buyer lists other jurisdictions", () => {
    const r = matchAsset(asset({ countrySlug: "mt" }), buyer());
    expect(r.misses).toContain("Outside their target jurisdictions");
    expect(r.score).toBe(75);
  });

  it("reports a category miss", () => {
    const r = matchAsset(asset({ categorySlug: "bank" }), buyer());
    expect(r.misses).toContain("Different business category");
    expect(r.score).toBe(65);
  });

  it("gives no points and no miss when the buyer listed none", () => {
    const r = matchAsset(asset(), buyer({ categorySlugs: [], countrySlugs: [] }));
    expect(r.score).toBe(40);
    expect(r.misses).toEqual([]);
  });

  it("matches any of several jurisdictions", () => {
    const r = matchAsset(asset(), buyer({ countrySlugs: ["de", "lt", "fr"] }));
    expect(r.reasons).toContain("Looking in Lithuania");
  });
});

describe("ticket range", () => {
  const withPrice = (p: number) => matchAsset(asset({ askingPriceEur: p }), buyer());

  it("includes both boundaries", () => {
    expect(withPrice(100_000).reasons).toContain("Asking price sits inside their ticket range");
    expect(withPrice(1_000_000).reasons).toContain("Asking price sits inside their ticket range");
  });

  it("misses one euro outside either boundary", () => {
    expect(withPrice(99_999).misses).toContain("Below their ticket range");
    expect(withPrice(1_000_001).misses).toContain("Above their ticket range");
    expect(withPrice(1_000_001).score).toBe(70);
  });

  it("treats ticketMax 0 as no budget set: no points and no miss", () => {
    const r = matchAsset(asset(), buyer({ ticketMinEur: 0, ticketMaxEur: 0 }));
    expect(r.score).toBe(70);
    expect(r.misses).toEqual([]);
    expect(r.reasons.some((x) => x.includes("ticket"))).toBe(false);
  });
});

describe("entity preference", () => {
  it("awards the points with no reason when there is no preference", () => {
    const r = matchAsset(asset(), buyer({ preferredBusinessStatus: null }));
    expect(r.score).toBe(100);
    expect(r.reasons).toHaveLength(3);
  });

  it("words the reason for a licence-only match", () => {
    const r = matchAsset(
      asset({ businessStatus: "LICENSE_ONLY" }),
      buyer({ preferredBusinessStatus: "LICENSE_ONLY" }),
    );
    expect(r.reasons).toContain("Wants a licence without operations");
  });

  it("reports a miss on mismatch", () => {
    const r = matchAsset(asset(), buyer({ preferredBusinessStatus: "LICENSE_ONLY" }));
    expect(r.misses).toContain("Prefers a different kind of entity");
    expect(r.score).toBe(90);
  });
});

describe("labels", () => {
  const badBudget = { ticketMinEur: 1, ticketMaxEur: 2 };

  it("is strong at exactly 75", () => {
    const r = matchAsset(asset(), buyer({ countrySlugs: ["x"] }));
    expect(r.score).toBe(75);
    expect(r.label).toBe("strong");
  });

  it("is partial at 70, just under strong", () => {
    const r = matchAsset(asset(), buyer(badBudget));
    expect(r.score).toBe(70);
    expect(r.label).toBe("partial");
  });

  it("is partial at exactly 45", () => {
    const r = matchAsset(asset(), buyer({ countrySlugs: ["x"], ...badBudget }));
    expect(r.score).toBe(45);
    expect(r.label).toBe("partial");
  });

  it("is weak at 40, just under partial", () => {
    const r = matchAsset(asset(), buyer({ categorySlugs: [], countrySlugs: [] }));
    expect(r.score).toBe(40);
    expect(r.label).toBe("weak");
  });
});

describe("determinism", () => {
  it("returns equal results for equal input and does not mutate it", () => {
    const a = asset();
    const b = buyer();
    const before = JSON.stringify([a, b]);
    expect(matchAsset(a, b)).toEqual(matchAsset(a, b));
    expect(JSON.stringify([a, b])).toBe(before);
  });
});

describe("fact mappers", () => {
  it("flattens asset relations", () => {
    expect(
      assetFactsFrom({
        category: { slug: "emi", name: "EMI" },
        country: { slug: "lt", name: "Lithuania" },
        askingPriceEur: 1,
        businessStatus: "LICENSE_ONLY",
      }),
    ).toEqual({
      categorySlug: "emi",
      categoryName: "EMI",
      countrySlug: "lt",
      countryName: "Lithuania",
      askingPriceEur: 1,
      businessStatus: "LICENSE_ONLY",
    });
  });

  it("flattens buyer join rows", () => {
    expect(
      buyerFactsFrom({
        categories: [{ category: { slug: "a" } }, { category: { slug: "b" } }],
        countries: [{ country: { slug: "lt" } }],
        ticketMinEur: 1,
        ticketMaxEur: 2,
        preferredBusinessStatus: null,
      }),
    ).toEqual({
      categorySlugs: ["a", "b"],
      countrySlugs: ["lt"],
      ticketMinEur: 1,
      ticketMaxEur: 2,
      preferredBusinessStatus: null,
    });
  });
});
