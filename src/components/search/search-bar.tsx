"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/field";
import type { Option } from "@/lib/search/params";
import { useFilterNav } from "./use-filter-nav";

export function SearchBar({
  placeholder,
  sorts,
  defaultSort,
}: {
  placeholder: string;
  sorts: Option[];
  defaultSort: string;
}) {
  const { searchParams, setValue } = useFilterNav();
  const urlQuery = searchParams.get("q") ?? "";
  const urlSort = searchParams.get("sort") ?? defaultSort;

  const [draft, setDraft] = useState(urlQuery);
  const [sort, setSort] = useState(urlSort);
  const box = useRef<HTMLInputElement>(null);

  // Resync only while the user is elsewhere, otherwise the navigation that the
  // debounce just triggered would overwrite whatever they typed meanwhile.
  useEffect(() => {
    if (document.activeElement !== box.current) setDraft(urlQuery);
  }, [urlQuery]);

  useEffect(() => setSort(urlSort), [urlSort]);

  useEffect(() => {
    if (draft === urlQuery) return;
    const id = setTimeout(() => setValue("q", draft), 300);
    return () => clearTimeout(id);
  }, [draft, urlQuery, setValue]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={box}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
        />
      </div>
      <Select
        aria-label="Sort"
        value={sort}
        onChange={(event) => {
          setSort(event.target.value);
          setValue("sort", event.target.value);
        }}
        className="sm:w-56"
      >
        {sorts.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
