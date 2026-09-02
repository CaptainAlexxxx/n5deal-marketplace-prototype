"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CheckboxRow, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type {
  Facet,
  MultiFacet,
  ParsedFilters,
  RangeFacet,
} from "@/lib/search/params";
import { useFilterNav } from "./use-filter-nav";

export function FilterPanel({
  facets,
  filters,
  activeCount,
}: {
  facets: Facet[];
  filters: ParsedFilters;
  activeCount: number;
}) {
  const [openOnMobile, setOpenOnMobile] = useState(false);
  const { clearAll } = useFilterNav();

  return (
    <aside className="lg:w-72 lg:shrink-0">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpenOnMobile((open) => !open)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </Button>
        {activeCount ? (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Reset
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "space-y-6 lg:mt-0 lg:block",
          openOnMobile ? "mt-4 block" : "hidden",
        )}
      >
        <div className="hidden items-center justify-between lg:flex">
          <h2 className="text-sm font-semibold text-ink">Filters</h2>
          {activeCount ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Reset
            </Button>
          ) : null}
        </div>

        {facets.map((facet) =>
          facet.kind === "multi" ? (
            <MultiFacetBlock
              key={facet.key}
              facet={facet}
              selected={filters.multi[facet.key] ?? []}
            />
          ) : (
            <RangeFacetBlock
              key={facet.key}
              facet={facet}
              range={filters.range[facet.key] ?? { min: null, max: null }}
            />
          ),
        )}
      </div>
    </aside>
  );
}

function MultiFacetBlock({
  facet,
  selected,
}: {
  facet: MultiFacet;
  selected: string[];
}) {
  const { toggle } = useFilterNav();
  const chosen = new Set(selected);
  const [expanded, setExpanded] = useState(false);

  const limit = facet.collapsedAfter ?? facet.options.length;
  const visible = expanded ? facet.options : facet.options.slice(0, limit);
  const hidden = facet.options.length - visible.length;

  return (
    <div>
      <p className="field-label">{facet.label}</p>
      <div className="-mx-2">
        {visible.map((option) => (
          <CheckboxRow
            key={option.value}
            label={option.label}
            checked={chosen.has(option.value)}
            onChange={() => toggle(facet.key, option.value)}
          />
        ))}
      </div>
      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 px-2 text-xs text-brand hover:underline"
        >
          {expanded ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}

function RangeFacetBlock({
  facet,
  range,
}: {
  facet: RangeFacet;
  range: { min: number | null; max: number | null };
}) {
  const { apply } = useFilterNav();
  const minKey = `${facet.key}_min`;
  const maxKey = `${facet.key}_max`;
  const min = range.min === null ? "" : String(range.min);
  const max = range.max === null ? "" : String(range.max);

  const commit = (edited: "min" | "max", raw: string) => {
    const next = { min, max, [edited]: raw };
    const flip =
      next.min !== "" && next.max !== "" && Number(next.min) > Number(next.max);
    const lower = flip ? next.max : next.min;
    const upper = flip ? next.min : next.max;
    apply((params) => {
      if (lower) params.set(minKey, lower);
      else params.delete(minKey);
      if (upper) params.set(maxKey, upper);
      else params.delete(maxKey);
    });
  };

  return (
    <div>
      <p className="field-label">
        {facet.label}
        <span className="ml-1 normal-case">(EUR)</span>
      </p>
      {/* keyed on the applied value so a reset or a removed chip clears the box too */}
      <div className="flex items-center gap-2">
        <Input
          key={min || "empty"}
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={min}
          placeholder={facet.placeholderMin ?? "Min"}
          onBlur={(event) => commit("min", event.target.value)}
          className="px-2 py-1.5 text-xs"
        />
        <span className="text-muted">-</span>
        <Input
          key={max || "empty"}
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={max}
          placeholder={facet.placeholderMax ?? "Max"}
          onBlur={(event) => commit("max", event.target.value)}
          className="px-2 py-1.5 text-xs"
        />
      </div>
    </div>
  );
}
