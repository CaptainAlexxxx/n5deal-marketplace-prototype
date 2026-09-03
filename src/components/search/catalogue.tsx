import type { ReactNode } from "react";
import { ActiveFilters } from "./active-filters";
import { FilterPanel } from "./filter-panel";
import { Pagination } from "./pagination";
import { SearchBar } from "./search-bar";
import { activeFilterCount, type ParsedFilters, type SearchConfig } from "@/lib/search/params";

export function Catalogue({
  title,
  subtitle,
  config,
  filters,
  total,
  pageCount,
  action,
  banner,
  children,
}: {
  title: string;
  subtitle?: string;
  config: SearchConfig;
  filters: ParsedFilters;
  total: number;
  pageCount: number;
  action?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const active = activeFilterCount(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>

      {banner}

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterPanel facets={config.facets} filters={filters} activeCount={active} />

        <div className="min-w-0 flex-1 space-y-4">
          <SearchBar
            placeholder={config.searchPlaceholder}
            sorts={config.sorts}
            defaultSort={config.defaultSort}
          />
          <ActiveFilters facets={config.facets} filters={filters} />
          <p className="text-xs text-muted">
            {total} {total === 1 ? "result" : "results"}
            {active ? " for the current filters" : ""}
          </p>
          {children}
          <Pagination page={filters.page} pageCount={pageCount} />
        </div>
      </div>
    </div>
  );
}
