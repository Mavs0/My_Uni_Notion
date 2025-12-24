"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  UserMinus,
  Users,
  GraduationCap,
  Hash,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";

interface DiscoverUser {
  id: string;
  nome: string;
  avatar_url: string;
  bio: string;
  curso: string;
  periodo: string;
  stats: {
    totalSeguidores: number;
    totalSeguindo: number;
  };
  isFollowing: boolean;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/users/discover?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const { users: usersData } = await response.json();
      setUsers(usersData || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    try {
      const method = currentlyFollowing ? "DELETE" : "POST";
      const url = currentlyFollowing
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

      // Atualizar estado local
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                isFollowing: !currentlyFollowing,
                stats: {
                  ...user.stats,
                  totalSeguidores: currentlyFollowing
                    ? user.stats.totalSeguidores - 1
                    : user.stats.totalSeguidores + 1,
                },
              }
            : user
        )
      );

      toast.success(
        currentlyFollowing
          ? "Você deixou de seguir este usuário"
          : "Você está seguindo este usuário"
      );
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error("Erro ao atualizar seguimento");
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8" />
          Descobrir Usuários
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Encontre outros estudantes e conecte-se com a comunidade
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Carregando usuários...</p>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-zinc-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
            <p className="text-sm mt-2">
              {search
                ? "Tente uma busca diferente"
                : "Não há usuários públicos disponíveis no momento"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const initials = user.nome
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Link href={`/perfil/${user.id}`}>
                        <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage src={user.avatar_url} alt={user.nome} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/perfil/${user.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                            {user.nome}
                          </h3>
                        </Link>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {user.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {user.curso && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {user.curso}
                            </span>
                          )}
                          {user.periodo && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {user.periodo}º período
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{user.stats.totalSeguidores} seguidores</span>
                          <span>•</span>
                          <span>Seguindo {user.stats.totalSeguindo}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollow(user.id, user.isFollowing)}
                    >
                      {user.isFollowing ? (
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
