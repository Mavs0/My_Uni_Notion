import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
  fetchFn: (
    offset: number,
    limit: number
  ) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  limit?: number;
  enabled?: boolean;
  dependencies?: any[];
}

export function useInfiniteScroll<T>({
  fetchFn,
  limit = 20,
  enabled = true,
  dependencies = [],
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && enabled) {
          loadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, enabled]
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const currentOffset = offset;
      const result = await fetchFn(currentOffset, limit);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + limit);
      if (result.total !== undefined) {
        setTotal(result.total);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar mais itens");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, offset, limit, hasMore, loading]);

  const reset = useCallback(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setTotal(undefined);
  }, []);

  useEffect(() => {
    if (enabled) {
      reset();
      setOffset(0);
      setHasMore(true);
      loadMore();
    }
  }, [enabled, ...dependencies]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    total,
    lastElementRef,
  };
}
