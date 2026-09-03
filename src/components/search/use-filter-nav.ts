"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Filters are URL state. Every control mutates the query string and lets the
 * server component re-render, which keeps the list, the chips and the browser
 * history in sync without a client-side store.
 */
export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = useCallback(
    (mutate: (params: URLSearchParams) => void, options?: { keepPage?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      if (!options?.keepPage) params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      apply((params) => {
        const current = params.getAll(key);
        params.delete(key);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        for (const v of next) params.append(key, v);
      });
    },
    [apply],
  );

  const setValue = useCallback(
    (key: string, value: string) => {
      apply((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [apply],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }, [pathname, router]);

  return { searchParams, apply, toggle, setValue, clearAll, pending };
}
