"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  User,
  Share2,
  LogIn,
  Lock,
  Copy,
  Check,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
function monogramGrupo(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return (nome.trim().slice(0, 2) || "?").toUpperCase();
}

function grupoCardPatternBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
      aria-hidden
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,128,0.12) 1px, transparent 0)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}

function tagDisciplinaClass(i: number) {
  const classes = [
    "border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
    "border-violet-500/35 bg-violet-500/12 text-violet-800 dark:text-violet-300",
    "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300",
    "border-sky-500/35 bg-sky-500/12 text-sky-800 dark:text-sky-300",
  ];
  return classes[i % classes.length]!;
}

function periodoLetivoLabel(iso: string) {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  const sem = m <= 6 ? "1" : "2";
  return `${sem}º sem. ${y}`;
}

function porteGrupo(membros: number) {
  if (membros < 6) {
    return {
      label: "Pequeno",
      chipClass:
        "border-sky-500/35 bg-sky-500/12 text-sky-800 dark:text-sky-300",
    };
  }
  if (membros <= 20) {
    return {
      label: "Médio",
      chipClass:
        "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300",
    };
  }
  return {
    label: "Grande",
    chipClass:
      "border-violet-500/35 bg-violet-500/12 text-violet-800 dark:text-violet-300",
  };
}

interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  criador_id: string;
  visibilidade: string;
  link_convite: string;
  codigo_acesso?: string;
  ativo?: boolean;
  created_at: string;
  max_membros?: number;
  membros_count?: number;
  tags?: string[] | null;
  foto_url?: string | null;
  requer_aprovacao?: boolean;
  criador?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}

function iniciaisCriador(grupo: Grupo) {
  const raw =
    grupo.criador?.raw_user_meta_data?.nome ||
    grupo.criador?.raw_user_meta_data?.email ||
    "";
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return "?";
}

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEntrarDialog, setShowEntrarDialog] = useState(false);
  const [tipoGrupoEntrar, setTipoGrupoEntrar] = useState<
    "publico" | "privado" | ""
  >("");
  const [codigoEntrar, setCodigoEntrar] = useState("");
  const [linkEntrar, setLinkEntrar] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [grupoToArchive, setGrupoToArchive] = useState<{
    id: string;
    nome: string;
    isAtivo: boolean;
  } | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    visibilidade: "publico",
    requer_aprovacao: false,
    max_membros: 50,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const GRUPOS_PER_PAGE = 9;

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok && !cancelled) {
          const { profile } = await res.json();
          setCurrentUserId(profile?.id ?? null);
        }
      } catch {
        if (!cancelled) setCurrentUserId(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const loadGrupos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/colaboracao/grupos?meus_grupos=true");
      if (response.ok) {
        const { grupos: gruposData } = await response.json();
        setGrupos(gruposData || []);
      } else {
        const errorData = await response.json();
        console.error("❌ Erro ao carregar grupos:", errorData);
        toast.error(errorData.error || "Erro ao carregar grupos");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar grupos:", error);
      toast.error("Erro ao carregar grupos");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateGrupo = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    try {
      const response = await fetch("/api/colaboracao/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const { grupo } = await response.json();
        console.log("✅ Grupo criado:", grupo);
        toast.success("Grupo criado com sucesso!");
        setShowCreateDialog(false);
        setFormData({
          nome: "",
          descricao: "",
          visibilidade: "publico",
          requer_aprovacao: false,
          max_membros: 50,
        });
        await loadGrupos();
        console.log("📋 Grupos após criação:", grupos.length);
      } else {
        const data = await response.json();
        console.error("Erro ao criar grupo:", data);
        toast.error(data.error || data.details || "Erro ao criar grupo");
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast.error("Erro ao criar grupo");
    }
  };

  const handleEntrarGrupo = async () => {
    if (!tipoGrupoEntrar) {
      toast.error("Selecione o tipo de grupo");
      return;
    }

    if (tipoGrupoEntrar === "publico" && !linkEntrar.trim()) {
      toast.error("Link de convite é obrigatório para grupos públicos");
      return;
    }

    if (tipoGrupoEntrar === "privado" && !codigoEntrar.trim()) {
      toast.error("Código de acesso é obrigatório para grupos privados");
      return;
    }

    try {
      setEntrando(true);

      if (tipoGrupoEntrar === "publico") {
        const linkMatch = linkEntrar.match(/\/grupos\/convite\/([^\/]+)/);
        if (linkMatch) {
          const linkConvite = linkMatch[1];
          const response = await fetch(
            `/api/colaboracao/grupos/entrar?link=${linkConvite}`,
            { credentials: "include" }
          );
          const data = await response.json();
          if (response.ok) {
            if (data.pendente) {
              toast.success(
                data.mensagem || "Solicitação enviada! Aguarde aprovação.",
              );
            } else {
              toast.success("Você entrou no grupo com sucesso!");
            }
            setShowEntrarDialog(false);
            setCodigoEntrar("");
            setLinkEntrar("");
            setTipoGrupoEntrar("");
            await loadGrupos();
          } else {
            const message =
              response.status === 401
                ? data.error || "Faça login para entrar no grupo."
                : data.error || "Erro ao entrar no grupo";
            toast.error(message);
            if (response.status === 401) {
              window.location.href = `/login?redirect=${encodeURIComponent("/grupos")}`;
            }
          }
        } else {
          toast.error(
            "Link inválido. Certifique-se de copiar o link completo.",
          );
        }
      } else if (tipoGrupoEntrar === "privado") {
        const response = await fetch(
          `/api/colaboracao/grupos/entrar?codigo=${codigoEntrar.trim()}`,
          { credentials: "include" }
        );
        const data = await response.json();
        if (response.ok) {
          if (data.pendente) {
            toast.success(
              data.mensagem || "Solicitação enviada! Aguarde aprovação.",
            );
          } else {
            toast.success("Você entrou no grupo com sucesso!");
          }
          setShowEntrarDialog(false);
          setCodigoEntrar("");
          setLinkEntrar("");
          setTipoGrupoEntrar("");
          await loadGrupos();
        } else {
          const message =
            response.status === 401
              ? data.error || "Faça login para entrar no grupo."
              : data.error || "Erro ao entrar no grupo";
          toast.error(message);
          if (response.status === 401) {
            window.location.href = `/login?redirect=${encodeURIComponent("/grupos")}`;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error);
      toast.error("Erro ao entrar no grupo");
    } finally {
      setEntrando(false);
    }
  };

  const handleCopyCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCodigoCopiado(codigo);
    toast.success("Código copiado!");
    setTimeout(() => setCodigoCopiado(null), 2000);
  };

  const handleToggleAtivo = (
    grupoId: string,
    grupoNome: string,
    atualAtivo: boolean,
  ) => {
    if (atualAtivo) {
      setGrupoToArchive({ id: grupoId, nome: grupoNome, isAtivo: atualAtivo });
    } else {
      confirmArchiveToggle(grupoId, atualAtivo);
    }
  };

  const confirmArchiveToggle = async (id?: string, isAtivo?: boolean) => {
    const targetId = id || grupoToArchive?.id;
    const targetIsAtivo =
      isAtivo !== undefined ? isAtivo : grupoToArchive?.isAtivo;

    if (!targetId) return;

    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${targetId}/toggle-ativo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !targetIsAtivo }),
        },
      );
      if (response.ok) {
        toast.success(
          !targetIsAtivo
            ? "Grupo ativado com sucesso!"
            : "Grupo arquivado com sucesso!",
        );
        setGrupoToArchive(null);
        await loadGrupos();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar status do grupo");
      }
    } catch (error) {
      console.error("Erro ao alterar status do grupo:", error);
      toast.error("Erro ao alterar status do grupo");
    }
  };

  const filteredGrupos = grupos.filter((grupo) => {
    const matchSearch = grupo.nome.toLowerCase().includes(search.toLowerCase());
    const matchAtivo = mostrarInativos ? true : grupo.ativo !== false;
    return matchSearch && matchAtivo;
  });

  const totalPages = Math.max(1, Math.ceil(filteredGrupos.length / GRUPOS_PER_PAGE));
  const paginatedGrupos = filteredGrupos.slice(
    (page - 1) * GRUPOS_PER_PAGE,
    page * GRUPOS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [search, mostrarInativos]);

  const isAdmin = (grupo: Grupo) => currentUserId !== null && grupo.criador_id === currentUserId;

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Grupos de estudo
          </h1>
          <p className="text-sm text-muted-foreground">
            Colabore e estude junto com seus colegas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showEntrarDialog} onOpenChange={setShowEntrarDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full border-border/80">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar em grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrar em Grupo</DialogTitle>
                <DialogDescription>
                  Selecione o tipo de grupo e informe os dados necessários. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tipo de Grupo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoGrupoEntrar}
                    onChange={(e) => {
                      setTipoGrupoEntrar(
                        e.target.value as "publico" | "privado" | "",
                      );
                      setCodigoEntrar("");
                      setLinkEntrar("");
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
                {tipoGrupoEntrar === "publico" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Link de Convite <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={linkEntrar}
                      onChange={(e) => setLinkEntrar(e.target.value)}
                      placeholder="https://.../grupos/convite/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o link completo de convite do grupo
                    </p>
                  </div>
                )}
                {tipoGrupoEntrar === "privado" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Código de Acesso <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={codigoEntrar}
                      onChange={(e) => setCodigoEntrar(e.target.value)}
                      placeholder="Digite o código de 6 dígitos"
                      maxLength={6}
                      className="text-center text-lg tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Digite o código de acesso fornecido pelo criador do grupo
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEntrarDialog(false);
                      setCodigoEntrar("");
                      setLinkEntrar("");
                      setTipoGrupoEntrar("");
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEntrarGrupo}
                    disabled={
                      entrando ||
                      !tipoGrupoEntrar ||
                      (tipoGrupoEntrar === "publico" && !linkEntrar.trim()) ||
                      (tipoGrupoEntrar === "privado" && !codigoEntrar.trim())
                    }
                    className="flex-1"
                  >
                    {entrando ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-5 font-semibold shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Criar grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>
                  Crie um grupo de estudo para colaborar com seus colegas. Campos com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Nome do Grupo <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Grupo de Cálculo I"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Descreva o propósito do grupo..."
                    className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Visibilidade</label>
                  <select
                    value={formData.visibilidade}
                    onChange={(e) =>
                      setFormData({ ...formData, visibilidade: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
                {formData.visibilidade === "privado" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requer_aprovacao"
                      checked={formData.requer_aprovacao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requer_aprovacao: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="requer_aprovacao"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Requer aprovação do admin para entrar no grupo
                    </label>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">
                    Limite de Membros <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="2"
                    max="50"
                    value={formData.max_membros}
                    required
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 50;
                      const clampedValue = Math.min(Math.max(value, 2), 50);
                      setFormData({
                        ...formData,
                        max_membros: clampedValue,
                      });
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número máximo de membros no grupo (máximo: 50)
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateGrupo}>Criar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupos..."
            className="h-12 rounded-full border-border/80 bg-muted/40 pl-11 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Button
          type="button"
          variant={mostrarInativos ? "default" : "outline"}
          size="sm"
          className="h-11 shrink-0 rounded-full border-border/80 px-4"
          onClick={() => setMostrarInativos(!mostrarInativos)}
        >
          {mostrarInativos ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Ocultar arquivados
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Mostrar arquivados
            </>
          )}
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Users className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando grupos...</p>
          </div>
        </div>
      ) : filteredGrupos.length === 0 ? (
        <section className="rounded-3xl border border-border/80 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          <EmptyState
            icon={Users}
            title={
              grupos.length === 0
                ? "Nenhum grupo ainda"
                : "Nenhum grupo encontrado"
            }
            description={
              grupos.length === 0
                ? "Crie seu primeiro grupo de estudo para começar a colaborar com colegas."
                : "Tente buscar com outros termos ou ajustar os filtros."
            }
            action={
              grupos.length === 0
                ? {
                    label: "Criar primeiro grupo",
                    onClick: () => setShowCreateDialog(true),
                    icon: Plus,
                  }
                : undefined
            }
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-6">
          {paginatedGrupos.map((grupo) => {
            const membros = grupo.membros_count ?? 0;
            const maxM = grupo.max_membros ?? 50;
            const lotacaoPct =
              maxM > 0 ? Math.min(100, Math.round((membros / maxM) * 100)) : 0;
            const mono = monogramGrupo(grupo.nome);
            const isPriv = grupo.visibilidade === "privado";
            const tags = (grupo.tags ?? []).filter(Boolean);
            const primeiraTag = tags[0];
            const porte = porteGrupo(membros);
            const vagasLivres =
              maxM > 0 ? Math.max(0, maxM - membros) : null;
            const alertaVagas =
              vagasLivres !== null && vagasLivres <= 3 && grupo.ativo !== false;

            return (
              <article
                key={grupo.id}
                className={cn(
                  "group relative flex min-h-[400px] w-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03] transition-all duration-300 dark:ring-white/[0.05]",
                  "hover:-translate-y-0.5 hover:shadow-xl",
                  grupo.ativo === false && "border-dashed opacity-65",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-24 opacity-45",
                    isPriv
                      ? "bg-gradient-to-b from-primary/25 to-transparent"
                      : "bg-gradient-to-b from-emerald-500/25 to-transparent",
                  )}
                  aria-hidden
                />
                {grupoCardPatternBg()}
                <div
                  className="pointer-events-none absolute bottom-1 right-2 select-none text-5xl font-black tabular-nums tracking-tighter text-foreground/[0.06] dark:text-foreground/[0.1]"
                  aria-hidden
                >
                  {mono}
                </div>

                <div
                  className={cn(
                    "relative z-[1] h-1 w-2/5 max-w-[120px] rounded-br-2xl",
                    isPriv ? "bg-primary" : "bg-emerald-500",
                  )}
                  aria-hidden
                />

                <div className="relative z-[1] flex min-h-0 flex-1 flex-col p-5 pt-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="line-clamp-2 min-w-0 flex-1 text-lg font-bold leading-snug tracking-tight text-foreground">
                          {grupo.nome}
                        </h2>
                        {primeiraTag ? (
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              tagDisciplinaClass(
                                Math.abs(
                                  primeiraTag.split("").reduce(
                                    (a, c) => a + c.charCodeAt(0),
                                    0,
                                  ),
                                ),
                              ),
                            )}
                          >
                            {primeiraTag}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground/85">
                          Foco:{" "}
                        </span>
                        {grupo.descricao?.trim()
                          ? grupo.descricao
                          : "Adicione uma descrição na página do grupo para destacar o tema ou o conteúdo em estudo."}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {grupo.ativo === false ? (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground opacity-45">
                                <ChevronRight className="h-5 w-5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Desarquive o grupo para abrir</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Link
                            href={`/grupos/${grupo.id}`}
                            aria-label="Abrir grupo"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      )}
                      {isAdmin(grupo) && (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-9 w-9 shrink-0 rounded-full opacity-80 transition-opacity hover:opacity-100",
                                  grupo.ativo === false
                                    ? "text-emerald-600 hover:bg-emerald-500/10"
                                    : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700",
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleToggleAtivo(
                                    grupo.id,
                                    grupo.nome,
                                    grupo.ativo !== false,
                                  );
                                }}
                              >
                                {grupo.ativo === false ? (
                                  <ArchiveRestore className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {grupo.ativo !== false
                                  ? "Arquivar grupo"
                                  : "Ativar grupo"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {grupo.ativo === false ? (
                      <span className="shrink-0 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Arquivado
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          isPriv
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {grupo.visibilidade === "publico"
                          ? "Público"
                          : "Privado"}
                      </span>
                    )}
                    {grupo.requer_aprovacao && grupo.ativo !== false ? (
                      <span className="shrink-0 rounded-full border border-amber-500/35 bg-amber-500/12 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                        Entrada sob aprovação
                      </span>
                    ) : null}
                  </div>

                  <div className="border-t border-border/60" />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      {periodoLetivoLabel(grupo.created_at)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        porte.chipClass,
                      )}
                    >
                      {porte.label}
                    </span>
                    {alertaVagas && vagasLivres !== null ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                        title="Poucas vagas restantes"
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {vagasLivres}{" "}
                        {vagasLivres === 1 ? "vaga" : "vagas"}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
                      <TrendingUp className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {lotacaoPct}% ocupação
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 dark:bg-muted/10 sm:grid-cols-2">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                        <span>Membros</span>
                        <span className="tabular-nums text-muted-foreground">
                          {membros}
                          {maxM > 0 ? (
                            <span className="text-muted-foreground/80">
                              {" "}
                              / {maxM}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div className="mt-2 flex min-w-0 items-center gap-2">
                        <div className="flex shrink-0 -space-x-2">
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarFallback className="text-[10px] font-semibold">
                              {iniciaisCriador(grupo)}
                            </AvatarFallback>
                          </Avatar>
                          {membros > 1 ? (
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground"
                              title={`Mais ${membros - 1} ${
                                membros - 1 === 1 ? "membro" : "membros"
                              }`}
                            >
                              +{membros - 1}
                            </div>
                          ) : null}
                        </div>
                        <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                          <User className="mr-1 inline h-3 w-3 align-text-bottom opacity-80" />
                          {grupo.criador?.raw_user_meta_data?.nome ||
                            grupo.criador?.raw_user_meta_data?.email ||
                            "Criador"}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                        <span>Lotação</span>
                        <span className="tabular-nums">{lotacaoPct}%</span>
                      </div>
                      {maxM > 0 ? (
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isPriv ? "bg-primary/80" : "bg-emerald-500/80",
                            )}
                            style={{ width: `${lotacaoPct}%` }}
                          />
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Sem limite de vagas definido
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-90" />
                      Criado em{" "}
                      {new Date(grupo.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {grupo.visibilidade === "privado" &&
                    grupo.codigo_acesso ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-mono text-[11px] font-semibold tracking-wide text-foreground">
                          {grupo.codigo_acesso}
                        </span>
                        {grupo.ativo === false ? (
                          <span
                            className="cursor-not-allowed rounded p-1 opacity-50"
                            title="Desarquive o grupo para copiar o código"
                          >
                            <Copy className="h-3 w-3" />
                          </span>
                        ) : (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyCodigo(grupo.codigo_acesso!)
                                  }
                                  className="rounded-md p-1.5 transition-colors hover:bg-muted"
                                >
                                  {codigoCopiado === grupo.codigo_acesso ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar código</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-auto flex gap-2 border-t border-border/50 bg-muted/15 pt-4 dark:bg-muted/10">
                    {grupo.ativo === false ? (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-11 min-w-0 flex-1 rounded-full pointer-events-none opacity-70"
                              disabled
                            >
                              <MessageSquare className="h-4 w-4 shrink-0" />
                              Abrir
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Desarquive o grupo para abrir</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="h-11 min-w-0 flex-1 rounded-full font-semibold shadow-sm"
                      >
                        <Link
                          href={`/grupos/${grupo.id}`}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          Abrir grupo
                          <ArrowUpRight className="h-4 w-4 shrink-0 opacity-90" />
                        </Link>
                      </Button>
                    )}
                    {grupo.visibilidade === "publico" &&
                      (grupo.ativo === false ? (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0 rounded-full pointer-events-none opacity-70"
                                disabled
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Desarquive o grupo para compartilhar</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 shrink-0 rounded-full border-border/80"
                                onClick={() => {
                                  const link = `${window.location.origin}/grupos/convite/${grupo.link_convite}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link de convite copiado!");
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copiar link de convite</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filteredGrupos.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-medium text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog de confirmação para arquivar */}
      <Dialog
        open={!!grupoToArchive}
        onOpenChange={(open) => !open && setGrupoToArchive(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              Arquivar Grupo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar o grupo{" "}
              <span className="font-semibold text-foreground">
                {grupoToArchive?.nome}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-amber-500/10 border-amber-500/30 p-4 text-sm">
              <p className="text-amber-600 dark:text-amber-400">
                <strong>O que acontece ao arquivar:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>O grupo não aparecerá na lista principal</li>
                <li>Você poderá reativá-lo a qualquer momento</li>
                <li>As mensagens e dados do grupo serão mantidos</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrupoToArchive(null)}>
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => confirmArchiveToggle()}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
