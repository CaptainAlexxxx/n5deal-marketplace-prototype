import { describe, expect, it } from "vitest";
import {
  MAX_INT,
  activeFilterCount,
  parseFilters,
  type ParsedFilters,
  type SearchConfig,
} from "./params";

const config: SearchConfig = {
  searchPlaceholder: "Search",
  facets: [
    {
      kind: "multi",
      key: "category",
      label: "Category",
      options: [
        { value: "emi", label: "EMI" },
        { value: "bank", label: "Bank" },
      ],
    },
    { kind: "range", key: "price", label: "Price" },
  ],
  sorts: [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price" },
  ],
  defaultSort: "newest",
};

describe("parseFilters defaults", () => {
  it("returns empty filters for empty input", () => {
    expect(parseFilters({}, config)).toEqual({
      q: "",
      multi: { category: [] },
      range: { price: { min: null, max: null } },
      sort: "newest",
      page: 1,
    });
  });
});

describe("multi facets", () => {
  it("keeps declared values, drops unknown ones", () => {
    expect(parseFilters({ category: ["emi", "evil", "bank"] }, config).multi.category).toEqual([
      "emi",
      "bank",
    ]);
  });

  it("accepts a single string value", () => {
    expect(parseFilters({ category: "bank" }, config).multi.category).toEqual(["bank"]);
  });

  it("ignores undeclared facet keys entirely", () => {
    const f = parseFilters({ secret: "1", secret_min: "5" }, config);
    expect(Object.keys(f.multi)).toEqual(["category"]);
    expect(Object.keys(f.range)).toEqual(["price"]);
  });

  it("is case sensitive on values", () => {
    expect(parseFilters({ category: "EMI" }, config).multi.category).toEqual([]);
  });
});

describe("range facets", () => {
  const price = (raw: Record<string, string | string[]>) =>
    parseFilters(raw, config).range.price;

  it("parses min and max", () => {
    expect(price({ price_min: "100", price_max: "500" })).toEqual({ min: 100, max: 500 });
  });

  it("swaps a reversed range", () => {
    expect(price({ price_min: "500", price_max: "100" })).toEqual({ min: 100, max: 500 });
  });

  it("keeps equal bounds", () => {
    expect(price({ price_min: "5", price_max: "5" })).toEqual({ min: 5, max: 5 });
  });

  it("accepts zero but not negatives", () => {
    expect(price({ price_min: "0" })).toEqual({ min: 0, max: null });
    expect(price({ price_min: "-1" })).toEqual({ min: null, max: null });
  });

  it("floors decimals", () => {
    expect(price({ price_min: "10.9" })).toEqual({ min: 10, max: null });
  });

  it("drops non-numeric and non-finite input", () => {
    expect(price({ price_min: "abc", price_max: "Infinity" })).toEqual({ min: null, max: null });
    expect(price({ price_min: "", price_max: "NaN" })).toEqual({ min: null, max: null });
  });

  it("clamps to the Int column ceiling", () => {
    expect(price({ price_max: "99999999999999" }).max).toBe(MAX_INT);
  });

  it("uses the first value when a param is repeated", () => {
    expect(price({ price_min: ["7", "9"] }).min).toBe(7);
  });
});

describe("sort", () => {
  it("accepts declared sorts", () => {
    expect(parseFilters({ sort: "price_asc" }, config).sort).toBe("price_asc");
  });

  it("falls back to the default for unknown sorts", () => {
    expect(parseFilters({ sort: "; DROP TABLE" }, config).sort).toBe("newest");
  });
});

describe("page", () => {
  const page = (p: string | string[] | undefined) => parseFilters({ page: p }, config).page;

  it("parses valid pages", () => {
    expect(page("3")).toBe(3);
  });

  it("clamps to at least 1", () => {
    expect(page("0")).toBe(1);
    expect(page("-5")).toBe(1);
  });

  it("clamps to 10000", () => {
    expect(page("10001")).toBe(10_000);
    expect(page("999999999999")).toBe(10_000);
  });

  it("falls back to 1 on garbage", () => {
    expect(page("abc")).toBe(1);
    expect(page(undefined)).toBe(1);
    expect(page("")).toBe(1);
  });

  it("floors decimals", () => {
    expect(page("2.9")).toBe(2);
  });
});

describe("q", () => {
  it("trims whitespace", () => {
    expect(parseFilters({ q: "  bank  " }, config).q).toBe("bank");
  });

  it("truncates to 120 characters", () => {
    expect(parseFilters({ q: "a".repeat(500) }, config).q).toHaveLength(120);
  });

  it("uses the first of repeated values", () => {
    expect(parseFilters({ q: ["one", "two"] }, config).q).toBe("one");
  });
});

describe("activeFilterCount", () => {
  it("counts multi values, range bounds and q", () => {
    const f = parseFilters(
      { category: ["emi", "bank"], price_min: "1", price_max: "2", q: "x" },
      config,
    );
    expect(activeFilterCount(f)).toBe(5);
  });

  it("ignores sort and page", () => {
    expect(activeFilterCount(parseFilters({ sort: "price_asc", page: "4" }, config))).toBe(0);
  });

  it("counts a zero bound as active", () => {
    expect(activeFilterCount(parseFilters({ price_min: "0" }, config))).toBe(1);
  });
});

describe("round trip", () => {
  const serialise = (f: ParsedFilters) => {
    const sp = new URLSearchParams();
    if (f.q) sp.set("q", f.q);
    for (const [k, vs] of Object.entries(f.multi)) vs.forEach((v) => sp.append(k, v));
    for (const [k, r] of Object.entries(f.range)) {
      if (r.min !== null) sp.set(`${k}_min`, String(r.min));
      if (r.max !== null) sp.set(`${k}_max`, String(r.max));
    }
    sp.set("sort", f.sort);
    sp.set("page", String(f.page));
    return sp;
  };

  const toRaw = (sp: URLSearchParams) => {
    const raw: Record<string, string | string[]> = {};
    for (const k of new Set(sp.keys())) {
      const all = sp.getAll(k);
      raw[k] = all.length > 1 ? all : all[0];
    }
    return raw;
  };

  it("parse(serialise(parse(x))) equals parse(x)", () => {
    const first = parseFilters(
      {
        q: " fintech ",
        category: ["emi", "bad", "bank"],
        price_min: "900",
        price_max: "100",
        sort: "price_asc",
        page: "7",
      },
      config,
    );
    expect(parseFilters(toRaw(serialise(first)), config)).toEqual(first);
  });
});
