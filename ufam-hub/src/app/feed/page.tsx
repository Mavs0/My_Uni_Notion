"use client";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Users,
  Globe,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Filter,
  Calendar,
  BookOpen,
  X as XIcon,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDisciplinas } from "@/hooks/useDisciplinasOptimized";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function FeedPage() {
  const [type, setType] = useState<
    "all" | "following" | "public" | "personalized"
  >("personalized");
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tipoAtividade: "",
    disciplinaId: "",
    dataInicio: "",
    dataFim: "",
  });
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { disciplinasAtivas } = useDisciplinas();

  const hasActiveFilters = 
    filters.tipoAtividade || 
    filters.disciplinaId || 
    filters.dataInicio || 
    filters.dataFim;

  const clearFilters = () => {
    setFilters({
      tipoAtividade: "",
      disciplinaId: "",
      dataInicio: "",
      dataFim: "",
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas imagens");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("folder", "feed");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    if (linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
      toast.error("Por favor, insira uma URL válida");
      return;
    }

    try {
      setLoading(true);

      let finalImageUrl = imageUrl;
      if (selectedImage && !imageUrl) {
        finalImageUrl = await handleUploadImage();
        if (selectedImage && !finalImageUrl) {
          toast.error("Erro ao fazer upload da imagem");
          return;
        }
      }

      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          tipo: "post_personalizado",
          visibilidade: "public",
          imagem_url: finalImageUrl || null,
          link_url: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Erro ao publicar";
        const errorDetails = errorData.details ? `: ${errorData.details}` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success("Atividade publicada com sucesso!");
      resetForm();
      setOpen(false);

      window.location.reload();
    } catch (error: any) {
      console.error("Erro ao publicar:", error);
      toast.error(error.message || "Erro ao publicar atividade");
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const resetForm = useCallback(() => {
    setTitulo("");
    setDescricao("");
    setLinkUrl("");
    setStep(1);
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const quickSuggestions = [
    "Completei meu primeiro pomodoro!",
    "Finalizei uma prova difícil",
    "Conquista: terminei todas as tarefas da semana",
    "Reflexão: aprendi algo novo hoje",
    "Conquista desbloqueada",
    "Dica de estudo que funcionou",
  ];

  const applySuggestion = (text: string) => {
    setTitulo(text);
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100/80 dark:bg-black">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-200/80 dark:bg-zinc-800">
                <Activity className="h-6 w-6 text-zinc-700 dark:text-zinc-100" />
              </span>
              Feed de Atividades
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
              Veja o que está acontecendo na comunidade
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  className={cn(
                    "rounded-full border-2 px-5",
                    !hasActiveFilters &&
                      "border-zinc-300 bg-white/80 text-zinc-900 hover:bg-white dark:border-zinc-600 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900",
                  )}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filtros Avançados</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 text-xs"
                      >
                        <XIcon className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tipo-atividade">Tipo de Atividade</Label>
                        {filters.tipoAtividade && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({ ...filters, tipoAtividade: "" })}
                            className="h-6 text-xs"
                          >
                            <XIcon className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                      <Select
                        value={filters.tipoAtividade || undefined}
                        onValueChange={(value) =>
                          setFilters({ ...filters, tipoAtividade: value || "" })
                        }
                      >
                        <SelectTrigger id="tipo-atividade">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="criou_disciplina">Criou Disciplina</SelectItem>
                          <SelectItem value="criou_avaliacao">Criou Avaliação</SelectItem>
                          <SelectItem value="adicionou_nota">Adicionou Nota</SelectItem>
                          <SelectItem value="completou_tarefa">Completou Tarefa</SelectItem>
                          <SelectItem value="conquista_desbloqueada">Conquista</SelectItem>
                          <SelectItem value="post_personalizado">Post Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="disciplina">Disciplina</Label>
                        {filters.disciplinaId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({ ...filters, disciplinaId: "" })}
                            className="h-6 text-xs"
                          >
                            <XIcon className="h-3 w-3 mr-1" />
                            Limpar
                          </Button>
                        )}
                      </div>
                      <Select
                        value={filters.disciplinaId || undefined}
                        onValueChange={(value) =>
                          setFilters({ ...filters, disciplinaId: value || "" })
                        }
                      >
                        <SelectTrigger id="disciplina">
                          <SelectValue placeholder="Todas as disciplinas" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinasAtivas.map((disc) => (
                            <SelectItem key={disc.id} value={disc.id}>
                              {disc.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-inicio">Data Início</Label>
                      <Input
                        id="data-inicio"
                        type="date"
                        value={filters.dataInicio}
                        onChange={(e) =>
                          setFilters({ ...filters, dataInicio: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-fim">Data Fim</Label>
                      <Input
                        id="data-fim"
                        type="date"
                        value={filters.dataFim}
                        onChange={(e) =>
                          setFilters({ ...filters, dataFim: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (!o) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="rounded-full bg-zinc-900 px-5 text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar
                </Button>
              </DialogTrigger>
              <DialogContent
                className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (step === 3 && titulo.trim() && !loading && !uploadingImage) {
                      handlePublish();
                    } else if (step < 3) {
                      setStep((s) => s + 1);
                    }
                  }
                }}
              >
                {/* Stepper */}
                <div className="flex items-center justify-center gap-1 px-6 pt-6 pb-2 border-b">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setStep(s)}
                        className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                          step === s
                            ? "bg-primary text-primary-foreground"
                            : step > s
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                      {s < 3 && (
                        <div className="w-8 h-0.5 bg-muted mx-0.5" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-2 text-center text-xs text-muted-foreground mb-4">
                  {step === 1 && "Conteúdo"}
                  {step === 2 && "Mídia"}
                  {step === 3 && "Prévia"}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] min-h-[320px]">
                  {/* Coluna principal */}
                  <div className="p-6">
                    {step === 1 && (
                      <div className="space-y-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-6 w-6 text-primary" />
                            O que compartilhar?
                          </DialogTitle>
                          <DialogDescription>
                            Compartilhe conquistas, reflexões ou dicas com a comunidade
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-4">
                            Sugestões rápidas
                          </Label>
                          <div className="flex flex-wrap gap-3">
                            {quickSuggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => applySuggestion(s)}
                                className="text-sm px-4 py-2.5 rounded-xl border bg-muted/50 hover:bg-muted hover:border-primary/50 transition-colors text-left"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="titulo" className="block mb-4">Título *</Label>
                            <Input
                              id="titulo"
                              placeholder="O que você quer compartilhar?"
                              value={titulo}
                              onChange={(e) => setTitulo(e.target.value)}
                              maxLength={200}
                              className="h-11"
                            />
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {titulo.length}/200
                              </span>
                              {titulo.length > 180 && (
                                <span className="text-xs text-amber-600">Quase no limite</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="descricao" className="block mb-4">Descrição (opcional)</Label>
                            <Textarea
                              id="descricao"
                              placeholder="Conte mais detalhes, compartilhe o que aprendeu..."
                              value={descricao}
                              onChange={(e) => setDescricao(e.target.value)}
                              maxLength={1000}
                              rows={4}
                              className="resize-none"
                            />
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {descricao.length}/1000
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl">Adicionar mídia</DialogTitle>
                          <DialogDescription>
                            Imagem e link são opcionais
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <Label className="block mb-4">Imagem</Label>
                            {imagePreview ? (
                              <div className="relative rounded-xl overflow-hidden border group">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-36 object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={handleRemoveImage}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                                  isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted/30"
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  id="imagem"
                                  accept="image/*"
                                  onChange={handleImageSelect}
                                  className="hidden"
                                />
                                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {uploadingImage ? "Enviando..." : "Arraste ou clique"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  JPG, PNG • máx. 5MB
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="link" className="block mb-4">Link (opcional)</Label>
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="link"
                                type="url"
                                placeholder="https://..."
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="pl-9 h-11"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl">Prévia da publicação</DialogTitle>
                          <DialogDescription>
                            Revise antes de publicar
                          </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-xl border bg-muted/30 p-4 lg:hidden">
                          <p className="font-medium text-sm">{titulo || "Título da publicação..."}</p>
                          {descricao && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{descricao}</p>
                          )}
                          {imagePreview && (
                            <img src={imagePreview} alt="" className="mt-2 rounded-lg w-full h-24 object-cover" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview lateral (sempre visível no desktop, step 3 no mobile) */}
                  <div className="border-t lg:border-t-0 lg:border-l bg-muted/30 p-6 hidden lg:block">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider block mb-4">
                      Prévia
                    </Label>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Você</p>
                          <p className="text-xs text-muted-foreground">Público</p>
                        </div>
                      </div>
                      {titulo ? (
                        <p className="text-sm font-medium">{titulo}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Título da publicação...</p>
                      )}
                      {descricao && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{descricao}</p>
                      )}
                      {imagePreview && (
                        <img src={imagePreview} alt="" className="mt-3 rounded-lg w-full h-24 object-cover" />
                      )}
                      {linkUrl && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          <span className="truncate">{linkUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/20">
                  <div className="flex gap-2">
                    {step > 1 ? (
                      <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={loading}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOpen(false);
                          resetForm();
                        }}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {step < 3 ? (
                      <Button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!titulo.trim()}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePublish}
                        disabled={loading || uploadingImage || !titulo.trim()}
                      >
                        {loading || uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Publicando...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-zinc-200/80 bg-white/90 p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 md:grid-cols-4">
          <TabsTrigger
            value="personalized"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-zinc-600 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            Personalizado
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-zinc-600 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50"
          >
            <Activity className="h-4 w-4 shrink-0" />
            Todas
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-zinc-600 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50"
          >
            <Users className="h-4 w-4 shrink-0" />
            Seguindo
          </TabsTrigger>
          <TabsTrigger
            value="public"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-zinc-600 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50"
          >
            <Globe className="h-4 w-4 shrink-0" />
            Públicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="mt-6 focus-visible:outline-none">
          <ActivityFeed type="personalized" filters={filters} />
        </TabsContent>
        <TabsContent value="all" className="mt-6 focus-visible:outline-none">
          <ActivityFeed type="all" filters={filters} />
        </TabsContent>
        <TabsContent value="following" className="mt-6 focus-visible:outline-none">
          <ActivityFeed type="following" filters={filters} />
        </TabsContent>
        <TabsContent value="public" className="mt-6 focus-visible:outline-none">
          <ActivityFeed type="public" filters={filters} />
        </TabsContent>
      </Tabs>
      </div>
    </main>
  );
}
