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
  Mail,
  Loader2,
  X,
  SquarePlus,
  Share2,
  Info,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

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
  const [inviteNome, setInviteNome] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DiscoverUser | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { t, locale } = useI18n();

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.error ||
          (response.status === 401
            ? "Faça login para ver a listagem de usuários."
            : "Erro ao carregar usuários.");
        toast.error(message);
        setUsers([]);
        setTotal(0);
        return;
      }

      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários. Tente novamente.");
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

  const handleEnviarConvite = async () => {
    const nome = inviteNome.trim();
    const email = inviteEmail.trim();
    if (!nome || nome.length < 2) {
      toast.error(t.configuracoes.conviteErro, {
        description: locale === "pt-BR" ? "Informe o nome (mín. 2 caracteres)." : "Enter name (min. 2 characters).",
      });
      return;
    }
    if (!email) {
      toast.error(t.configuracoes.conviteErro, {
        description: locale === "pt-BR" ? "Informe um e-mail." : "Enter an email.",
      });
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const isRateLimit = data.errorCode === "rate_limit";
        if (isRateLimit) {
          toast.warning(t.configuracoes.conviteRateLimitTitulo, {
            description: t.configuracoes.conviteRateLimitDesc,
            duration: 10_000,
            action: {
              label: t.configuracoes.conviteTentarMaisTarde,
              onClick: () => {},
            },
          });
        } else {
          toast.error(t.configuracoes.conviteErro, {
            description: data.error || (locale === "pt-BR" ? "Tente novamente." : "Try again."),
          });
        }
        return;
      }
      toast.success(t.configuracoes.conviteEnviado);
      setInviteNome("");
      setInviteEmail("");
      setInviteDialogOpen(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const hasFilters = !!searchDebounced || !!curso || !!periodo;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
      {/* Barra superior: título + filtros + busca + Convidar + ordenar (estilo anexo) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Descobrir Usuários
          </h1>
          <p className="text-sm text-muted-foreground w-full sm:w-auto order-last sm:order-none -mt-2 sm:mt-0">
            {loading
              ? "Carregando..."
              : total === 0
                ? "Nenhum usuário encontrado"
                : `${total} usuário${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-4 w-4" />
                {curso || periodo
                  ? [curso, periodo].filter(Boolean).join(" · ")
                  : locale === "pt-BR"
                    ? "Curso / Período"
                    : "Course / Period"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
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
                      setPage(0);
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={locale === "pt-BR" ? "Buscar por nome, curso ou bio..." : "Search by name, course or bio..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-8 h-9"
            />
          </div>

          <Button
            size="sm"
            className="h-9 gap-1.5 shrink-0"
            onClick={() => setInviteDialogOpen(true)}
          >
            <SquarePlus className="h-4 w-4" />
            {t.configuracoes.conviteUsuario}
          </Button>

          <Select
            value={sort}
            onValueChange={(v: "seguidores" | "nome" | "recent") => {
              setSort(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seguidores">
                {locale === "pt-BR" ? "Mais seguidores" : "Most followers"}
              </SelectItem>
              <SelectItem value="nome">Nome (A–Z)</SelectItem>
              <SelectItem value="recent">
                {locale === "pt-BR" ? "Mais recentes" : "Most recent"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de usuários */}
      <Card className="overflow-hidden">
        {loading ? (
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="size-12 animate-pulse text-primary mb-4" />
              <p className="text-muted-foreground">
                {locale === "pt-BR" ? "Carregando usuários..." : "Loading users..."}
              </p>
            </div>
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent className="py-16 text-center">
            <Users className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-foreground">
              {locale === "pt-BR" ? "Nenhum usuário encontrado" : "No users found"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {hasFilters
                ? (locale === "pt-BR"
                  ? "Tente ajustar os filtros ou a busca."
                  : "Try adjusting filters or search.")
                : (locale === "pt-BR"
                  ? "Não há usuários disponíveis no momento."
                  : "No users available at the moment.")}
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
                {locale === "pt-BR" ? "Limpar filtros" : "Clear filters"}
              </Button>
            )}
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium py-3 px-4">
                      {locale === "pt-BR" ? "Usuário" : "User"}
                    </th>
                    <th className="text-left font-medium py-3 px-4 hidden sm:table-cell">
                      {locale === "pt-BR" ? "Curso" : "Course"}
                    </th>
                    <th className="text-left font-medium py-3 px-4 hidden md:table-cell">
                      {locale === "pt-BR" ? "Período" : "Period"}
                    </th>
                    <th className="text-left font-medium py-3 px-4">
                      {locale === "pt-BR" ? "Seguidores" : "Followers"}
                    </th>
                    <th className="text-left font-medium py-3 px-4">
                      {locale === "pt-BR" ? "Status" : "Status"}
                    </th>
                    <th className="w-10 py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const initials = user.nome
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`border-b cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={user.avatar_url} alt={user.nome} />
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">
                              {user.nome}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell truncate max-w-[160px]">
                          {user.curso || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                          {user.periodo ? `${user.periodo}º` : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.stats.totalSeguidores}
                        </td>
                        <td className="py-3 px-4">
                          {user.isFollowing ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium border border-emerald-500/30">
                              {locale === "pt-BR" ? "Seguindo" : "Following"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedUser(user)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                {locale === "pt-BR" ? "Ver detalhes" : "View details"}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/perfil/${user.id}`}>
                                  <User className="h-4 w-4 mr-2" />
                                  {locale === "pt-BR" ? "Ver perfil" : "View profile"}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleFollow(user.id, user.isFollowing)}
                              >
                                {user.isFollowing ? (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    {locale === "pt-BR" ? "Deixar de seguir" : "Unfollow"}
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {locale === "pt-BR" ? "Seguir" : "Follow"}
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {locale === "pt-BR" ? "Anterior" : "Previous"}
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  {locale === "pt-BR" ? "Próximo" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Painel lateral: detalhes do usuário selecionado */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>
              {selectedUser ? selectedUser.nome : ""}
            </SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="flex flex-col gap-5 pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.nome} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.nome
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-semibold text-lg">{selectedUser.nome}</h2>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {selectedUser.curso && (
                    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                      <GraduationCap className="h-3 w-3" />
                      {selectedUser.curso}
                    </span>
                  )}
                  {selectedUser.periodo && (
                    <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                      <Hash className="h-3 w-3" />
                      {selectedUser.periodo}º período
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{selectedUser.stats.totalSeguidores}</strong>{" "}
                    {locale === "pt-BR" ? "seguidores" : "followers"}
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{selectedUser.stats.totalSeguindo}</strong>{" "}
                    {locale === "pt-BR" ? "seguindo" : "following"}
                  </span>
                </div>
              </div>

              {/* Sobre */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  {locale === "pt-BR" ? "Sobre" : "About"}
                </p>
                {selectedUser.bio ? (
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedUser.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {locale === "pt-BR"
                      ? "Este usuário ainda não adicionou uma descrição."
                      : "This user hasn't added a description yet."}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col items-center gap-2">
                <Button asChild variant="default" className="w-auto min-w-[160px] gap-2">
                  <Link href={`/perfil/${selectedUser.id}`}>
                    <User className="h-4 w-4" />
                    {locale === "pt-BR" ? "Ver perfil" : "View profile"}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-auto min-w-[160px] gap-2"
                  onClick={() => {
                    handleFollow(selectedUser.id, selectedUser.isFollowing);
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === selectedUser.id
                          ? {
                              ...u,
                              isFollowing: !selectedUser.isFollowing,
                              stats: {
                                ...u.stats,
                                totalSeguidores: selectedUser.isFollowing
                                  ? u.stats.totalSeguidores - 1
                                  : u.stats.totalSeguidores + 1,
                              },
                            }
                          : u
                      )
                    );
                    setSelectedUser((prev) =>
                      prev ? { ...prev, isFollowing: !prev.isFollowing } : null
                    );
                  }}
                >
                  {selectedUser.isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      {locale === "pt-BR" ? "Deixar de seguir" : "Unfollow"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      {locale === "pt-BR" ? "Seguir" : "Follow"}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-auto gap-2 text-muted-foreground"
                  onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/perfil/${selectedUser.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success(
                      locale === "pt-BR" ? "Link copiado!" : "Link copied!"
                    );
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {locale === "pt-BR" ? "Compartilhar perfil" : "Share profile"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                {locale === "pt-BR"
                  ? "Ver o perfil completo para disciplinas, avaliações e atividades."
                  : "View full profile for subjects, assessments and activity."}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog: Convidar usuário */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.configuracoes.conviteUsuario}</DialogTitle>
            <DialogDescription>
              {t.configuracoes.conviteUsuarioDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-nome" className="text-sm font-medium">
                {locale === "pt-BR" ? "Nome" : "Name"}
              </Label>
              <Input
                id="invite-nome"
                type="text"
                placeholder={locale === "pt-BR" ? "Nome completo do convidado" : "Full name"}
                value={inviteNome}
                onChange={(e) => setInviteNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnviarConvite()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t.configuracoes.emailPlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnviarConvite()}
              />
            </div>
            <Button
              onClick={handleEnviarConvite}
              disabled={inviteLoading}
              className="gap-2"
            >
              {inviteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {t.configuracoes.enviarConvite}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
