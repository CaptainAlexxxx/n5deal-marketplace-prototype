"use client";

import { Button } from "@/components/ui/button";
import { useFilterNav } from "./use-filter-nav";

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const { apply } = useFilterNav();
  if (pageCount <= 1) return null;

  const goTo = (next: number) =>
    apply(
      (params) => {
        if (next <= 1) params.delete("page");
        else params.set("page", String(next));
      },
      { keepPage: true },
    );

  return (
    <div className="flex items-center justify-between border-t border-line pt-4">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        Previous
      </Button>
      <span className="text-xs text-muted">
        Page {page} of {pageCount}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => goTo(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
