"use client";

import { useRecommendations, Recommendation } from "@/hooks/useRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Brain,
  Library,
  Users,
  UserPlus,
  CheckSquare,
  Calendar,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const tipoIcons: Record<string, any> = {
  disciplina_estudar: BookOpen,
  anotacao_revisar: FileText,
  flashcard_revisar: Brain,
  material_biblioteca: Library,
  grupo_estudo: Users,
  usuario_seguir: UserPlus,
  tarefa_prioritaria: CheckSquare,
  avaliacao_preparar: Calendar,
};

const tipoColors: Record<string, string> = {
  disciplina_estudar: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  anotacao_revisar: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  flashcard_revisar: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  material_biblioteca: "bg-green-500/10 text-green-600 dark:text-green-400",
  grupo_estudo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  usuario_seguir: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  tarefa_prioritaria: "bg-red-500/10 text-red-600 dark:text-red-400",
  avaliacao_preparar: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

interface RecommendationsWidgetProps {
  tipo?: Recommendation["tipo"];
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function RecommendationsWidget({
  tipo,
  limit = 5,
  showTitle = true,
  className = "",
}: RecommendationsWidgetProps) {
  const { data, isLoading, error } = useRecommendations({ tipo, limit });

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Recomendações Inteligentes
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    return null;
  }

  const recommendations = data.recommendations;

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recomendações Inteligentes
            <Badge variant="secondary" className="ml-auto">
              {recommendations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 ">
          {recommendations.map((rec) => {
            const Icon = tipoIcons[rec.tipo] || Sparkles;
            const colorClass = tipoColors[rec.tipo] || "bg-gray-500/10 text-gray-600";

            return (
              <div
                key={rec.id}
                className="group flex-shrink-0 w-[280px] rounded-xl border p-4 transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">
                        {rec.titulo}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${
                              i < rec.prioridade
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {rec.descricao}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.baseado_em.replace(/_/g, " ")}
                      </Badge>
                      {rec.acao_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs -ml-1"
                          asChild
                        >
                          <Link href={rec.acao_url}>
                            {rec.acao_label || "Ver mais"}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {data.total > recommendations.length && (
          <div className="pt-3 mt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Mostrando {recommendations.length} de {data.total} recomendações
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const Icon = tipoIcons[recommendation.tipo] || Sparkles;
  const colorClass = tipoColors[recommendation.tipo] || "bg-gray-500/10 text-gray-600";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1">{recommendation.titulo}</h4>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {recommendation.descricao}
            </p>
            {recommendation.acao_url && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href={recommendation.acao_url}>
                  {recommendation.acao_label || "Ver mais"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
