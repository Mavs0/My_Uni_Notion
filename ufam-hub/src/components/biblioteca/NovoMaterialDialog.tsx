"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Library,
  Plus,
  Upload,
  Link as LinkIcon,
  Loader2,
  Bold,
  Italic,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type BibliotecaGrupo = {
  id: string;
  nome: string;
  visibilidade: string;
};

type NovaMaterialTab = "basico" | "compartilhar" | "conteudo";

function labelTipoMaterial(t: string) {
  const m: Record<string, string> = {
    anotacao: "Anotação",
    arquivo: "Arquivo",
    link: "Link",
  };
  return m[t] || t;
}

function labelCategoriaBiblioteca(v: string) {
  const m: Record<string, string> = {
    apostila: "Apostila",
    resumo: "Resumo",
    exercicio: "Exercício",
    prova: "Prova",
    "mapa-mental": "Mapa mental",
    lista: "Lista",
  };
  return m[v] || v;
}

function FormFieldRow({
  label,
  hint,
  required,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-dotted border-border/80 py-5 last:border-b-0 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start sm:gap-x-10">
      <div className="space-y-2 pt-1">
        <div className="text-base font-medium leading-snug text-foreground">
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </div>
        {hint ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-3.5 text-base font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:px-5";

export type NovoMaterialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gruposPublicos: BibliotecaGrupo[];
  gruposPrivados: BibliotecaGrupo[];
  onMaterialCreated: () => void;
};

export function NovoMaterialDialog({
  open,
  onOpenChange,
  gruposPublicos,
  gruposPrivados,
  onMaterialCreated,
}: NovoMaterialDialogProps) {
  const [tab, setTab] = useState<NovaMaterialTab>("basico");
  const [dialogShake, setDialogShake] = useState(false);
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
    "upload",
  );
  const gruposDisponiveis =
    formData.visibilidade === "privado"
      ? gruposPrivados
      : formData.visibilidade === "publico"
        ? gruposPublicos
        : [];

  const coverPreviewUrl = useMemo(() => {
    if (selectedFile?.type.startsWith("image/")) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const resetForm = useCallback(() => {
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
    setTab("basico");
    setDialogShake(false);
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo de 10MB.");
        return;
      }
      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, arquivo_url: file.name }));
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
      }
      const errorData = await response.json().catch(() => ({}));
      toast.error(
        errorData.details ||
          errorData.error ||
          "Erro ao fazer upload do arquivo",
      );
      return null;
    } catch {
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      setTab("basico");
      return;
    }
    if (formData.tipo === "anotacao" && !formData.categoria.trim()) {
      toast.error("Escolhe a categoria da anotação");
      setTab("basico");
      return;
    }
    if (formData.tipo === "arquivo" && !formData.categoria.trim()) {
      toast.error("Escolhe a categoria do arquivo");
      setTab("basico");
      return;
    }
    if (formData.tipo === "link" && !formData.arquivo_url.trim()) {
      toast.error("Indica o endereço URL do link");
      setTab("basico");
      return;
    }
    if (formData.visibilidade === "privado" && !formData.grupo_id) {
      toast.error("Grupo é obrigatório para materiais privados");
      setTab("compartilhar");
      return;
    }
    if (formData.tipo === "arquivo") {
      if (arquivoMetodo === "upload" && !selectedFile) {
        toast.error("Arquivo é obrigatório");
        setTab("conteudo");
        return;
      }
      if (arquivoMetodo === "url" && !formData.arquivo_url.trim()) {
        toast.error("URL é obrigatória");
        setTab("conteudo");
        return;
      }
    }
    try {
      setUploading(true);
      let arquivoUrl = formData.arquivo_url;
      let arquivoTipo = "";
      let arquivoTamanho = 0;

      if (selectedFile && formData.tipo === "arquivo") {
        const uploadedUrl = await handleUploadFile();
        if (!uploadedUrl) return;
        arquivoUrl = uploadedUrl;
        arquivoTipo = selectedFile.type;
        arquivoTamanho = selectedFile.size;
      } else if (formData.tipo === "link") {
        arquivoUrl = formData.arquivo_url;
        arquivoTipo = "link";
      }

      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

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
          categoria:
            formData.tipo === "link"
              ? null
              : formData.categoria.trim() || null,
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
        onOpenChange(false);
        resetForm();
        onMaterialCreated();
      } else {
        toast.error(data.error || "Erro ao adicionar material");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao adicionar material");
    } finally {
      setUploading(false);
    }
  };

  const wrapDesc = (before: string, after: string) => {
    const ta = document.getElementById(
      "bib-nova-desc",
    ) as HTMLTextAreaElement | null;
    if (!ta) return;
    const { selectionStart, selectionEnd, value } = ta;
    const sel = value.slice(selectionStart, selectionEnd);
    const next =
      value.slice(0, selectionStart) +
      before +
      sel +
      after +
      value.slice(selectionEnd);
    setFormData((prev) => ({ ...prev, descricao: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const start = selectionStart + before.length;
      const end = start + sel.length;
      ta.setSelectionRange(start, end);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "font-sans max-h-[min(82vh,820px)] w-[min(100vw-1.5rem,1200px)] max-w-[min(100vw-1.5rem,1200px)] gap-0 overflow-hidden border-border/80 p-0 text-base shadow-2xl sm:max-w-[min(100vw-2rem,1200px)] sm:rounded-2xl",
          dialogShake && "animate-[shake_0.5s_ease-in-out]",
        )}
        onInteractOutside={(e) => {
          e.preventDefault();
          setDialogShake(true);
          setTimeout(() => setDialogShake(false), 500);
        }}
      >
        <div className="flex max-h-[min(82vh,820px)] flex-col">
          <div className="shrink-0 border-b border-border/60 bg-muted/25 px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-[4.75rem] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background shadow-md ring-1 ring-black/5 dark:ring-white/10 sm:h-32 sm:w-24">
                {coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreviewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-muted to-muted/40 text-muted-foreground">
                    <Library className="h-8 w-8 opacity-40" />
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-70">
                      Capa
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="sr-only">
                  Novo material na biblioteca
                </DialogTitle>
                <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl sm:leading-tight">
                  {formData.titulo.trim() || "Novo material"}
                </p>
                <DialogDescription asChild>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    <span className="text-foreground/90">
                      {labelTipoMaterial(formData.tipo)}
                    </span>
                    {formData.tipo !== "link" && formData.categoria ? (
                      <>
                        <span className="mx-1.5 text-border">|</span>
                        {labelCategoriaBiblioteca(formData.categoria)}
                      </>
                    ) : null}
                  </p>
                </DialogDescription>
              </div>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as NovaMaterialTab)}
            className="flex min-h-0 flex-1 flex-col border-b border-border/60 bg-muted/10"
          >
            <div className="shrink-0 border-b border-border/50 bg-muted/20 px-5 sm:px-8">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-x-1 gap-y-0 rounded-none border-0 bg-transparent px-0 py-1.5">
                <TabsTrigger value="basico" className={tabTriggerClass}>
                  1 · Informação
                </TabsTrigger>
                <TabsTrigger value="compartilhar" className={tabTriggerClass}>
                  2 · Partilha
                </TabsTrigger>
                <TabsTrigger value="conteudo" className={tabTriggerClass}>
                  3 · Ficheiros / etiquetas
                </TabsTrigger>
              </TabsList>
              <p className="pb-2 text-xs text-muted-foreground">
                Usa os três separadores: dados do material, quem pode ver, e
                ficheiro ou etiquetas (conforme o tipo).
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-10">
              <TabsContent
                value="basico"
                className="m-0 mt-2 space-y-0 focus-visible:outline-none data-[state=inactive]:hidden"
              >
                <FormFieldRow
                  label="Título"
                  hint="Nome que aparece na biblioteca e na página do material."
                  required
                >
                  <Input
                    id="bib-nova-titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, titulo: e.target.value }))
                    }
                    placeholder="Ex.: Resumo de Cálculo I"
                    className="h-12 rounded-xl border-border/80 bg-background text-base"
                  />
                </FormFieldRow>

                <FormFieldRow
                  label="Tipo"
                  hint="Anotação ou ficheiro na biblioteca, ou um link externo. Flashcards têm área própria na app."
                  required
                >
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => {
                      setFormData((p) => {
                        const next = { ...p, tipo: value, categoria: "" };
                        if (value === "link" || value === "anotacao") {
                          next.arquivo_url = "";
                        } else if (
                          value === "arquivo" &&
                          (p.tipo === "link" || p.tipo === "anotacao")
                        ) {
                          next.arquivo_url = "";
                        }
                        return next;
                      });
                      if (value !== "arquivo") setSelectedFile(null);
                      setArquivoMetodo("upload");
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border/80 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anotacao">Anotação</SelectItem>
                      <SelectItem value="arquivo">Arquivo</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldRow>

                {formData.tipo === "anotacao" && (
                  <FormFieldRow
                    label="Categoria da anotação"
                    hint="Classifica a anotação para filtros e pesquisas."
                    required
                  >
                    <Select
                      value={formData.categoria || "none"}
                      onValueChange={(value) =>
                        setFormData((p) => ({
                          ...p,
                          categoria: value === "none" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-border/80 text-base">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Selecionar —</SelectItem>
                        <SelectItem value="resumo">Resumo</SelectItem>
                        <SelectItem value="mapa-mental">Mapa mental</SelectItem>
                        <SelectItem value="lista">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldRow>
                )}

                {formData.tipo === "arquivo" && (
                  <FormFieldRow
                    label="Categoria do arquivo"
                    hint="Tipo de documento que estás a partilhar."
                    required
                  >
                    <Select
                      value={formData.categoria || "none"}
                      onValueChange={(value) =>
                        setFormData((p) => ({
                          ...p,
                          categoria: value === "none" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 rounded-xl border-border/80 text-base">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Selecionar —</SelectItem>
                        <SelectItem value="apostila">Apostila</SelectItem>
                        <SelectItem value="resumo">Resumo</SelectItem>
                        <SelectItem value="exercicio">Exercício</SelectItem>
                        <SelectItem value="mapa-mental">Mapa mental</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldRow>
                )}

                {formData.tipo === "link" && (
                  <FormFieldRow
                    label="Endereço URL"
                    hint="Página, vídeo, artigo ou repositório. Não há categoria para links."
                    required
                  >
                    <Input
                      id="bib-nova-link-url"
                      type="url"
                      value={formData.arquivo_url}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          arquivo_url: e.target.value,
                        }))
                      }
                      placeholder="https://…"
                      className="h-12 rounded-xl border-border/80 bg-background text-base"
                    />
                  </FormFieldRow>
                )}

                <FormFieldRow
                  label="Descrição"
                  hint="Aparece no perfil do material. Usa as ferramentas para realçar texto (markdown simples)."
                >
                  <div className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm">
                    <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/30 px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        onClick={() => wrapDesc("**", "**")}
                        aria-label="Negrito"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        onClick={() => wrapDesc("*", "*")}
                        aria-label="Itálico"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        onClick={() => {
                          const ta = document.getElementById(
                            "bib-nova-desc",
                          ) as HTMLTextAreaElement | null;
                          if (!ta) return;
                          const line = "\n- ";
                          const v = formData.descricao;
                          const pos = ta.selectionStart;
                          setFormData((prev) => ({
                            ...prev,
                            descricao: v.slice(0, pos) + line + v.slice(pos),
                          }));
                        }}
                        aria-label="Lista"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                        Markdown leve
                      </span>
                    </div>
                    <Textarea
                      id="bib-nova-desc"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          descricao: e.target.value,
                        }))
                      }
                      placeholder="Descreve o conteúdo, público-alvo ou como usar este material…"
                      className="min-h-[160px] resize-y rounded-none border-0 text-base leading-relaxed focus-visible:ring-0"
                    />
                  </div>
                </FormFieldRow>
              </TabsContent>

              <TabsContent
                value="compartilhar"
                className="m-0 mt-2 space-y-0 focus-visible:outline-none data-[state=inactive]:hidden"
              >
                <FormFieldRow
                  label="Visibilidade"
                  hint="Controla quem pode ver e aceder ao material."
                  required
                >
                  <Select
                    value={formData.visibilidade}
                    onValueChange={(value) => {
                      setFormData((p) => ({
                        ...p,
                        visibilidade: value,
                        grupo_id: value === "geral" ? "" : p.grupo_id,
                      }));
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border/80 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="privado">Privado (grupo)</SelectItem>
                      <SelectItem value="geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldRow>

                {formData.visibilidade === "privado" &&
                  gruposDisponiveis.length > 0 && (
                    <FormFieldRow
                      label="Grupo"
                      hint="O material fica visível apenas para membros deste grupo."
                      required
                    >
                      <Select
                        value={formData.grupo_id || "none"}
                        onValueChange={(value) =>
                          setFormData((p) => ({
                            ...p,
                            grupo_id: value === "none" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-border/80 text-base">
                          <SelectValue placeholder="Escolher grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Selecionar —</SelectItem>
                          {gruposDisponiveis.map((grupo) => (
                            <SelectItem key={grupo.id} value={grupo.id}>
                              {grupo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormFieldRow>
                  )}
              </TabsContent>

              <TabsContent
                value="conteudo"
                className="m-0 mt-2 space-y-0 focus-visible:outline-none data-[state=inactive]:hidden"
              >
                {formData.tipo === "arquivo" && (
                  <FormFieldRow
                    label="Ficheiro ou URL"
                    hint="JPEG, PNG, WebP, PDF ou CSV. Máx. 10 MB no envio direto."
                    required
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          arquivoMetodo === "upload" ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setArquivoMetodo("upload");
                          setFormData((p) => ({ ...p, arquivo_url: "" }));
                          setSelectedFile(null);
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar ficheiro
                      </Button>
                      <Button
                        type="button"
                        variant={
                          arquivoMetodo === "url" ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setArquivoMetodo("url");
                          setSelectedFile(null);
                        }}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        URL do ficheiro
                      </Button>
                    </div>

                    {arquivoMetodo === "upload" ? (
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="relative w-full max-w-[200px] overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm">
                          {coverPreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverPreviewUrl}
                              alt="Pré-visualização"
                              className="aspect-[3/4] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                              <Upload className="h-10 w-10 opacity-40" />
                              <span className="text-xs">Pré-visualização</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <input
                            id="bib-nova-file"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.csv,.jpg,.jpeg,.png,.webp"
                            onChange={handleFileSelect}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() =>
                              document.getElementById("bib-nova-file")?.click()
                            }
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {selectedFile ? "Substituir" : "Escolher ficheiro"}
                          </Button>
                          {selectedFile ? (
                            <p className="text-sm text-muted-foreground">
                              {selectedFile.name} ·{" "}
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Arrasta para a área da capa ou usa &quot;Escolher
                              ficheiro&quot;.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Input
                        className="mt-3 h-12 rounded-xl border-border/80 text-base"
                        value={formData.arquivo_url}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            arquivo_url: e.target.value,
                          }))
                        }
                        placeholder="https://…"
                        type="url"
                      />
                    )}
                  </FormFieldRow>
                )}

                {formData.tipo === "link" && (
                  <FormFieldRow
                    label="Link"
                    hint="O endereço foi definido em «Informação». Aqui podes só acrescentar etiquetas."
                  >
                    <p className="rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                      URL:{" "}
                      <span className="break-all text-foreground">
                        {formData.arquivo_url.trim() || "—"}
                      </span>
                    </p>
                  </FormFieldRow>
                )}

                {formData.tipo === "anotacao" && (
                  <FormFieldRow
                    label="Conteúdo"
                    hint="Completa o texto da anotação na página do material depois de criar."
                  >
                    <p className="text-sm text-muted-foreground">
                      Não é preciso ficheiro neste passo. Cria o registo e edita a
                      anotação a seguir.
                    </p>
                  </FormFieldRow>
                )}

                <FormFieldRow
                  label="Etiquetas"
                  hint="Separadas por vírgula. Ex.: cálculo, p1, exame"
                >
                  <Input
                    id="bib-nova-tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tags: e.target.value }))
                    }
                    placeholder="cálculo, matemática, resumo"
                    className="h-12 rounded-xl border-border/80 text-base"
                  />
                </FormFieldRow>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="shrink-0 flex-row items-center justify-between gap-4 border-t border-border/60 bg-muted/15 px-6 py-5 sm:px-10">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-xl text-base"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="lg"
              className="rounded-xl px-8 font-semibold text-base"
              onClick={handleAddMaterial}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />A adicionar…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar à biblioteca
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
