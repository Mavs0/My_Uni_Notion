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
}

export function ActivityFeed({
  type = "personalized",
  limit = 20,
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

        // Usar endpoint personalizado se type for "personalized"
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

        // Verificar se há mais atividades
        // API personalizada retorna has_more, outras retornam baseado no length
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
    [type, limit]
  );

  useEffect(() => {
    loadActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Configurar Intersection Observer para paginação infinita
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
      <div className="space-y-3">
        {/* Skeleton Loaders com animação suave */}
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm animate-pulse"
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Avatar Skeleton */}
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-3">
                  {/* Header Skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <div className="h-4 w-48 rounded bg-muted" />
                  </div>
                  {/* Title Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                  {/* Description Skeleton */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full rounded bg-muted/60" />
                    <div className="h-3 w-5/6 rounded bg-muted/60" />
                  </div>
                  {/* Actions Skeleton */}
                  <div className="flex items-center gap-4 border-t pt-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div
                        key={j}
                        className="h-8 w-16 rounded-md bg-muted/60"
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
      <Card>
        <CardContent className="pt-6 text-center text-zinc-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma atividade encontrada</p>
          <p className="text-sm mt-2">
            {type === "following"
              ? "Você ainda não segue ninguém. Descubra novos usuários!"
              : "Não há atividades públicas no momento"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
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
              <Card className="w-full animate-pulse border-dashed border-muted/50 bg-muted/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-muted" />
                        <div className="h-4 w-32 rounded bg-muted" />
                      </div>
                      <div className="h-3 w-full rounded bg-muted/60" />
                      <div className="h-3 w-2/3 rounded bg-muted/60" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {!hasMore && activities.length > 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Não há mais atividades para carregar
        </div>
      )}
    </div>
  );
}
