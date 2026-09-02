// Facet definitions and the query-string round-trip, shared by the asset, buyer
// and participant catalogues.

export const PAGE_SIZE = 12;

/** Int column ceiling. Anything wider is clamped before it reaches Prisma. */
export const MAX_INT = 2_147_483_647;

export type Option = { value: string; label: string };

export type MultiFacet = {
  kind: "multi";
  key: string;
  label: string;
  options: Option[];
  collapsedAfter?: number;
};

export type RangeFacet = {
  kind: "range";
  key: string;
  label: string;
  placeholderMin?: string;
  placeholderMax?: string;
};

export type Facet = MultiFacet | RangeFacet;

export type SearchConfig = {
  searchPlaceholder: string;
  facets: Facet[];
  sorts: Option[];
  defaultSort: string;
};

export type ParsedFilters = {
  q: string;
  multi: Record<string, string[]>;
  range: Record<string, { min: number | null; max: number | null }>;
  sort: string;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const list = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

function toNumber(value: string | string[] | undefined) {
  const raw = one(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(Math.floor(parsed), MAX_INT);
}

/** Anything not declared in the config is dropped before it reaches Prisma. */
export function parseFilters(
  raw: RawSearchParams,
  config: SearchConfig,
): ParsedFilters {
  const multi: ParsedFilters["multi"] = {};
  const range: ParsedFilters["range"] = {};

  for (const facet of config.facets) {
    if (facet.kind === "multi") {
      const allowed = new Set(facet.options.map((o) => o.value));
      multi[facet.key] = list(raw[facet.key]).filter((v) => allowed.has(v));
    } else {
      const min = toNumber(raw[`${facet.key}_min`]);
      const max = toNumber(raw[`${facet.key}_max`]);
      // A range typed the wrong way round is a slip, so read it in order.
      const flipped = min !== null && max !== null && min > max;
      range[facet.key] = flipped ? { min: max, max: min } : { min, max };
    }
  }

  const sortRaw = one(raw.sort);
  const sort = config.sorts.some((s) => s.value === sortRaw)
    ? (sortRaw as string)
    : config.defaultSort;

  const page = Math.max(1, Math.min(Math.floor(Number(one(raw.page)) || 1), 10_000));

  return { q: (one(raw.q) ?? "").trim().slice(0, 120), multi, range, sort, page };
}

export function activeFilterCount(filters: ParsedFilters) {
  const multi = Object.values(filters.multi).reduce((sum, v) => sum + v.length, 0);
  const range = Object.values(filters.range).reduce(
    (sum, v) => sum + (v.min !== null ? 1 : 0) + (v.max !== null ? 1 : 0),
    0,
  );
  return multi + range + (filters.q ? 1 : 0);
}
