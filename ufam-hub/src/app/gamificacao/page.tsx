"use client";
import { useGamificacao } from "@/hooks/useGamificacao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
  Flame,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as LucideIcons from "lucide-react";
export default function GamificacaoPage() {
  const { data, loading, error } = useGamificacao();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Trophy className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando gamificação...</p>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              {error || "Erro ao carregar gamificação"}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }
  const { gamificacao, conquistasDesbloqueadas, todasConquistas, historicoXP } =
    data;
  const codigosDesbloqueados = new Set(
    conquistasDesbloqueadas.map((c) => c.codigo)
  );
  const conquistasNaoDesbloqueadas = todasConquistas.filter(
    (c) => !codigosDesbloqueados.has(c.codigo)
  );
  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;
    return IconComponent;
  };
  const progressoPercentual = Math.round(gamificacao.progressoNivel * 100);
  const porcentagemConquistas = Math.round(
    (conquistasDesbloqueadas.length / todasConquistas.length) * 100
  );
  const getNivelTitulo = (nivel: number) => {
    if (nivel < 5) return "Iniciante";
    if (nivel < 10) return "Avançado";
    if (nivel < 20) return "Experiente";
    return "Lenda";
  };
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 p-8 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-pink-500/20">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gamificação
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Transforme seus estudos em uma jornada épica! 🚀
          </p>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl" />
      </div>
      {}
      <Card className="relative overflow-hidden border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold text-white shadow-lg">
                  {gamificacao.nivel}
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Nível {gamificacao.nivel} •{" "}
                  {getNivelTitulo(gamificacao.nivel)}
                </div>
                <div className="text-2xl font-bold mt-1">
                  {gamificacao.xp_total.toLocaleString()} XP
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {gamificacao.xpRestante} XP para o nível{" "}
                  {gamificacao.nivel + 1}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground">
                Progresso
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {progressoPercentual}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 transition-all hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {gamificacao.streak_atual}
              <span className="text-lg text-muted-foreground ml-1">dias</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1">
                {Array.from({
                  length: Math.min(gamificacao.streak_atual, 7),
                }).map((_, i) => (
                  <Flame
                    key={i}
                    className="h-4 w-4 text-orange-500 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Recorde: {gamificacao.streak_maximo} dias
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 transition-all hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {conquistasDesbloqueadas.length}
              <span className="text-lg text-muted-foreground ml-1">
                / {todasConquistas.length}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={porcentagemConquistas} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {porcentagemConquistas}% desbloqueadas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 transition-all hover:shadow-lg hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              XP no Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {gamificacao.xpNoNivelAtual}
              <span className="text-lg text-muted-foreground ml-1">XP</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Acumulado neste nível
            </p>
          </CardContent>
        </Card>
      </div>
      {}
      <Card className="border-2 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Progresso para o Nível {gamificacao.nivel + 1}
            </CardTitle>
            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {progressoPercentual}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progressoPercentual}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 drop-shadow-sm">
                  {gamificacao.xpNoNivelAtual} /{" "}
                  {gamificacao.xpNecessarioProximoNivel -
                    (gamificacao.xp_total - gamificacao.xpNoNivelAtual)}{" "}
                  XP
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nível {gamificacao.nivel}</span>
              <span className="font-medium">
                Faltam {gamificacao.xpRestante} XP para subir!
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      {}
      {conquistasDesbloqueadas.length > 0 && (
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Conquistas Desbloqueadas
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {conquistasDesbloqueadas.length} de {todasConquistas.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conquistasDesbloqueadas.map((conquista) => {
                const IconComponent = getIcon(conquista.icone);
                return (
                  <div
                    key={conquista.codigo}
                    className="group relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-white to-green-50/50 p-4 shadow-sm transition-all hover:scale-105 hover:shadow-lg dark:from-zinc-900 dark:to-green-950/20"
                  >
                    <div className="absolute top-2 right-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: `${conquista.cor}20`,
                          border: `2px solid ${conquista.cor}40`,
                        }}
                      >
                        <IconComponent
                          className="h-6 w-6"
                          style={{ color: conquista.cor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base mb-1">
                          {conquista.nome}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {conquista.descricao}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: `${conquista.cor}20`,
                              color: conquista.cor,
                            }}
                          >
                            <Zap className="h-3 w-3" />+
                            {conquista.xp_recompensa} XP
                          </span>
                          {conquista.desbloqueada_em && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                conquista.desbloqueada_em
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {}
      {conquistasNaoDesbloqueadas.length > 0 && (
        <Card className="border-zinc-500/30 bg-gradient-to-br from-zinc-500/5 to-zinc-600/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              Conquistas Disponíveis
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {conquistasNaoDesbloqueadas.length} para desbloquear
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conquistasNaoDesbloqueadas.map((conquista) => {
                const IconComponent = getIcon(conquista.icone);
                return (
                  <div
                    key={conquista.codigo}
                    className="group relative overflow-hidden rounded-xl border border-zinc-300/50 bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-4 opacity-70 transition-all hover:opacity-100 hover:scale-[1.02] dark:from-zinc-900/50 dark:to-zinc-800/50 dark:border-zinc-700/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/20 to-transparent dark:from-zinc-700/20" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50">
                        <IconComponent className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          {conquista.nome}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {conquista.descricao}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200/50 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                            <Zap className="h-3 w-3" />+
                            {conquista.xp_recompensa} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {}
      {historicoXP.length > 0 && (
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Histórico Recente de XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicoXP.map((item, index) => {
                const getTipoIcon = (tipo: string) => {
                  switch (tipo) {
                    case "estudo":
                      return Clock;
                    case "tarefa":
                      return Award;
                    case "conquista":
                      return Trophy;
                    default:
                      return Zap;
                  }
                };
                const TipoIcon = getTipoIcon(item.tipo_atividade);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-4 transition-all hover:scale-[1.02] hover:shadow-md dark:border-blue-900/50 dark:from-blue-950/20 dark:to-cyan-950/20"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                        <TipoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-semibold">{item.descricao}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                        +{item.xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {}
      {progressoPercentual > 80 && (
        <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              <div>
                <div className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Você está quase lá! 🎯
                </div>
                <div className="text-sm text-muted-foreground">
                  Faltam apenas {gamificacao.xpRestante} XP para subir de nível!
                  Continue assim! 💪
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}