"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Library,
  Search,
  Filter,
  FileText,
  Download,
  Heart,
  Eye,
  User,
  Plus,
  Upload,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  Tag,
  Users,
  Archive,
  ArchiveRestore,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  FolderOpen,
  Share2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const BIBLIOTECA_PINNED_KEY = "biblioteca-pinned";

function getMaterialIcon(tipo: string) {
  switch (tipo) {
    case "link":
      return LinkIcon;
    case "anotacao":
    case "flashcard":
      return FileText;
    default:
      return FolderOpen;
  }
}

function formatAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semana(s)`;
  return `Há ${Math.floor(diffDays / 30)} mês(es)`;
}

interface Material {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  categoria?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: number;
  visualizacoes: number;
  downloads: number;
  ativo?: boolean;
  user_id?: string;
  grupo_id?: string | null;
  curtidas: number;
  tags?: string[];
  created_at: string;
  grupo?: {
    id: string;
    nome: string;
  };
  visibilidade?: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}

interface Grupo {
  id: string;
  nome: string;
  visibilidade: string;
}
export default function BibliotecaPage() {
  const searchParams = useSearchParams();
  const grupoIdFromUrl = searchParams.get("grupo_id");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroGrupo, setFiltroGrupo] = useState<string>(grupoIdFromUrl || "");
  const [filtroFormato, setFiltroFormato] = useState<string>("");
  const [ordenar, setOrdenar] = useState<string>("recentes");
  const [filtroTags, setFiltroTags] = useState<string>("");
  const [showBuscaAvancada, setShowBuscaAvancada] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "arquivo",
    categoria: "",
    grupo_id: "",
    arquivo_url: "",
    tags: "",
    visibilidade: "publico",
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [arquivoMetodo, setArquivoMetodo] = useState<"upload" | "url">(
    "upload"
  );
  const [subtipoAnotacao, setSubtipoAnotacao] = useState<string>("");
  const [subtipoFlashcard, setSubtipoFlashcard] = useState<string>("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [materialToArchive, setMaterialToArchive] = useState<{
    id: string;
    titulo: string;
    isAtivo: boolean;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dialogShake, setDialogShake] = useState(false);
  const [addMaterialStep, setAddMaterialStep] = useState(1);

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(BIBLIOTECA_PINNED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [quickAccessMaterials, setQuickAccessMaterials] = useState<Material[]>([]);
  const [recentTableMaterials, setRecentTableMaterials] = useState<Material[]>([]);
  const [pinnedMaterials, setPinnedMaterials] = useState<Material[]>([]);
  const [loadingQuick, setLoadingQuick] = useState(true);
  const [loadingPinned, setLoadingPinned] = useState(false);

  useEffect(() => {
    if (grupoIdFromUrl && !filtroGrupo) {
      setFiltroGrupo(grupoIdFromUrl);
    }
    loadGrupos();
    loadCurrentUser();
  }, [grupoIdFromUrl]);

  const loadQuickAndRecent = useCallback(async () => {
    setLoadingQuick(true);
    try {
      const res = await fetch(
        `/api/colaboracao/biblioteca?ordenar=recentes&limit=10&offset=0`
      );
      if (!res.ok) {
        if (res.status === 401) toast.error("Faça login para ver a biblioteca.");
        return;
      }
      const data = await res.json();
      const list = (data.materiais || []).filter((m: Material) => m.ativo !== false);
      setQuickAccessMaterials(list.slice(0, 4));
      setRecentTableMaterials(list);
    } catch (e) {
      console.error("Erro ao carregar acesso rápido/recentes:", e);
    } finally {
      setLoadingQuick(false);
    }
  }, []);

  const loadPinned = useCallback(async () => {
    if (pinnedIds.length === 0) {
      setPinnedMaterials([]);
      return;
    }
    setLoadingPinned(true);
    try {
      const res = await fetch(
        `/api/colaboracao/biblioteca?ids=${pinnedIds.join(",")}&limit=20`
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = (data.materiais || []).filter((m: Material) => m.ativo !== false);
      setPinnedMaterials(list);
    } catch (e) {
      console.error("Erro ao carregar fixados:", e);
    } finally {
      setLoadingPinned(false);
    }
  }, [pinnedIds.join(",")]);

  useEffect(() => {
    loadQuickAndRecent();
  }, [loadQuickAndRecent]);

  useEffect(() => {
    loadPinned();
  }, [loadPinned]);

  const togglePin = (materialId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId];
      try {
        localStorage.setItem(BIBLIOTECA_PINNED_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const loadCurrentUser = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setCurrentUserId(profile?.id || null);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const loadGrupos = async () => {
    try {
      const response = await fetch("/api/colaboracao/grupos?meus_grupos=true");
      if (response.ok) {
        const { grupos: gruposData } = await response.json();
        setGrupos(gruposData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const gruposPublicos = grupos.filter((g) => g.visibilidade === "publico");
  const gruposPrivados = grupos.filter((g) => g.visibilidade === "privado");
  const gruposDisponiveis =
    formData.visibilidade === "privado"
      ? gruposPrivados
      : formData.visibilidade === "publico"
      ? gruposPublicos
      : [];

  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const [materiaisInfinite, setMateriaisInfinite] = useState<Material[]>([]);
  const [loadingInfinite, setLoadingInfinite] = useState(false);
  const [totalMateriais, setTotalMateriais] = useState(0);

  const loadMateriais = useCallback(
    async (pageNum?: number) => {
      const p = pageNum ?? page;
      setLoadingInfinite(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("busca", search);
        if (filtroTipo && filtroTipo !== "all") params.append("tipo", filtroTipo);
        if (filtroCategoria && filtroCategoria !== "all")
          params.append("categoria", filtroCategoria);
        if (filtroGrupo && filtroGrupo !== "none")
          params.append("grupo_id", filtroGrupo);
        if (ordenar) params.append("ordenar", ordenar);
        if (filtroTags.trim()) params.append("tags", filtroTags.trim());
        params.append("limit", ITEMS_PER_PAGE.toString());
        params.append("offset", ((p - 1) * ITEMS_PER_PAGE).toString());

        const response = await fetch(
          `/api/colaboracao/biblioteca?${params.toString()}`
        );
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const msg =
            response.status === 401
              ? "Faça login para ver a biblioteca."
              : response.status === 403
                ? "Você não tem permissão para acessar estes materiais."
                : errBody.error || "Erro ao carregar materiais";
          toast.error(msg);
          throw new Error(msg);
        }
        const data = await response.json();
        setMateriaisInfinite(data.materiais || []);
        setTotalMateriais(data.total ?? 0);
      } catch (err) {
        console.error(err);
        setMateriaisInfinite([]);
      } finally {
        setLoadingInfinite(false);
      }
    },
    [page, search, filtroTipo, filtroCategoria, filtroGrupo, ordenar, filtroTags]
  );

  useEffect(() => {
    setPage(1);
  }, [search, filtroTipo, filtroCategoria, filtroGrupo, ordenar, filtroTags]);

  useEffect(() => {
    loadMateriais();
  }, [loadMateriais]);

  const resetMateriais = useCallback(() => {
    setPage(1);
    loadMateriais(1);
  }, [loadMateriais]);

  const totalPages = Math.max(1, Math.ceil(totalMateriais / ITEMS_PER_PAGE));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo de 10MB.");
        return;
      }
      setSelectedFile(file);
      setFormData({ ...formData, arquivo_url: file.name });
    }
  };

  const handleUploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);
      formDataUpload.append("folder", "biblioteca");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.details ||
          errorData.error ||
          "Erro ao fazer upload do arquivo";
        toast.error(errorMessage);
        if (errorData.details?.includes("Bucket")) {
          console.error(
            "⚠️ Bucket não encontrado. Crie o bucket 'biblioteca' no Supabase Storage."
          );
        }
        return null;
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (formData.visibilidade === "privado" && !formData.grupo_id) {
      toast.error("Grupo é obrigatório para materiais privados");
      return;
    }

    if (formData.tipo === "arquivo") {
      if (arquivoMetodo === "upload" && !selectedFile) {
        toast.error("Arquivo é obrigatório");
        return;
      }
      if (arquivoMetodo === "url" && !formData.arquivo_url.trim()) {
        toast.error("URL é obrigatória");
        return;
      }
    }

    if (formData.tipo === "link" && !formData.arquivo_url.trim()) {
      toast.error("URL é obrigatória para materiais do tipo link");
      return;
    }

    try {
      setUploading(true);
      let arquivoUrl = formData.arquivo_url;
      let arquivoTipo = "";
      let arquivoTamanho = 0;

      if (selectedFile && formData.tipo === "arquivo") {
        const uploadedUrl = await handleUploadFile();
        if (!uploadedUrl) {
          return;
        }
        arquivoUrl = uploadedUrl;
        arquivoTipo = selectedFile.type;
        arquivoTamanho = selectedFile.size;
      } else if (formData.tipo === "link") {
        arquivoUrl = formData.arquivo_url;
        arquivoTipo = "link";
      }

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (subtipoAnotacao) {
        tagsArray.push(`subtipo:${subtipoAnotacao}`);
      }
      if (subtipoFlashcard) {
        tagsArray.push(`subtipo:${subtipoFlashcard}`);
      }

      const grupoIdFinal =
        formData.visibilidade === "geral"
          ? null
          : formData.grupo_id && formData.grupo_id !== "none"
          ? formData.grupo_id
          : null;

      const response = await fetch("/api/colaboracao/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: formData.titulo.trim(),
          descricao: formData.descricao.trim() || null,
          tipo: formData.tipo,
          categoria: formData.categoria || null,
          grupo_id: grupoIdFinal,
          arquivo_url: arquivoUrl || null,
          arquivo_tipo: arquivoTipo || null,
          arquivo_tamanho: arquivoTamanho || null,
          tags: tagsArray,
          visibilidade: formData.visibilidade,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Material adicionado com sucesso!");
        setShowAddDialog(false);
        setAddMaterialStep(1);
        setFormData({
          titulo: "",
          descricao: "",
          tipo: "arquivo",
          categoria: "",
          grupo_id: "",
          arquivo_url: "",
          tags: "",
          visibilidade: "publico",
        });
        setSelectedFile(null);
        setArquivoMetodo("upload");
        setSubtipoAnotacao("");
        setSubtipoFlashcard("");
        setDialogShake(false);
        resetMateriais();
      } else {
        toast.error(data.error || "Erro ao adicionar material");
      }
    } catch (error) {
      console.error("Erro ao adicionar material:", error);
      toast.error("Erro ao adicionar material");
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = () => {
    resetMateriais();
  };

  const matchesFormato = (material: Material, formato: string): boolean => {
    if (!formato) return true;
    const url = material.arquivo_url?.toLowerCase() || "";
    const tipo = material.arquivo_tipo?.toLowerCase() || "";

    switch (formato) {
      case "pdf":
        return url.endsWith(".pdf") || tipo === "application/pdf";
      case "image":
        return (
          [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].some((ext) =>
            url.endsWith(ext)
          ) || tipo.startsWith("image/")
        );
      case "doc":
        return (
          [".doc", ".docx", ".txt", ".rtf"].some((ext) => url.endsWith(ext)) ||
          tipo.includes("document") ||
          tipo.includes("text")
        );
      case "csv":
        return (
          [".csv", ".xlsx", ".xls"].some((ext) => url.endsWith(ext)) ||
          tipo.includes("spreadsheet") ||
          tipo.includes("csv")
        );
      default:
        return true;
    }
  };

  const materiaisFiltrados = materiaisInfinite
    .filter((m) => {
      const matchFormato = filtroFormato
        ? matchesFormato(m, filtroFormato)
        : true;
      const matchAtivo = mostrarArquivados ? true : m.ativo !== false;
      return matchFormato && matchAtivo;
    })
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);

  const handleDownload = async (material: Material) => {
    if (material.arquivo_url) {
      try {
        await fetch(`/api/colaboracao/biblioteca/${material.id}/download`, {
          method: "POST",
        });
        window.open(material.arquivo_url, "_blank");
      } catch (error) {
        console.error("Erro ao registrar download:", error);
        window.open(material.arquivo_url, "_blank");
      }
    }
  };

  const handleToggleAtivo = (
    materialId: string,
    materialTitulo: string,
    atualAtivo: boolean
  ) => {
    if (atualAtivo) {
      setMaterialToArchive({
        id: materialId,
        titulo: materialTitulo,
        isAtivo: atualAtivo,
      });
    } else {
      confirmArchiveToggle(materialId, atualAtivo);
    }
  };

  const confirmArchiveToggle = async (id?: string, isAtivo?: boolean) => {
    const targetId = id || materialToArchive?.id;
    const targetIsAtivo =
      isAtivo !== undefined ? isAtivo : materialToArchive?.isAtivo;

    if (!targetId) return;

    try {
      const response = await fetch(
        `/api/colaboracao/biblioteca/${targetId}/toggle-ativo`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !targetIsAtivo }),
        }
      );

      if (response.ok) {
        toast.success(
          !targetIsAtivo
            ? "Material ativado com sucesso!"
            : "Material arquivado com sucesso!"
        );
        setMaterialToArchive(null);
        resetMateriais();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar status do material");
      }
    } catch (error) {
      console.error("Erro ao alterar status do material:", error);
      toast.error("Erro ao alterar status do material");
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Materiais</h1>
          <p className="text-muted-foreground mt-1">
            Explore e compartilhe materiais de estudo
          </p>
        </div>
        <Dialog 
          open={showAddDialog} 
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setDialogShake(false);
              setAddMaterialStep(1);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Material
            </Button>
          </DialogTrigger>
          <DialogContent 
            className={`max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 ${
              dialogShake ? "animate-[shake_0.5s_ease-in-out]" : ""
            }`}
            onInteractOutside={(e) => {
              e.preventDefault();
              setDialogShake(true);
              setTimeout(() => setDialogShake(false), 500);
            }}
          >
            {/* Stepper */}
            <div className="flex items-center justify-center gap-1 px-6 pt-6 pb-2 border-b">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setAddMaterialStep(s)}
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      addMaterialStep === s
                        ? "bg-primary text-primary-foreground"
                        : addMaterialStep > s
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                  {s < 3 && <div className="w-8 h-0.5 bg-muted mx-0.5" />}
                </div>
              ))}
            </div>
            <div className="px-2 text-center text-xs text-muted-foreground mb-4 mt-2">
              {addMaterialStep === 1 && "Informações gerais"}
              {addMaterialStep === 2 && "Visibilidade"}
              {addMaterialStep === 3 && "Conteúdo"}
            </div>

            <div className="px-6 pb-6 space-y-4">
            {addMaterialStep === 1 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle>Informações do material</DialogTitle>
                  <DialogDescription>
                    Título, descrição, tipo e categoria
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="titulo" className="block mb-3">
                    Título <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Ex: Resumo de Cálculo I"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao" className="block mb-3">Descrição</Label>
                  <textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Descreva o material..."
                    className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo" className="block mb-3">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => {
                      setFormData({ ...formData, tipo: value });
                      setSubtipoAnotacao("");
                      setSubtipoFlashcard("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anotacao">Anotação</SelectItem>
                      <SelectItem value="arquivo">Arquivo</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="flashcard">Flashcard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoria" className="block mb-3">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apostila">Apostila</SelectItem>
                      <SelectItem value="resumo">Resumo</SelectItem>
                      <SelectItem value="exercicio">Exercício</SelectItem>
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="mapa-mental">Mapa Mental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipo === "anotacao" && (
                <div>
                  <Label htmlFor="subtipo-anotacao" className="block mb-3">Tipo de Anotação</Label>
                  <Select
                    value={subtipoAnotacao}
                    onValueChange={setSubtipoAnotacao}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resumo">Resumo</SelectItem>
                      <SelectItem value="mapa-mental">Mapa Mental</SelectItem>
                      <SelectItem value="esquema">Esquema</SelectItem>
                      <SelectItem value="lista">Lista</SelectItem>
                      <SelectItem value="tabela">Tabela</SelectItem>
                      <SelectItem value="formulas">Fórmulas</SelectItem>
                      <SelectItem value="definicoes">Definições</SelectItem>
                      <SelectItem value="exemplos">Exemplos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.tipo === "flashcard" && (
                <div>
                  <Label htmlFor="subtipo-flashcard" className="block mb-3">Tipo de Flashcard</Label>
                  <Select
                    value={subtipoFlashcard}
                    onValueChange={setSubtipoFlashcard}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pergunta-resposta">
                        Pergunta e Resposta
                      </SelectItem>
                      <SelectItem value="termo-definicao">
                        Termo e Definição
                      </SelectItem>
                      <SelectItem value="formula-aplicacao">
                        Fórmula e Aplicação
                      </SelectItem>
                      <SelectItem value="conceito-exemplo">
                        Conceito e Exemplo
                      </SelectItem>
                      <SelectItem value="data-evento">Data e Evento</SelectItem>
                      <SelectItem value="vocabulario">Vocabulário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            )}

            {addMaterialStep === 2 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle>Visibilidade e compartilhamento</DialogTitle>
                  <DialogDescription>
                    Quem pode ver este material
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="visibilidade" className="block mb-3">
                    Visibilidade <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.visibilidade}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        visibilidade: value,
                        grupo_id: value === "geral" ? "" : formData.grupo_id,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.visibilidade === "privado" && gruposDisponiveis.length > 0 && (
                  <div>
                    <Label htmlFor="grupo" className="block mb-3">
                      Grupo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.grupo_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grupo_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {gruposDisponiveis.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Selecione o grupo privado para compartilhar
                    </p>
                  </div>
                )}
              </div>
            )}

            {addMaterialStep === 3 && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle>Conteúdo do material</DialogTitle>
                  <DialogDescription>
                    Arquivo, link ou URL e tags
                  </DialogDescription>
                </DialogHeader>
              {formData.tipo === "arquivo" && (
                <div>
                  <Label htmlFor="arquivo" className="block mb-3">
                    Arquivo <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={
                        arquivoMetodo === "upload" ? "default" : "outline"
                      }
                      onClick={() => {
                        setArquivoMetodo("upload");
                        setFormData({ ...formData, arquivo_url: "" });
                        setSelectedFile(null);
                      }}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={arquivoMetodo === "url" ? "default" : "outline"}
                      onClick={() => {
                        setArquivoMetodo("url");
                        setSelectedFile(null);
                      }}
                      className="flex-1"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                    </Button>
                  </div>

                  {arquivoMetodo === "upload" ? (
                    <>
                      <label
                        htmlFor="arquivo"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para fazer upload</span> ou arraste o arquivo aqui
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, CSV, JPG, PNG (máx. 10MB)
                          </p>
                        </div>
                        <Input
                          id="arquivo"
                          type="file"
                          onChange={handleFileSelect}
                          accept=".pdf,.csv,.jpg,.jpeg,.png"
                          className="hidden"
                        />
                      </label>
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Arquivo selecionado: {selectedFile.name} (
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </>
                  ) : (
                    <Input
                      value={formData.arquivo_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          arquivo_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      type="url"
                    />
                  )}
                </div>
              )}

              {formData.tipo === "link" && (
                <div>
                  <Label htmlFor="url" className="block mb-3">
                    URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.arquivo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, arquivo_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="tags" className="block mb-3">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Ex: cálculo, matemática, resumo"
                />
              </div>
              </div>
            )}

            <DialogFooter className="flex-row justify-between items-center gap-4 p-4 border-t bg-muted/20 mt-6">
              <div>
                {addMaterialStep > 1 ? (
                  <Button variant="outline" onClick={() => setAddMaterialStep((s) => s - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setFormData({
                        titulo: "",
                        descricao: "",
                        tipo: "arquivo",
                        categoria: "",
                        grupo_id: "",
                        arquivo_url: "",
                        tags: "",
                        visibilidade: "publico",
                      });
                      setSelectedFile(null);
                      setArquivoMetodo("upload");
                      setSubtipoAnotacao("");
                      setSubtipoFlashcard("");
                      setDialogShake(false);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
              <div>
                {addMaterialStep < 3 ? (
                  <Button
                    onClick={() => setAddMaterialStep((s) => s + 1)}
                    disabled={
                      (addMaterialStep === 1 && !formData.titulo.trim()) ||
                      (addMaterialStep === 2 &&
                        formData.visibilidade === "privado" &&
                        !formData.grupo_id)
                    }
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleAddMaterial} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Área de Busca e Filtros Melhorada */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-4">
          {/* Linha de busca */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Buscar por título ou descrição..."
                className="pl-9 h-10"
              />
            </div>
            <Button onClick={handleSearch} className="h-10">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Linha de filtros */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtros</span>
              {(filtroTipo ||
                filtroCategoria ||
                filtroFormato ||
                filtroGrupo ||
                mostrarArquivados) && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  {
                    [
                      filtroTipo,
                      filtroCategoria,
                      filtroFormato,
                      filtroGrupo,
                      mostrarArquivados,
                    ].filter(Boolean).length
                  }{" "}
                  ativo(s)
                </span>
              )}
              {(filtroTipo ||
                filtroCategoria ||
                filtroFormato ||
                filtroGrupo ||
                filtroTags.trim() ||
                ordenar !== "recentes" ||
                mostrarArquivados) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setFiltroTipo("");
                    setFiltroCategoria("");
                    setFiltroFormato("");
                    setFiltroGrupo("");
                    setFiltroTags("");
                    setOrdenar("recentes");
                    setMostrarArquivados(false);
                  }}
                >
                  Limpar todos
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Select
                value={filtroTipo || "all"}
                onValueChange={(value) =>
                  setFiltroTipo(value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className={`h-9 ${
                    filtroTipo ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="anotacao">📝 Anotação</SelectItem>
                  <SelectItem value="arquivo">📁 Arquivo</SelectItem>
                  <SelectItem value="link">🔗 Link</SelectItem>
                  <SelectItem value="flashcard">🃏 Flashcard</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtroCategoria || "all"}
                onValueChange={(value) =>
                  setFiltroCategoria(value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className={`h-9 ${
                    filtroCategoria ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Categoria" />
                  </div>
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="apostila">📚 Apostila</SelectItem>
                  <SelectItem value="resumo">📋 Resumo</SelectItem>
                  <SelectItem value="exercicio">✏️ Exercício</SelectItem>
                  <SelectItem value="prova">📝 Prova</SelectItem>
                  <SelectItem value="mapa-mental">🧠 Mapa Mental</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtroFormato || "all"}
                onValueChange={(value) =>
                  setFiltroFormato(value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className={`h-9 ${
                    filtroFormato ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Formato" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formatos</SelectItem>
                  <SelectItem value="pdf">📄 PDF</SelectItem>
                  <SelectItem value="image">🖼️ Imagem</SelectItem>
                  <SelectItem value="doc">📃 Documento</SelectItem>
                  <SelectItem value="csv">📊 CSV/Planilha</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtroGrupo || "all"}
                onValueChange={(value) =>
                  setFiltroGrupo(value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className={`h-9 ${
                    filtroGrupo ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Grupo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ordenar}
                onValueChange={setOrdenar}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="visualizacoes">Visualizações</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="curtidas">Curtidas</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showBuscaAvancada ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setShowBuscaAvancada(!showBuscaAvancada)}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Busca avançada
              </Button>

              <Button
                variant={mostrarArquivados ? "default" : "outline"}
                size="sm"
                className={`h-9 ${mostrarArquivados ? "" : "border-dashed"}`}
                onClick={() => setMostrarArquivados(!mostrarArquivados)}
              >
                {mostrarArquivados ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Ocultar Arquivados
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5 mr-1.5" />
                    Ver Arquivados
                  </>
                )}
              </Button>
            </div>
          </div>

          {showBuscaAvancada && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Filtro por tags (separadas por vírgula)
              </p>
              <Input
                value={filtroTags}
                onChange={(e) => setFiltroTags(e.target.value)}
                placeholder="Ex.: cálculo, álgebra, lista"
                className="max-w-md h-9"
              />
            </div>
          )}

          {/* Tags de filtros ativos */}
          {(filtroTipo || filtroCategoria || filtroFormato || filtroGrupo || filtroTags.trim()) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filtroTipo && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                  Tipo: {filtroTipo}
                  <button
                    onClick={() => setFiltroTipo("")}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filtroCategoria && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                  Categoria: {filtroCategoria}
                  <button
                    onClick={() => setFiltroCategoria("")}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filtroFormato && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                  Formato: {filtroFormato}
                  <button
                    onClick={() => setFiltroFormato("")}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filtroGrupo && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                  Grupo:{" "}
                  {grupos.find((g) => g.id === filtroGrupo)?.nome ||
                    filtroGrupo}
                  <button
                    onClick={() => setFiltroGrupo("")}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filtroTags.trim() && (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                  Tags: {filtroTags}
                  <button
                    onClick={() => setFiltroTags("")}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acesso rápido */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Acesso rápido</h2>
        {loadingQuick ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : quickAccessMaterials.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAccessMaterials.map((m) => {
              const Icon = getMaterialIcon(m.tipo);
              return (
                <Card
                  key={m.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow border"
                  onClick={() => (window.location.href = `/biblioteca/${m.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{m.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAgo(m.created_at)}
                        </p>
                      </div>
                    </div>
                    {(m.grupo?.nome || m.visibilidade === "publico") && (
                      <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum material recente. Adicione um material para ver aqui.
          </p>
        )}
      </section>

      {/* Materiais fixados */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Fixados</h2>
        {loadingPinned && pinnedIds.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-shrink-0 w-[200px] p-4">
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : pinnedMaterials.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pinnedMaterials.map((m) => {
              const Icon = getMaterialIcon(m.tipo);
              return (
                <Card
                  key={m.id}
                  className="flex-shrink-0 w-[200px] p-4 cursor-pointer hover:shadow-md transition-shadow border relative"
                  onClick={() => (window.location.href = `/biblioteca/${m.id}`)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(m.id);
                    }}
                    title="Desfixar"
                  >
                    <PinOff className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAgo(m.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Fixe materiais para acessá-los rapidamente. Use o ícone de alfinete ao ver um material.
          </p>
        )}
      </section>

      {/* Editados recentemente (tabela) */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Editados recentemente</h2>
        {loadingQuick ? (
          <Card>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : recentTableMaterials.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Material</th>
                    <th className="text-left py-3 px-4 font-medium">Atividade</th>
                    <th className="text-left py-3 px-4 font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium">Última modificação</th>
                    <th className="text-left py-3 px-4 font-medium">Compartilhado com</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTableMaterials.map((m) => {
                    const Icon = getMaterialIcon(m.tipo);
                    const nomeUsuario =
                      m.usuario?.raw_user_meta_data?.nome ||
                      m.usuario?.raw_user_meta_data?.email ||
                      "—";
                    const iniciais = nomeUsuario.slice(0, 2).toUpperCase();
                    return (
                      <tr
                        key={m.id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => (window.location.href = `/biblioteca/${m.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10 flex-shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium truncate max-w-[180px]">{m.titulo}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {m.grupo_id ? "Compartilhado" : "Pessoal"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{iniciais}</AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{nomeUsuario}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatAgo(m.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          {m.grupo ? (
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {m.grupo.nome}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum material recente.
          </p>
        )}
      </section>

      <div className="border-t pt-6 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Todos os materiais</h2>
      </div>
      {loadingInfinite && materiaisFiltrados.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Library className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando materiais...</p>
          </div>
        </div>
      ) : materiaisFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-4">
            <EmptyState
              icon={Library}
              title="Nenhum material encontrado"
              description="Tente buscar com outros termos, ajustar os filtros ou adicione o primeiro material ao grupo."
              action={{
                label: "Adicionar material",
                onClick: () => setShowAddDialog(true),
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
        {totalMateriais > 0 && (
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, totalMateriais)} de {totalMateriais}{" "}
            {totalMateriais === 1 ? "material" : "materiais"}
          </p>
        )}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {materiaisFiltrados.map((material) => (
              <div key={material.id} className="flex min-h-[380px]">
                <Card
                  className={`flex flex-col h-full w-full min-h-[380px] hover:shadow-md transition-shadow cursor-pointer ${
                    material.ativo === false ? "opacity-60" : ""
                  }`}
                  onClick={() => {
                    window.location.href = `/biblioteca/${material.id}`;
                  }}
                >
                  <CardHeader className="flex-shrink-0 space-y-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg line-clamp-2">
                            {material.titulo}
                          </CardTitle>
                          {material.ativo === false && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex-shrink-0">
                              Arquivado
                            </span>
                          )}
                        </div>
                        <CardDescription className="mt-1 line-clamp-2 min-h-[2.5rem]">
                          {material.descricao || "\u00A0"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${
                                  pinnedIds.includes(material.id)
                                    ? "text-primary hover:bg-primary/10"
                                    : "text-muted-foreground hover:text-primary"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(material.id);
                                  if (!pinnedIds.includes(material.id)) {
                                    toast.success("Material fixado");
                                  } else {
                                    toast.success("Material desfixado");
                                  }
                                }}
                              >
                                <Pin className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {pinnedIds.includes(material.id)
                                  ? "Desfixar material"
                                  : "Fixar material"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {material.user_id === currentUserId && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${
                                    material.ativo === false
                                      ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                      : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAtivo(
                                      material.id,
                                      material.titulo,
                                      material.ativo !== false
                                    );
                                  }}
                                >
                                  {material.ativo === false ? (
                                    <ArchiveRestore className="h-4 w-4" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {material.ativo !== false
                                    ? "Arquivar material"
                                    : "Ativar material"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {material.tipo === "arquivo" && (
                            <FileText className="h-3 w-3" />
                          )}
                          {material.tipo === "link" && (
                            <LinkIcon className="h-3 w-3" />
                          )}
                          {material.tipo === "anotacao" && (
                            <FileText className="h-3 w-3" />
                          )}
                          {material.tipo === "flashcard" && (
                            <FileText className="h-3 w-3" />
                          )}
                          <span className="capitalize">{material.tipo}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-0">
                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{material.visualizacoes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{material.downloads || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{material.curtidas || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm flex-shrink-0">
                        {material.usuario ? (
                          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {material.usuario.raw_user_meta_data?.nome ||
                                material.usuario.raw_user_meta_data?.email ||
                                "Usuário"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {material.grupo && (
                          <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                            <Users className="h-3 w-3" />
                            <span className="text-xs truncate max-w-[100px]">
                              {material.grupo.nome}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 min-h-[1.75rem] overflow-hidden">
                        {material.tags && material.tags.length > 0 ? (
                          <>
                            {material.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                            {material.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{material.tags.length - 3}
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                      <div className="flex gap-2 pt-2 mt-auto flex-shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/biblioteca/${material.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        {material.arquivo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(material);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          {totalPages > 1 && (
            <div className="col-span-full flex items-center justify-center gap-4 py-6 border-t mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loadingInfinite}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground min-w-[140px] text-center">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loadingInfinite}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
        </>
      )}

      {/* Dialog de confirmação para arquivar */}
      <Dialog
        open={!!materialToArchive}
        onOpenChange={(open) => !open && setMaterialToArchive(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              Arquivar Material
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar o material{" "}
              <span className="font-semibold text-foreground">
                {materialToArchive?.titulo}
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
                <li>O material não aparecerá na lista principal</li>
                <li>Você poderá reativá-lo a qualquer momento</li>
                <li>Os dados e visualizações serão mantidos</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaterialToArchive(null)}
            >
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
