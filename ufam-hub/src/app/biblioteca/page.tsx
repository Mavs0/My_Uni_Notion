"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  ArrowUpRight,
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
import { cn } from "@/lib/utils";

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

function monogramTitulo(titulo: string) {
  const parts = titulo.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return (titulo.trim().slice(0, 2) || "?").toUpperCase();
}

function tipoMaterialVisual(tipo: string) {
  const t = tipo.toLowerCase();
  if (t === "link") {
    return {
      gradient:
        "bg-gradient-to-b from-sky-500/25 to-transparent dark:from-sky-500/20",
      stripe: "bg-sky-500",
      badge:
        "border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    };
  }
  if (t === "arquivo") {
    return {
      gradient:
        "bg-gradient-to-b from-violet-500/25 to-transparent dark:from-violet-500/20",
      stripe: "bg-violet-500",
      badge:
        "border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-300",
    };
  }
  if (t === "anotacao") {
    return {
      gradient:
        "bg-gradient-to-b from-amber-500/25 to-transparent dark:from-amber-500/20",
      stripe: "bg-amber-500",
      badge:
        "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-400",
    };
  }
  if (t === "flashcard") {
    return {
      gradient:
        "bg-gradient-to-b from-emerald-500/25 to-transparent dark:from-emerald-500/20",
      stripe: "bg-emerald-500",
      badge:
        "border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-400",
    };
  }
  if (t === "mapa_mental") {
    return {
      gradient:
        "bg-gradient-to-b from-fuchsia-500/25 to-transparent dark:from-fuchsia-500/20",
      stripe: "bg-fuchsia-500",
      badge:
        "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-900 dark:text-fuchsia-300",
    };
  }
  return {
    gradient:
      "bg-gradient-to-b from-primary/25 to-transparent dark:from-primary/20",
    stripe: "bg-primary",
    badge: "border-primary/35 bg-primary/10 text-primary",
  };
}

function bibliotecaCardPatternBg() {
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
const SECTION_TITLE =
  "text-xs font-semibold uppercase tracking-widest text-muted-foreground";

export default function BibliotecaPage() {
  const router = useRouter();
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

  const goToMaterial = (id: string) => router.push(`/biblioteca/${id}`);

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Biblioteca de materiais
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
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
            <Button className="rounded-full px-5 font-semibold shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar material
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
      {/* Busca e filtros */}
      <section>
        <h2 className={SECTION_TITLE + " mb-3"}>Busca e filtros</h2>
        <Card className="rounded-2xl border border-border/80 shadow-sm">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Buscar por título ou descrição..."
                  className="h-12 rounded-full border-border/80 bg-muted/40 pl-11 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-12 shrink-0 rounded-full px-6"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={SECTION_TITLE}>Filtros</span>
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
      </section>

      {/* Acesso rápido */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Acesso rápido</h2>
        {loadingQuick ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="rounded-2xl border border-border/70 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </Card>
            ))}
          </div>
        ) : quickAccessMaterials.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {quickAccessMaterials.map((m) => {
              const Icon = getMaterialIcon(m.tipo);
              const qv = tipoMaterialVisual(m.tipo);
              return (
                <Card
                  key={m.id}
                  className={cn(
                    "cursor-pointer border border-border/70 bg-card p-4 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200",
                    "rounded-2xl hover:-translate-y-0.5 hover:shadow-lg dark:ring-white/[0.05]",
                  )}
                  onClick={() => goToMaterial(m.id)}
                >
                  <div
                    className={cn("mb-3 h-1 w-12 rounded-full", qv.stripe)}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight">
                          {m.titulo}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatAgo(m.created_at)}
                        </p>
                      </div>
                    </div>
                    {(m.grupo?.nome || m.visibilidade === "publico") && (
                      <Share2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <Library className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhum material recente</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione um material para ver no acesso rápido.</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar material
            </Button>
          </div>
        )}
      </section>

      {/* Materiais fixados */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Fixados</h2>
        {loadingPinned && pinnedIds.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="w-[220px] flex-shrink-0 rounded-2xl border border-border/70 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </Card>
            ))}
          </div>
        ) : pinnedMaterials.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pinnedMaterials.map((m) => {
              const Icon = getMaterialIcon(m.tipo);
              const pv = tipoMaterialVisual(m.tipo);
              return (
                <Card
                  key={m.id}
                  className={cn(
                    "relative w-[220px] flex-shrink-0 cursor-pointer border border-border/70 bg-card p-4 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200",
                    "rounded-2xl hover:-translate-y-0.5 hover:shadow-lg dark:ring-white/[0.05]",
                  )}
                  onClick={() => goToMaterial(m.id)}
                >
                  <div
                    className={cn("mb-2 h-1 w-10 rounded-full", pv.stripe)}
                    aria-hidden
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(m.id);
                    }}
                    title="Desfixar"
                  >
                    <PinOff className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {m.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatAgo(m.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <Pin className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhum material fixado</p>
            <p className="text-xs text-muted-foreground mt-1">Use o ícone de alfinete ao ver um material para fixá-lo aqui.</p>
          </div>
        )}
      </section>

      {/* Editados recentemente (tabela) */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Editados recentemente</h2>
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
          <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
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
                        onClick={() => goToMaterial(m.id)}
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
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhum material recente</p>
            <p className="text-xs text-muted-foreground mt-1">Os materiais que você visualizar ou adicionar aparecerão aqui.</p>
          </div>
        )}
      </section>

      <section className="border-t pt-8 mt-8">
        <h2 className={SECTION_TITLE + " mb-4"}>Todos os materiais</h2>
      {loadingInfinite && materiaisFiltrados.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Library className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando materiais...</p>
          </div>
        </div>
      ) : materiaisFiltrados.length === 0 ? (
        <section className="rounded-3xl border border-border/80 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
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
        </section>
      ) : (
        <>
        {totalMateriais > 0 && (
          <p className="mb-5 text-sm text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, totalMateriais)} de {totalMateriais}{" "}
            {totalMateriais === 1 ? "material" : "materiais"}
          </p>
        )}
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {materiaisFiltrados.map((material) => {
            const tv = tipoMaterialVisual(material.tipo);
            const tipoLabel = material.tipo.replace(/_/g, " ");
            const Mono = monogramTitulo(material.titulo);
            return (
              <div
                key={material.id}
                className="flex h-full min-h-0 min-w-0"
              >
                <article
                  className={cn(
                    "group relative flex min-h-[420px] w-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03] transition-all duration-300 dark:ring-white/[0.05]",
                    "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl",
                    material.ativo === false && "border-dashed opacity-65",
                  )}
                  onClick={() => goToMaterial(material.id)}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-24 opacity-40",
                      tv.gradient,
                    )}
                    aria-hidden
                  />
                  {bibliotecaCardPatternBg()}
                  <div
                    className="pointer-events-none absolute bottom-1 right-2 select-none text-5xl font-black tabular-nums tracking-tighter text-foreground/[0.06] dark:text-foreground/[0.1]"
                    aria-hidden
                  >
                    {Mono}
                  </div>
                  <div
                    className={cn(
                      "relative z-[1] h-1 w-2/5 max-w-[120px] rounded-br-2xl",
                      tv.stripe,
                    )}
                    aria-hidden
                  />

                  <div className="relative z-[1] flex min-h-0 flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {material.ativo === false && (
                            <span className="shrink-0 rounded-full border border-amber-500/35 bg-amber-500/12 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-400">
                              Arquivado
                            </span>
                          )}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                              tv.badge,
                            )}
                          >
                            {material.tipo === "arquivo" && (
                              <FileText className="h-3 w-3 shrink-0" />
                            )}
                            {material.tipo === "link" && (
                              <LinkIcon className="h-3 w-3 shrink-0" />
                            )}
                            {(material.tipo === "anotacao" ||
                              material.tipo === "flashcard") && (
                              <FileText className="h-3 w-3 shrink-0" />
                            )}
                            {!["arquivo", "link", "anotacao", "flashcard"].includes(
                              material.tipo,
                            ) && (
                              <FolderOpen className="h-3 w-3 shrink-0" />
                            )}
                            {tipoLabel}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground">
                          {material.titulo}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {material.descricao?.trim()
                            ? material.descricao
                            : "Sem descrição"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-1">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-9 w-9 rounded-full",
                                  pinnedIds.includes(material.id)
                                    ? "text-primary hover:bg-primary/10"
                                    : "text-muted-foreground hover:text-primary",
                                )}
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
                                  className={cn(
                                    "h-9 w-9 rounded-full",
                                    material.ativo === false
                                      ? "text-emerald-600 hover:bg-emerald-500/10"
                                      : "text-amber-600 hover:bg-amber-500/10",
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAtivo(
                                      material.id,
                                      material.titulo,
                                      material.ativo !== false,
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
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-border/50 bg-muted/25 px-3 py-3 dark:bg-muted/15">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span
                          className="inline-flex items-center gap-1.5"
                          title="Visualizações"
                        >
                          <Eye className="h-4 w-4 shrink-0 opacity-90" />
                          <span className="font-semibold tabular-nums text-foreground">
                            {material.visualizacoes || 0}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5"
                          title="Downloads"
                        >
                          <Download className="h-4 w-4 shrink-0 opacity-90" />
                          <span className="font-semibold tabular-nums text-foreground">
                            {material.downloads || 0}
                          </span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5"
                          title="Curtidas"
                        >
                          <Heart className="h-4 w-4 shrink-0 opacity-90" />
                          <span className="font-semibold tabular-nums text-foreground">
                            {material.curtidas || 0}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      {material.usuario ? (
                        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4 shrink-0 opacity-90" />
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
                        <div className="flex max-w-[140px] items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-xs">
                            {material.grupo.nome}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 flex min-h-[1.75rem] flex-wrap gap-1.5">
                      {material.tags && material.tags.length > 0 ? (
                        <>
                          {material.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs text-foreground/90"
                            >
                              <Tag className="h-3 w-3 opacity-70" />
                              {tag}
                            </span>
                          ))}
                          {material.tags.length > 3 && (
                            <span className="self-center text-xs text-muted-foreground">
                              +{material.tags.length - 3}
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>

                    <div className="mt-auto flex gap-2 border-t border-border/50 bg-muted/10 pt-4 dark:bg-muted/5">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-11 min-w-0 flex-1 rounded-full font-semibold shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToMaterial(material.id);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4 shrink-0" />
                        Ver detalhes
                        <ArrowUpRight className="ml-1 h-4 w-4 shrink-0 opacity-90" />
                      </Button>
                      {material.arquivo_url && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0 rounded-full border-border/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(material);
                          }}
                          aria-label="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="col-span-full mt-2 flex items-center justify-center gap-3 border-t pt-8">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loadingInfinite}
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
                disabled={page >= totalPages || loadingInfinite}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        </>
      )}
      </section>

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
