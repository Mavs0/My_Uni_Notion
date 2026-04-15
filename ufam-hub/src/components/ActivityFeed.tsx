"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { User, Loader2, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityCard } from "./ActivityCard";

interface Activity {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  created_at: string;
  user: {
    id: string;
    nome: string;
    avatar_url: string;
  };
}

interface ActivityFeedProps {
  type?: "all" | "following" | "public" | "personalized";
  limit?: number;
  filters?: {
    tipoAtividade?: string;
    disciplinaId?: string;
    dataInicio?: string;
    dataFim?: string;
  };
}

export function ActivityFeed({
  type = "personalized",
  limit = 20,
  filters = {},
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadActivities = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          offsetRef.current = 0;
        } else {
          setLoadingMore(true);
        }

        const currentOffset = offsetRef.current;
        const params = new URLSearchParams();
        params.append("limit", limit.toString());
        params.append("offset", currentOffset.toString());

        if (filters.tipoAtividade) {
          params.append("tipo_atividade", filters.tipoAtividade);
        }
        if (filters.disciplinaId) {
          params.append("disciplina_id", filters.disciplinaId);
        }
        if (filters.dataInicio) {
          params.append("data_inicio", filters.dataInicio);
        }
        if (filters.dataFim) {
          params.append("data_fim", filters.dataFim);
        }

        const endpoint =
          type === "personalized"
            ? `/api/feed/personalized?${params.toString()}`
            : `/api/feed?type=${type}&${params.toString()}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erro ao carregar atividades");
        }

        const data = await response.json();
        const newActivities = data.activities || [];

        if (reset) {
          setActivities(newActivities);
        } else {
          setActivities((prev) => [...prev, ...newActivities]);
        }

        const hasMoreData =
          data.has_more !== undefined
            ? data.has_more
            : newActivities.length === limit;
        setHasMore(hasMoreData);
        offsetRef.current = currentOffset + newActivities.length;
      } catch (error: any) {
        console.error("Erro ao carregar atividades:", error);
        if (reset) {
          setActivities([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [type, limit, filters]
  );

  useEffect(() => {
    loadActivities(true);
  }, [type]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        loadActivities(false);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, loadActivities]);

  const handleUpdate = () => {
    loadActivities(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton Loaders com animação suave */}
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-zinc-800 dark:bg-[#121212]/80"
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Avatar Skeleton */}
                <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-3">
                  {/* Header Skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  {/* Title Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  {/* Description Skeleton */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
                    <div className="h-3 w-5/6 rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
                  </div>
                  {/* Actions Skeleton */}
                  <div className="flex items-center gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    {[1, 2, 3, 4].map((j) => (
                      <div
                        key={j}
                        className="h-8 w-16 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {/* Loading indicator melhorado */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center rounded-full bg-primary/10 p-4 ring-2 ring-primary/20">
              <Activity className="h-6 w-6 animate-pulse text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium text-muted-foreground">
              Carregando atividades...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-[#121212]">
        <CardContent className="pt-8 pb-8 text-center text-zinc-600 dark:text-zinc-400">
          <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            Nenhuma atividade encontrada
          </p>
          <p className="mt-2 text-sm">
            {type === "following"
              ? "Você ainda não segue ninguém. Descubra novos usuários!"
              : "Não há atividades públicas no momento"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "both",
          }}
        >
          <ActivityCard activity={activity} onUpdate={handleUpdate} />
        </div>
      ))}

      {/* Elemento para detectar quando chegar ao final */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-6">
          {loadingMore && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Carregando mais atividades...
                </span>
              </div>
              {/* Skeleton loader para preview */}
              <Card className="w-full animate-pulse rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                      <div className="h-3 w-full rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
                      <div className="h-3 w-2/3 rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {!hasMore && activities.length > 0 && (
        <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Não há mais atividades para carregar
        </div>
      )}
    </div>
  );
}
