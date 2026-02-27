"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  User,
  Settings,
  LogOut,
  Share2,
  LogIn,
  Lock,
  Copy,
  Check,
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
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
import { cn } from "@/lib/utils";
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
  criador?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
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
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Estudo</h1>
          <p className="text-muted-foreground mt-1">
            Colabore e estude junto com seus colegas
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEntrarDialog} onOpenChange={setShowEntrarDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar em Grupo
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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Grupo
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
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupos..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={mostrarInativos ? "default" : "outline"}
            size="sm"
            onClick={() => setMostrarInativos(!mostrarInativos)}
          >
            {mostrarInativos ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultar Arquivados
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar Arquivados
              </>
            )}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Users className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando grupos...</p>
          </div>
        </div>
      ) : filteredGrupos.length === 0 ? (
        <Card>
          <CardContent className="py-4">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedGrupos.map((grupo) => (
            <Card
              key={grupo.id}
              className={cn(
                "group flex flex-col min-h-0 transition-all duration-200 hover:shadow-lg hover:border-primary/15",
                grupo.ativo === false && "opacity-60",
                grupo.visibilidade === "privado"
                  ? "border-l-4 border-l-primary/60"
                  : "border-l-4 border-l-emerald-500/50"
              )}
            >
              <CardHeader className="gap-3 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg truncate pr-1">
                        {grupo.nome}
                      </CardTitle>
                      {grupo.ativo === false ? (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
                          Arquivado
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-md shrink-0",
                            grupo.visibilidade === "privado"
                              ? "text-primary bg-primary/10 border border-primary/20"
                              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
                          )}
                        >
                          {grupo.visibilidade === "publico" ? "Público" : "Privado"}
                        </span>
                      )}
                    </div>
                    {grupo.descricao && (
                      <CardDescription className="mt-1.5 line-clamp-2">
                        {grupo.descricao}
                      </CardDescription>
                    )}
                  </div>
                  {isAdmin(grupo) && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity",
                              grupo.ativo === false
                                ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
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
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                <div className="rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                      <span className="truncate">
                        {grupo.criador?.raw_user_meta_data?.nome ||
                          grupo.criador?.raw_user_meta_data?.email ||
                          "Criador"}
                      </span>
                    </div>
                    {grupo.visibilidade === "privado" &&
                      grupo.codigo_acesso && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Lock className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs font-semibold">
                            {grupo.codigo_acesso}
                          </span>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleCopyCodigo(grupo.codigo_acesso!)
                                  }
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                >
                                  {codigoCopiado === grupo.codigo_acesso ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar código</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                    <span>
                      {new Date(grupo.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 mt-auto">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="flex-1 h-9 min-w-0"
                  >
                    <Link
                      href={`/grupos/${grupo.id}`}
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      Abrir
                    </Link>
                  </Button>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredGrupos.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
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
