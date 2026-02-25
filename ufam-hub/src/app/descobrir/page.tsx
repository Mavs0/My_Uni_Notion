"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  UserPlus,
  UserMinus,
  Users,
  GraduationCap,
  Hash,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";

const ITEMS_PER_PAGE = 6;

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
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [sort, setSort] = useState<"seguidores" | "nome" | "recent">("seguidores");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchDebounced) params.append("search", searchDebounced);
      if (curso) params.append("curso", curso);
      if (periodo) params.append("periodo", periodo);
      params.append("sort", sort);
      params.append("limit", String(ITEMS_PER_PAGE));
      params.append("offset", String(page * ITEMS_PER_PAGE));

      const response = await fetch(`/api/users/discover?${params.toString()}`);

      if (!response.ok) throw new Error("Erro ao carregar usuários");

      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, curso, periodo, sort, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

      if (!response.ok) throw new Error("Erro ao atualizar seguimento");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isFollowing: !currentlyFollowing,
                stats: {
                  ...u.stats,
                  totalSeguidores: currentlyFollowing
                    ? u.stats.totalSeguidores - 1
                    : u.stats.totalSeguidores + 1,
                },
              }
            : u
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

  const hasFilters = !!searchDebounced || !!curso || !!periodo;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Descobrir Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? "Carregando..."
              : total === 0
                ? "Nenhum usuário encontrado"
                : `${total} usuário${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      {/* Busca + Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome, curso ou bio..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 shrink-0"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasFilters && (
                <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {[searchDebounced, curso, periodo].filter(Boolean).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Curso</Label>
                <Input
                  placeholder="Ex: Ciência da Computação"
                  value={curso}
                  onChange={(e) => {
                    setCurso(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Período</Label>
                <Select
                  value={periodo || "todos"}
                  onValueChange={(v) => {
                    setPeriodo(v === "todos" ? "" : v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {p}º período
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ordenar por</Label>
                <Select
                  value={sort}
                  onValueChange={(v: "seguidores" | "nome" | "recent") => {
                    setSort(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seguidores">Mais seguidores</SelectItem>
                    <SelectItem value="nome">Nome (A–Z)</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSearch("");
                    setSearchDebounced("");
                    setCurso("");
                    setPeriodo("");
                    setSort("seguidores");
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Users className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-foreground">Nenhum usuário encontrado</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {hasFilters
                ? "Tente ajustar os filtros ou a busca para encontrar mais pessoas."
                : "Não há usuários disponíveis no momento. Volte mais tarde!"}
            </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setSearchDebounced("");
                    setCurso("");
                    setPeriodo("");
                    setSort("seguidores");
                    setPage(0);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {users.map((user) => {
              const initials = user.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/perfil/${user.id}`} className="shrink-0">
                        <Avatar className="h-14 w-14 cursor-pointer hover:opacity-90 transition-opacity">
                          <AvatarImage src={user.avatar_url} alt={user.nome} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/perfil/${user.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer truncate">
                            {user.nome}
                          </h3>
                        </Link>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {user.bio}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {user.curso && (
                            <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                              <GraduationCap className="h-3 w-3" />
                              {user.curso}
                            </span>
                          )}
                          {user.periodo && (
                            <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                              <Hash className="h-3 w-3" />
                              {user.periodo}º período
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.stats.totalSeguidores} seguidores · Seguindo{" "}
                          {user.stats.totalSeguindo}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/perfil/${user.id}`}>
                              <User className="h-4 w-4 mr-2" />
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
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
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
