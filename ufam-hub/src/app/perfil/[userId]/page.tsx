"use client";
import { useState, useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Calendar,
  Users,
  UserPlus,
  UserMinus,
  BookOpen,
  Clock,
  Trophy,
  ArrowLeft,
  Loader2,
  Activity,
  MessageCircle,
  Heart,
  ThumbsUp,
  Lightbulb,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PublicProfile {
  id: string;
  email?: string;
  nome: string;
  avatar_url: string;
  bio: string;
  curso: string;
  periodo: string;
  created_at: string;
  stats: {
    totalDisciplinas: number;
    totalSeguidores: number;
    totalSeguindo: number;
  };
  isFollowing: boolean;
  isOwnProfile: boolean;
}

type ActivityItem = {
  tipo: "activity" | "comment" | "reaction";
  id: string;
  created_at: string;
  data: Record<string, unknown>;
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) {
    const m = Math.floor(diffInSeconds / 60);
    return `há ${m} ${m === 1 ? "minuto" : "minutos"}`;
  }
  if (diffInSeconds < 86400) {
    const h = Math.floor(diffInSeconds / 3600);
    return `há ${h} ${h === 1 ? "hora" : "horas"}`;
  }
  const d = Math.floor(diffInSeconds / 86400);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
};

const getActivityLabel = (tipo: string) => {
  const map: Record<string, string> = {
    pomodoro_completo: "Completou um Pomodoro",
    disciplina_criada: "Adicionou uma disciplina",
    avaliacao_adicionada: "Adicionou uma avaliação",
    nota_criada: "Criou uma anotação",
    conquista_desbloqueada: "Desbloqueou uma conquista",
    post_personalizado: "Publicou no feed",
    tarefa_concluida: "Concluiu uma tarefa",
    meta_atingida: "Atingiu uma meta",
  };
  return map[tipo] || "Realizou uma atividade";
};

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const d = item.data as any;
  if (item.tipo === "activity") {
    const tipo = d.tipo as string;
    const icon =
      tipo === "pomodoro_completo" ? (
        <Clock className="h-4 w-4 text-blue-500" />
      ) : tipo === "post_personalizado" ? (
        <User className="h-4 w-4 text-indigo-500" />
      ) : tipo === "disciplina_criada" ? (
        <BookOpen className="h-4 w-4 text-green-500" />
      ) : tipo === "avaliacao_adicionada" ? (
        <GraduationCap className="h-4 w-4 text-purple-500" />
      ) : tipo === "nota_criada" ? (
        <FileText className="h-4 w-4 text-orange-500" />
      ) : tipo === "conquista_desbloqueada" || tipo === "meta_atingida" ? (
        <Trophy className="h-4 w-4 text-yellow-500" />
      ) : (
        <Activity className="h-4 w-4 text-muted-foreground" />
      );
    return (
      <Link href={`/feed?activity=${item.id}`}>
        <div className="flex h-full items-start gap-3 rounded-2xl border bg-card/40 p-4 transition-colors hover:bg-accent/50">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{getActivityLabel(tipo)}</p>
            {d.titulo && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {d.titulo}
              </p>
            )}
            {d.descricao && !d.titulo && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {d.descricao}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      </Link>
    );
  }
  if (item.tipo === "comment") {
    return (
      <Link href={`/feed?activity=${d.activity_id}`}>
        <div className="flex h-full items-start gap-3 rounded-2xl border bg-card/40 p-4 transition-colors hover:bg-accent/50">
          <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">Comentou</span> em publicação de{" "}
              {d.activity_owner?.nome || "usuário"}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              "{d.comentario}"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      </Link>
    );
  }
  if (item.tipo === "reaction") {
    const ReactionIcon =
      d.reaction_tipo === "like"
        ? ThumbsUp
        : d.reaction_tipo === "inspirador"
          ? Lightbulb
          : Heart;
    return (
      <Link href={`/feed?activity=${d.activity_id}`}>
        <div className="flex h-full items-start gap-3 rounded-2xl border bg-card/40 p-4 transition-colors hover:bg-accent/50">
          <ReactionIcon className="h-4 w-4 text-pink-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium capitalize">
                {d.reaction_label || d.reaction_tipo}
              </span>{" "}
              publicação de {d.activity_owner?.nome || "usuário"}
            </p>
            {d.activity_titulo && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                "{d.activity_titulo}"
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(item.created_at)}
            </p>
          </div>
        </div>
      </Link>
    );
  }
  return null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && profile) {
      loadActivities();
    }
  }, [userId, profile?.id]);

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await fetch(`/api/users/${userId}/activities?limit=30`);
      if (res.ok) {
        const { items } = await res.json();
        setActivities(items || []);
      }
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Usuário não encontrado");
          router.push("/descobrir");
          return;
        }
        throw new Error("Erro ao carregar perfil");
      }

      const { profile: profileData } = await response.json();
      setProfile(profileData);
      setFollowing(profileData.isFollowing);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const method = following ? "DELETE" : "POST";
      const url = following
        ? `/api/users/follow?userId=${userId}`
        : "/api/users/follow";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ userId }) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao atualizar seguimento");
      }

      setFollowing(!following);
      toast.success(
        following
          ? "Você deixou de seguir este usuário"
          : "Você está seguindo este usuário",
      );

      loadProfile();
    } catch (error: any) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error(error.message || "Erro ao atualizar seguimento");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[min(100%,1280px)] px-2 pb-12 pt-2 sm:px-4">
        <div className="space-y-6">
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          <div className="overflow-hidden rounded-3xl border border-border">
            <div className="h-44 animate-pulse bg-muted sm:h-52" />
            <div className="flex flex-col gap-6 px-4 pb-8 pt-0 sm:px-8">
              <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
                <div className="h-28 w-28 shrink-0 animate-pulse rounded-[1.75rem] bg-muted sm:h-36 sm:w-36" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
                  <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-[min(100%,1280px)] px-2 py-6 sm:px-4">
        <Card className="rounded-3xl">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Perfil não encontrado</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const initials = profile.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statItem = (
    value: number,
    label: string,
    icon: ReactNode,
    className?: string,
  ) => (
    <div
      className={cn("flex flex-col gap-1 text-center sm:text-right", className)}
    >
      <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
        {value}
      </span>
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground sm:justify-end sm:text-sm">
        {icon}
        {label}
      </div>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[min(100%,1280px)] space-y-8 px-2 pb-16 pt-2 sm:px-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div
          className="relative h-44 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 sm:h-52"
          aria-hidden
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-20%,rgba(255,255,255,0.12),transparent)]" />
        </div>

        <div className="relative px-4 pb-8 pt-0 sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end sm:gap-6 lg:flex-1">
              <Avatar className="-mt-14 h-28 w-28 shrink-0 rounded-[1.75rem] border-4 border-card shadow-xl ring-1 ring-border/60 sm:-mt-16 sm:h-36 sm:w-36">
                <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                <AvatarFallback className="rounded-[1.75rem] text-2xl font-semibold sm:text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-3 pb-0.5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {profile.nome}
                  </h1>
                  {profile.bio ? (
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {profile.bio}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {profile.curso ? (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 shrink-0 opacity-80" />
                        {profile.curso}
                      </span>
                    ) : null}
                    {profile.periodo ? (
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-4 w-4 shrink-0 opacity-80" />
                        {profile.periodo}º período
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.isOwnProfile ? (
                    <Button asChild className="rounded-full">
                      <Link href="/perfil">Editar perfil</Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleFollow}
                        variant={following ? "outline" : "default"}
                        className={cn(
                          "rounded-full",
                          !following &&
                            "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700",
                        )}
                      >
                        {following ? (
                          <>
                            <UserMinus className="mr-2 h-4 w-4" />
                            Deixar de seguir
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Seguir
                          </>
                        )}
                      </Button>
                      {profile.email ? (
                        <Button
                          variant="outline"
                          className="rounded-full"
                          asChild
                        >
                          <a href={`mailto:${profile.email}`}>Conectar</a>
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 sm:gap-6 lg:max-w-md lg:shrink-0">
              {statItem(
                profile.stats.totalDisciplinas,
                "Disciplinas",
                <BookOpen className="h-4 w-4 opacity-70" />,
                "text-center sm:text-right",
              )}
              {statItem(
                profile.stats.totalSeguidores,
                "Seguidores",
                <Users className="h-4 w-4 opacity-70" />,
                "text-center sm:text-right",
              )}
              {statItem(
                profile.stats.totalSeguindo,
                "Seguindo",
                <UserPlus className="h-4 w-4 opacity-70" />,
                "text-center sm:text-right",
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sobre" className="w-full">
        <TabsList
          className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0"
          aria-label="Secções do perfil"
        >
          <TabsTrigger
            value="sobre"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-base font-medium text-muted-foreground shadow-none data-[state=active]:border-emerald-500 data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Sobre
          </TabsTrigger>
          <TabsTrigger
            value="atividades"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-base font-medium text-muted-foreground shadow-none data-[state=active]:border-emerald-500 data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Últimas atividades
            {activities.length > 0 ? (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {activities.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sobre" className="mt-8 focus-visible:outline-none">
          <div className="grid gap-6 rounded-3xl border border-border bg-card/30 p-6 sm:p-8">
            {profile.email ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="break-all text-foreground">
                  {profile.email}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este utilizador não partilhou o email publicamente.
              </p>
            )}
            <Separator />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                Membro desde{" "}
                {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="atividades"
          className="mt-8 focus-visible:outline-none"
        >
          {loadingActivities ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 py-16 text-center text-muted-foreground">
              <Activity className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">Nenhuma atividade recente</p>
              <p className="mt-1 text-sm opacity-80">
                As interações no feed aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activities.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
