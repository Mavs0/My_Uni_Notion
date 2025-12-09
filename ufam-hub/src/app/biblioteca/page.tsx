"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
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
  curtidas: number;
  tags?: string[];
  created_at: string;
  grupo?: {
    id: string;
    nome: string;
  };
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

  useEffect(() => {
    if (grupoIdFromUrl && !filtroGrupo) {
      setFiltroGrupo(grupoIdFromUrl);
    }
    loadGrupos();
  }, [grupoIdFromUrl]);

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
  const {
    items: materiaisInfinite,
    loading: loadingInfinite,
    hasMore,
    lastElementRef,
    reset: resetMateriais,
  } = useInfiniteScroll<Material>({
    fetchFn: async (offset, limit) => {
      const params = new URLSearchParams();
      if (search) params.append("busca", search);
      if (filtroTipo && filtroTipo !== "all") params.append("tipo", filtroTipo);
      if (filtroCategoria && filtroCategoria !== "all")
        params.append("categoria", filtroCategoria);
      if (filtroGrupo && filtroGrupo !== "none")
        params.append("grupo_id", filtroGrupo);
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const response = await fetch(
        `/api/colaboracao/biblioteca?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar materiais");
      }
      const data = await response.json();
      return {
        data: data.materiais || [],
        hasMore: data.hasMore || false,
        total: data.total,
      };
    },
    limit: 20,
    enabled: true,
    dependencies: [search, filtroTipo, filtroCategoria, filtroGrupo],
  });

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
        await loadMateriais();
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
    loadMateriais();
  };

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

  const filteredMateriais = materiais;
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Materiais</h1>
          <p className="text-muted-foreground mt-1">
            Explore e compartilhe materiais de estudo
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Material à Biblioteca</DialogTitle>
              <DialogDescription>
                Compartilhe materiais de estudo com a comunidade
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">
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

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
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

              <div className="space-y-2">
                <Label htmlFor="visibilidade">
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

              {formData.visibilidade !== "geral" &&
                gruposDisponiveis.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="grupo">
                      Grupo{" "}
                      {formData.visibilidade === "privado" && (
                        <span className="text-red-500">*</span>
                      )}
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
                        {formData.visibilidade === "publico" && (
                          <SelectItem value="none">
                            Nenhum (público geral)
                          </SelectItem>
                        )}
                        {gruposDisponiveis.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {grupo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.visibilidade === "privado"
                        ? "Selecione o grupo privado para compartilhar"
                        : "Se selecionado, o material será compartilhado apenas com o grupo"}
                    </p>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">
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

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipo === "anotacao" && (
                <div className="space-y-2">
                  <Label htmlFor="subtipo-anotacao">Tipo de Anotação</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="subtipo-flashcard">Tipo de Flashcard</Label>
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

              {formData.tipo === "arquivo" && (
                <div className="space-y-2">
                  <Label htmlFor="arquivo">Arquivo</Label>
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
                      <Input
                        id="arquivo"
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.csv,.jpg,.jpeg,.png"
                        className="flex-1"
                      />
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
                <div className="space-y-2">
                  <Label htmlFor="url">
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

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Ex: cálculo, matemática, resumo"
                />
              </div>

              <DialogFooter>
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
                  }}
                >
                  Cancelar
                </Button>
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
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar materiais..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filtroTipo || "all"}
            onValueChange={(value) =>
              setFiltroTipo(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="anotacao">Anotação</SelectItem>
              <SelectItem value="arquivo">Arquivo</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="flashcard">Flashcard</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filtroCategoria || "all"}
            onValueChange={(value) =>
              setFiltroCategoria(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="apostila">Apostila</SelectItem>
              <SelectItem value="resumo">Resumo</SelectItem>
              <SelectItem value="exercicio">Exercício</SelectItem>
              <SelectItem value="prova">Prova</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filtroGrupo || "all"}
            onValueChange={(value) =>
              setFiltroGrupo(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os grupos" />
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
        </div>
      </div>
      {loadingInfinite && materiaisInfinite.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Library className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando materiais...</p>
          </div>
        </div>
      ) : filteredMateriais.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {materiais.length === 0
                ? "Nenhum material ainda"
                : "Nenhum material encontrado"}
            </h3>
            <p className="text-muted-foreground">
              {materiais.length === 0
                ? "A biblioteca está vazia. Compartilhe materiais para começar!"
                : "Tente buscar com outros termos ou ajustar os filtros"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMateriais.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                window.location.href = `/biblioteca/${material.id}`;
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{material.titulo}</CardTitle>
                    {material.descricao && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {material.descricao}
                      </CardDescription>
                    )}
                  </div>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <div className="flex items-center justify-between text-sm">
                    {material.usuario && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>
                          {material.usuario.raw_user_meta_data?.nome ||
                            material.usuario.raw_user_meta_data?.email ||
                            "Usuário"}
                        </span>
                      </div>
                    )}
                    {material.grupo && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">{material.grupo.nome}</span>
                      </div>
                    )}
                  </div>
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
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
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
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
          ))}
        </div>
      )}
    </main>
  );
}
