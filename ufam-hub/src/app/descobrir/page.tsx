"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Search,
  UserPlus,
  UserMinus,
  Users,
  GraduationCap,
  Hash,
  ChevronRight,
  X,
  Share2,
  Info,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import {
  InviteUserPanel,
  getCadastroConvidadoUrl,
} from "@/components/auth/InviteUserPanel";
import { cn } from "@/lib/utils";

const INITIAL_FETCH_LIMIT = 36;

interface DiscoverUser {
  id: string;
  nome: string;
  username: string;
  avatar_url: string;
  bio: string;
  curso: string;
  periodo: string;
  tipo_perfil?: string;
  campus?: string;
  tags?: string[];
  created_at?: string;
  stats: {
    totalSeguidores: number;
    totalSeguindo: number;
  };
  isFollowing: boolean;
}

function initialsFromName(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState("");
  const [campus, setCampus] = useState("");
  const [fetchLimit, setFetchLimit] = useState(INITIAL_FETCH_LIMIT);
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);
  const [inviteNome, setInviteNome] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMensagem, setInviteMensagem] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DiscoverUser | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { t, locale } = useI18n();
  const pt = locale === "pt-BR";

  useEffect(() => {
    setInviteLink(getCadastroConvidadoUrl());
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setFetchLimit(INITIAL_FETCH_LIMIT);
    setExpandedSuggestions(false);
  }, [searchDebounced, curso, periodo, tipoPerfil, campus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchDebounced) params.append("search", searchDebounced);
      if (curso) params.append("curso", curso);
      if (periodo) params.append("periodo", periodo);
      if (tipoPerfil) params.append("tipo_perfil", tipoPerfil);
      if (campus) params.append("campus", campus);
      params.append("sort", "nome");
      params.append("limit", String(fetchLimit));
      params.append("offset", "0");

      const response = await fetch(`/api/users/discover?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          data?.error ||
          (response.status === 401
            ? pt
              ? "Faça login para ver a listagem de usuários."
              : "Sign in to browse users."
            : pt
              ? "Erro ao carregar usuários."
              : "Failed to load users.");
        toast.error(message);
        setUsers([]);
        setTotal(0);
        return;
      }

      setUsers(data.users || []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error(pt ? "Erro ao carregar usuários." : "Failed to load users.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, curso, periodo, tipoPerfil, campus, fetchLimit, pt]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const { suggestions, featured } = useMemo(() => {
    const created = (u: DiscoverUser) =>
      new Date(u.created_at || 0).getTime();
    const byRecent = [...users].sort((a, b) => created(b) - created(a));
    const n = expandedSuggestions ? 8 : 4;
    const sugg = byRecent.slice(0, n);
    const ids = new Set(sugg.map((u) => u.id));
    const feat = [...users]
      .filter((u) => !ids.has(u.id))
      .sort(
        (a, b) =>
          (b.stats?.totalSeguidores || 0) - (a.stats?.totalSeguidores || 0)
      );
    return { suggestions: sugg, featured: feat };
  }, [users, expandedSuggestions]);

  const resetFilters = () => {
    setSearch("");
    setSearchDebounced("");
    setCurso("");
    setPeriodo("");
    setTipoPerfil("");
    setCampus("");
    setFetchLimit(INITIAL_FETCH_LIMIT);
    setExpandedSuggestions(false);
  };

  const hasFilters =
    !!searchDebounced || !!curso || !!periodo || !!tipoPerfil || !!campus;

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

      const patch = (u: DiscoverUser) =>
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
          : u;

      setUsers((prev) => prev.map(patch));
      setSelectedUser((prev) => (prev && prev.id === userId ? patch(prev) : prev));

      toast.success(
        currentlyFollowing
          ? pt
            ? "Você deixou de seguir este usuário"
            : "You unfollowed this user"
          : pt
            ? "Você está seguindo este usuário"
            : "You are now following this user"
      );
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast.error(pt ? "Erro ao atualizar seguimento." : "Could not update follow.");
    }
  };

  const handleEnviarConvite = async () => {
    const nome = inviteNome.trim();
    const email = inviteEmail.trim();
    if (!nome || nome.length < 2) {
      toast.error(t.configuracoes.conviteErro, {
        description: pt
          ? "Informe o nome de usuário (mín. 2 caracteres)."
          : "Enter username (min. 2 characters).",
      });
      return;
    }
    if (!email) {
      toast.error(t.configuracoes.conviteErro, {
        description: pt ? "Informe um e-mail." : "Enter an email.",
      });
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          mensagem: inviteMensagem.trim() || undefined,
        }),
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
            description:
              data.error || (pt ? "Tente novamente." : "Try again."),
          });
        }
        return;
      }
      toast.success(t.configuracoes.conviteEnviado);
      setInviteNome("");
      setInviteEmail("");
      setInviteMensagem("");
      setInviteDialogOpen(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const tagPillClass =
    "rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground dark:border-[#333] dark:bg-[#1a1a1a] dark:text-[#A3A3A3]";

  const cardShell =
    "rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md dark:border-[#262626] dark:bg-[#101010]";

  const periodoLabel = (p: string) =>
    p ? (pt ? `${p}º período` : `${p}th semester`) : "—";

  const renderLargeCard = (user: DiscoverUser) => {
    const tags = user.tags?.length ? user.tags : [];
    return (
      <div
        key={user.id}
        className={cn(cardShell, "flex flex-col p-5")}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedUser(user)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedUser(user);
          }
        }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar className="h-24 w-24 ring-2 ring-[#05865E]/20">
            <AvatarImage src={user.avatar_url} alt={user.nome} />
            <AvatarFallback className="text-lg">
              {initialsFromName(user.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground dark:text-[#FAFAFA]">
              {user.nome}
            </p>
            <p className="text-sm text-muted-foreground dark:text-[#737373]">
              @{user.username}
            </p>
          </div>
          <div className="text-xs text-muted-foreground dark:text-[#A3A3A3] space-y-0.5">
            <p>{user.curso || (pt ? "Curso não informado" : "Course not set")}</p>
            <p>{periodoLabel(String(user.periodo || ""))}</p>
          </div>
        </div>
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className={tagPillClass}>
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 h-6" aria-hidden />
        )}
        <div
          className="mt-5 flex gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            asChild
            className="h-10 flex-1 rounded-xl bg-[#05865E] text-white hover:bg-[#047a52]"
          >
            <Link href={`/perfil/${user.id}`}>
              {pt ? "Ver perfil" : "View profile"}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl border-[#262626] dark:bg-[#151515] dark:hover:bg-[#1f1f1f]"
            onClick={() => handleFollow(user.id, user.isFollowing)}
            aria-label={
              user.isFollowing
                ? pt
                  ? "Deixar de seguir"
                  : "Unfollow"
                : pt
                  ? "Seguir"
                  : "Follow"
            }
          >
            {user.isFollowing ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4 text-[#05865E]" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderCompactCard = (user: DiscoverUser) => {
    const tags = user.tags?.length ? user.tags : [];
    return (
      <div
        key={user.id}
        className={cn(
          cardShell,
          "flex cursor-pointer flex-col gap-3 p-4 sm:flex-row sm:items-start"
        )}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedUser(user)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedUser(user);
          }
        }}
      >
        <div className="flex min-w-0 flex-1 gap-3">
          <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border/60 dark:ring-[#333]">
            <AvatarImage src={user.avatar_url} alt={user.nome} />
            <AvatarFallback>{initialsFromName(user.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate dark:text-[#FAFAFA]">{user.nome}</p>
            <p className="text-xs text-muted-foreground truncate">
              @{user.username}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {user.curso || "—"} · {periodoLabel(String(user.periodo || ""))}
            </p>
            {tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={tagPillClass}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div
          className="flex shrink-0 gap-2 sm:w-[min(100%,140px)] sm:flex-col"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            asChild
            size="sm"
            className="flex-1 rounded-xl bg-[#05865E] text-white hover:bg-[#047a52] sm:flex-none"
          >
            <Link href={`/perfil/${user.id}`}>
              {pt ? "Ver perfil" : "Profile"}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl border-[#262626] dark:bg-[#151515]"
            onClick={() => handleFollow(user.id, user.isFollowing)}
            aria-label={
              user.isFollowing
                ? pt
                  ? "Deixar de seguir"
                  : "Unfollow"
                : pt
                  ? "Seguir"
                  : "Follow"
            }
          >
            {user.isFollowing ? (
              <UserMinus className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4 text-[#05865E]" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 pb-16 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-[#FAFAFA] md:text-3xl">
            {pt ? "Descobrir usuários" : "Discover users"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-[#A3A3A3] md:text-base">
            {pt
              ? "Encontre estudantes e pessoas da comunidade acadêmica dentro do UFAM Hub."
              : "Find students and people from the academic community on UFAM Hub."}
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          className={cn(
            "h-10 shrink-0 gap-2 rounded-xl px-4 font-medium",
            "border border-[#05865E] bg-background text-[#05865E] hover:bg-[#05865E]/10",
            "dark:border-transparent dark:bg-[#05865E] dark:text-white dark:hover:bg-[#047a52]"
          )}
        >
          <UserPlus className="h-4 w-4" />
          {t.configuracoes.conviteUsuario}
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-[#737373]" />
        <Input
          ref={searchInputRef}
          type="search"
          placeholder={
            pt
              ? "Buscar por nome, @username ou curso..."
              : "Search by name, @username or course..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-xl border-border/80 pl-10 pr-24 text-base dark:border-[#262626] dark:bg-[#101010] dark:text-[#FAFAFA]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex dark:border-[#333] dark:bg-[#1a1a1a]">
          ⌘K
        </kbd>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:gap-3">
          <div className="space-y-1.5 min-w-[140px] lg:w-44">
            <Label className="text-xs text-muted-foreground">
              {pt ? "Curso" : "Course"}
            </Label>
            <Input
              placeholder={pt ? "Ex.: Eng. Software" : "e.g. CS"}
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="h-10 rounded-xl dark:border-[#262626] dark:bg-[#101010]"
            />
          </div>
          <div className="space-y-1.5 min-w-[140px] lg:w-44">
            <Label className="text-xs text-muted-foreground">
              {pt ? "Semestre" : "Semester"}
            </Label>
            <Select
              value={periodo || "todos"}
              onValueChange={(v) => setPeriodo(v === "todos" ? "" : v)}
            >
              <SelectTrigger className="h-10 rounded-xl dark:border-[#262626] dark:bg-[#101010]">
                <SelectValue placeholder={pt ? "Todos" : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{pt ? "Todos" : "All"}</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}º {pt ? "período" : "period"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[140px] lg:w-48">
            <Label className="text-xs text-muted-foreground">
              {pt ? "Tipo de perfil" : "Profile type"}
            </Label>
            <Select
              value={tipoPerfil || "todos"}
              onValueChange={(v) => setTipoPerfil(v === "todos" ? "" : v)}
            >
              <SelectTrigger className="h-10 rounded-xl dark:border-[#262626] dark:bg-[#101010]">
                <SelectValue placeholder={pt ? "Todos" : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{pt ? "Todos" : "All"}</SelectItem>
                <SelectItem value="estudante">
                  {pt ? "Estudante" : "Student"}
                </SelectItem>
                <SelectItem value="professor">
                  {pt ? "Professor" : "Teacher"}
                </SelectItem>
                <SelectItem value="servidor">
                  {pt ? "Servidor" : "Staff"}
                </SelectItem>
                <SelectItem value="outro">{pt ? "Outro" : "Other"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[140px] lg:w-44">
            <Label className="text-xs text-muted-foreground">Campus</Label>
            <Select
              value={campus || "todos"}
              onValueChange={(v) => setCampus(v === "todos" ? "" : v)}
            >
              <SelectTrigger className="h-10 rounded-xl dark:border-[#262626] dark:bg-[#101010]">
                <SelectValue placeholder={pt ? "Todos" : "All"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{pt ? "Todos" : "All"}</SelectItem>
                <SelectItem value="sede">{pt ? "Sede" : "Main"}</SelectItem>
                <SelectItem value="icet">ICET</SelectItem>
                <SelectItem value="remoto">{pt ? "Remoto" : "Remote"}</SelectItem>
                <SelectItem value="outro">{pt ? "Outro" : "Other"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="h-10 shrink-0 gap-1 text-muted-foreground hover:text-foreground"
            onClick={resetFilters}
          >
            <X className="h-4 w-4" />
            {pt ? "Limpar filtros" : "Clear filters"}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-24 dark:border-[#333]">
          <Users className="mb-4 h-12 w-12 animate-pulse text-[#05865E]" />
          <p className="text-sm text-muted-foreground">
            {pt ? "Carregando usuários…" : "Loading users…"}
          </p>
        </div>
      ) : users.length === 0 ? (
        <Card className={cn(cardShell, "border-dashed")}>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-40" />
            <p className="font-medium">
              {pt ? "Nenhum usuário encontrado" : "No users found"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? pt
                  ? "Tente ajustar filtros ou a busca."
                  : "Try adjusting filters or search."
                : pt
                  ? "Não há usuários disponíveis no momento."
                  : "No users available right now."}
            </p>
            {hasFilters ? (
              <Button variant="outline" className="mt-4 rounded-xl" onClick={resetFilters}>
                {pt ? "Limpar filtros" : "Clear filters"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          <p className="text-xs text-muted-foreground dark:text-[#737373]">
            {total}{" "}
            {pt
              ? total === 1
                ? "pessoa encontrada"
                : "pessoas encontradas"
              : total === 1
                ? "person found"
                : "people found"}
          </p>

          {/* Sugestões */}
          <section className="space-y-4" aria-labelledby="discover-suggestions-heading">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="discover-suggestions-heading"
                  className="text-lg font-semibold dark:text-[#FAFAFA]"
                >
                  {pt ? "Sugestões para você" : "Suggestions for you"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-[#A3A3A3]">
                  {pt
                    ? "Pessoas que podem fazer parte da sua jornada acadêmica."
                    : "People who could be part of your academic journey."}
                </p>
              </div>
              {suggestions.length >= 4 && !expandedSuggestions ? (
                <Button
                  type="button"
                  variant="link"
                  className="shrink-0 gap-1 text-[#05865E] no-underline hover:no-underline"
                  onClick={() => setExpandedSuggestions(true)}
                >
                  {pt ? "Ver todos" : "See all"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : expandedSuggestions ? (
                <Button
                  type="button"
                  variant="link"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => setExpandedSuggestions(false)}
                >
                  {pt ? "Mostrar menos" : "Show less"}
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {suggestions.map(renderLargeCard)}
            </div>
          </section>

          {/* Destaque */}
          <section
            id="usuarios-destaque"
            className="space-y-4"
            aria-labelledby="discover-featured-heading"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="discover-featured-heading"
                  className="text-lg font-semibold dark:text-[#FAFAFA]"
                >
                  {pt ? "Usuários em destaque" : "Featured users"}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-[#A3A3A3]">
                  {pt
                    ? "Perfis ativos e com interesses parecidos com os seus."
                    : "Active profiles with interests aligned to yours."}
                </p>
              </div>
              {users.length < total ? (
                <Button
                  type="button"
                  variant="link"
                  className="shrink-0 gap-1 text-[#05865E] no-underline hover:no-underline"
                  onClick={() => setFetchLimit((n) => n + 24)}
                >
                  {pt ? "Ver todos" : "See all"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.map(renderCompactCard)}
            </div>
          </section>
        </div>
      )}

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedUser ? selectedUser.nome : ""}</SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="flex flex-col gap-5 pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="mb-3 h-20 w-20">
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.nome} />
                  <AvatarFallback className="text-lg">
                    {initialsFromName(selectedUser.nome)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">{selectedUser.nome}</h2>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {selectedUser.curso && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <GraduationCap className="h-3 w-3" />
                      {selectedUser.curso}
                    </Badge>
                  )}
                  {selectedUser.periodo && (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Hash className="h-3 w-3" />
                      {periodoLabel(String(selectedUser.periodo))}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      {selectedUser.stats.totalSeguidores}
                    </strong>{" "}
                    {pt ? "seguidores" : "followers"}
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      {selectedUser.stats.totalSeguindo}
                    </strong>{" "}
                    {pt ? "seguindo" : "following"}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  {pt ? "Sobre" : "About"}
                </p>
                {selectedUser.bio ? (
                  <p className="text-sm leading-relaxed">{selectedUser.bio}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    {pt
                      ? "Este usuário ainda não adicionou uma descrição."
                      : "No description yet."}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button asChild className="min-w-[160px] gap-2">
                  <Link href={`/perfil/${selectedUser.id}`}>
                    <User className="h-4 w-4" />
                    {pt ? "Ver perfil" : "View profile"}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="min-w-[160px] gap-2"
                  onClick={() => {
                    handleFollow(selectedUser.id, selectedUser.isFollowing);
                  }}
                >
                  {selectedUser.isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      {pt ? "Deixar de seguir" : "Unfollow"}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      {pt ? "Seguir" : "Follow"}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => {
                    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/perfil/${selectedUser.id}`;
                    void navigator.clipboard.writeText(url);
                    toast.success(pt ? "Link copiado!" : "Link copied!");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {pt ? "Compartilhar perfil" : "Share profile"}
                </Button>
              </div>

              <p className="border-t pt-2 text-center text-xs text-muted-foreground">
                {pt
                  ? "No perfil completo: disciplinas, avaliações e atividades."
                  : "Full profile: subjects, grades and activity."}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-lg sm:rounded-2xl">
          <DialogTitle className="sr-only">
            {t.configuracoes.conviteUsuario}
          </DialogTitle>
          <InviteUserPanel
            nomeUsuario={inviteNome}
            onNomeUsuarioChange={setInviteNome}
            email={inviteEmail}
            onEmailChange={setInviteEmail}
            mensagem={inviteMensagem}
            onMensagemChange={setInviteMensagem}
            inviteLink={inviteLink}
            onSubmit={handleEnviarConvite}
            loading={inviteLoading}
            locale={locale}
            showCancel
            onCancel={() => setInviteDialogOpen(false)}
            title={t.configuracoes.conviteUsuario}
            subtitle={t.configuracoes.conviteUsuarioDesc}
            compactTop
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
