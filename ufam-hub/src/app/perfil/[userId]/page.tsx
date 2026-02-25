"use client";
import { useState, useEffect } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

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
        <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
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
        <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
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
        <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
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
          : "Você está seguindo este usuário"
      );

      loadProfile();
    } catch (error: any) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error(error.message || "Erro ao atualizar seguimento");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <User className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card>
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

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.nome}</CardTitle>
                {profile.bio && (
                  <p className="text-muted-foreground mt-1">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {profile.curso && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {profile.curso}
                    </span>
                  )}
                  {profile.periodo && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      {profile.periodo}º período
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!profile.isOwnProfile && (
              <Button
                onClick={handleFollow}
                variant={following ? "outline" : "default"}
              >
                {following ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Deixar de seguir
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sobre" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sobre">Sobre</TabsTrigger>
              <TabsTrigger value="atividades">Últimas atividades</TabsTrigger>
            </TabsList>
            <TabsContent value="sobre" className="mt-4">
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.stats.totalDisciplinas}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Disciplinas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.stats.totalSeguidores}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    Seguidores
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile.stats.totalSeguindo}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    Seguindo
                  </div>
                </div>
              </div>
              {profile.email && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Membro desde{" "}
                      {new Date(profile.created_at).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="atividades" className="mt-4">
              {loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {activities.map((item) => (
                    <ActivityItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      {profile.isOwnProfile && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Este é seu perfil</h3>
                <p className="text-sm text-muted-foreground">
                  Edite suas informações na página de perfil
                </p>
              </div>
              <Button asChild>
                <Link href="/perfil">Editar Perfil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
