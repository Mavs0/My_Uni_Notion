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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  perfil_publico: boolean;
  created_at: string;
  stats: {
    totalDisciplinas: number;
    totalSeguidores: number;
    totalSeguindo: number;
  };
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Este perfil é privado");
          router.push("/descobrir");
          return;
        }
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
        throw new Error("Erro ao atualizar seguimento");
      }

      setFollowing(!following);
      toast.success(
        following
          ? "Você deixou de seguir este usuário"
          : "Você está seguindo este usuário"
      );

      // Recarregar perfil para atualizar contadores
      loadProfile();
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error("Erro ao atualizar seguimento");
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
          <Separator className="my-4" />

          {/* Stats */}
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

          {/* Additional Info */}
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
