"use client";

import { X } from "lucide-react";
import type { Facet, ParsedFilters } from "@/lib/search/params";
import { useFilterNav } from "./use-filter-nav";

type Chip = {
  id: string;
  label: string;
  remove: () => void;
};

/**
 * Reads the parsed filters rather than the raw query string, so the chips always
 * describe the results actually on screen.
 */
export function ActiveFilters({
  facets,
  filters,
}: {
  facets: Facet[];
  filters: ParsedFilters;
}) {
  const { apply, toggle, setValue } = useFilterNav();
  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({
      id: "q",
      label: `"${filters.q}"`,
      remove: () => setValue("q", ""),
    });
  }

  for (const facet of facets) {
    if (facet.kind === "multi") {
      for (const value of filters.multi[facet.key] ?? []) {
        const option = facet.options.find((o) => o.value === value);
        if (option) {
          chips.push({
            id: `${facet.key}:${value}`,
            label: option.label,
            remove: () => toggle(facet.key, value),
          });
        }
      }
      continue;
    }

    const { min, max } = filters.range[facet.key] ?? { min: null, max: null };
    // Both bounds are rewritten from the parsed values, so dropping one still
    // leaves the other on the correct side even if the URL arrived reversed.
    const keep = (bound: number | null, edge: "min" | "max") =>
      apply((params) => {
        params.delete(`${facet.key}_min`);
        params.delete(`${facet.key}_max`);
        if (bound !== null) params.set(`${facet.key}_${edge}`, String(bound));
      });

    if (min !== null) {
      chips.push({
        id: `${facet.key}_min`,
        label: `${facet.label} from ${min.toLocaleString("en-GB")}`,
        remove: () => keep(max, "max"),
      });
    }
    if (max !== null) {
      chips.push({
        id: `${facet.key}_max`,
        label: `${facet.label} to ${max.toLocaleString("en-GB")}`,
        remove: () => keep(min, "min"),
      });
    }
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-2 py-1 text-xs text-ink hover:border-danger/50 hover:text-danger"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
