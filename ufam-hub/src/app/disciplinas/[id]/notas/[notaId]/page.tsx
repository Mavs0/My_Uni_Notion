"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Share2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Loader2,
  MoreHorizontal,
  Check,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Nota = {
  id: string;
  disciplinaId: string;
  titulo: string;
  content_md: string;
  created_at?: string;
  updated_at?: string;
};

// Helpers que atualizam o state; a seleção é restaurada via ref após re-render

function formatEditedAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Editado há ${diffMin} min`;
  if (diffH < 24) return `Editado há ${diffH}h`;
  if (diffD < 7) return `Editado há ${diffD} dia${diffD > 1 ? "s" : ""}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Conteúdo para preview: trata "1 - item" como lista numerada (1. item) para o Markdown renderizar */
function contentForPreview(raw: string): string {
  return raw.replace(/^(\s*)(\d+)\s*-\s+/gm, "$1$2. ");
}

export default function NotaPage() {
  const params = useParams();
  const router = useRouter();
  const disciplinaId = params.id as string;
  const notaId = params.notaId as string;
  const isNova = notaId === "nova";

  const [nota, setNota] = useState<Nota | null>(null);
  const [titulo, setTitulo] = useState("");
  const [content_md, setContent_md] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const wrapSelection = useCallback(
    (prefix: string, suffix: string = prefix) => {
      const ta = editorRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const text = content_md;
      const selected = text.slice(start, end);
      const newText =
        text.slice(0, start) + prefix + selected + suffix + text.slice(end);
      setContent_md(newText);
      pendingSelectionRef.current = {
        start: start + prefix.length,
        end: end + prefix.length,
      };
    },
    [content_md]
  );

  const insertAtCursor = useCallback(
    (before: string, after: string = "") => {
      const ta = editorRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const text = content_md;
      const newText = text.slice(0, start) + before + after + text.slice(start);
      setContent_md(newText);
      const pos = start + before.length;
      pendingSelectionRef.current = { start: pos, end: pos };
    },
    [content_md]
  );

  useEffect(() => {
    if (pendingSelectionRef.current && editorRef.current) {
      const { start, end } = pendingSelectionRef.current;
      editorRef.current.selectionStart = start;
      editorRef.current.selectionEnd = end;
      editorRef.current.focus();
      pendingSelectionRef.current = null;
    }
  }, [content_md]);

  const loadNota = useCallback(async () => {
    if (isNova) {
      setTitulo("");
      setContent_md("");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/notas/${notaId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Nota não encontrada");
          router.push(`/disciplinas/${disciplinaId}`);
          return;
        }
        throw new Error("Erro ao carregar nota");
      }
      const { nota: data } = await res.json();
      setNota(data);
      setTitulo(data.titulo);
      setContent_md(data.content_md ?? "");
    } catch (e) {
      toast.error("Erro ao carregar a nota");
      router.push(`/disciplinas/${disciplinaId}`);
    } finally {
      setLoading(false);
    }
  }, [notaId, isNova, disciplinaId, router]);

  useEffect(() => {
    loadNota();
  }, [loadNota]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (isNova) {
        const res = await fetch("/api/notas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplina_id: disciplinaId,
            titulo: titulo.trim(),
            content_md: content_md,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao criar nota");
        }
        const { nota: created } = await res.json();
        toast.success("Nota criada!");
        router.replace(
          `/disciplinas/${disciplinaId}/notas/${created.id}`
        );
        return;
      }
      const res = await fetch(`/api/notas/${notaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          content_md: content_md,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      setNota((prev) =>
        prev
          ? { ...prev, titulo: titulo.trim(), content_md, updated_at: new Date().toISOString() }
          : null
      );
      toast.success("Salvo");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNova) {
      router.push(`/disciplinas/${disciplinaId}`);
      return;
    }
    if (!confirm("Excluir esta anotação? Esta ação não pode ser desfeita."))
      return;
    try {
      const res = await fetch(`/api/notas/${notaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Nota excluída");
      router.push(`/disciplinas/${disciplinaId}`);
    } catch {
      toast.error("Erro ao excluir nota");
    }
  };

  const handleShare = async () => {
    if (isNova || !nota) {
      toast.error("Salve a nota antes de compartilhar.");
      return;
    }
    setShareError(null);
    try {
      const res = await fetch("/api/colaboracao/compartilhar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota_id: nota.id,
          disciplina_id: disciplinaId,
          titulo: nota.titulo,
          visibilidade: "publico",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || "Erro ao gerar link de compartilhamento";
        setShareError(msg);
        setShareLink(
          typeof window !== "undefined" ? window.location.href : ""
        );
        setShareOpen(true);
        toast.error(msg);
        return;
      }
      setShareLink(data?.link || "");
      setShareOpen(true);
    } catch {
      setShareError("Erro de conexão ao compartilhar.");
      setShareLink(typeof window !== "undefined" ? window.location.href : "");
      setShareOpen(true);
      toast.error("Erro ao compartilhar");
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copiado!");
    }
  };

  const insertImage = (url: string) => {
    if (!url?.trim()) return;
    insertAtCursor("![imagem]", `(${url.trim()})`);
  };

  const handleInsertImageConfirm = async () => {
    if (imageMethod === "url") {
      if (!imageUrl.trim()) {
        toast.error("Informe a URL da imagem.");
        return;
      }
      insertImage(imageUrl.trim());
      setImageUrl("");
      setImageModalOpen(false);
      return;
    }
    if (!imageFile) {
      toast.error("Selecione uma imagem.");
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "uploads");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro no upload");
      }
      const { url } = await res.json();
      if (url) {
        insertImage(url);
        setImageFile(null);
        setImageModalOpen(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetImageModal = () => {
    setImageUrl("");
    setImageFile(null);
    setImageMethod("url");
  };

  const handleInsertLinkConfirm = () => {
    const url = linkUrl.trim();
    const text = linkText.trim() || "link";
    if (!url) {
      toast.error("Informe a URL do link.");
      return;
    }
    insertAtCursor(`[${text}]`, `(${url})`);
    setLinkUrl("");
    setLinkText("");
    setLinkModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar minimalista — estilo Notion */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between gap-4 px-4 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Link href={`/disciplinas/${disciplinaId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {nota?.updated_at && (
            <span className="text-xs text-muted-foreground truncate">
              {formatEditedAgo(nota.updated_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={isNova}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir anotação
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Área de conteúdo — editor e visualização lado a lado */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* Título em linha cheia */}
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Sem título"
          className="w-full text-[2.25rem] font-bold tracking-tight bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 py-1 mb-4"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Coluna esquerda — Editor */}
          <div className="min-w-0">
            <div className="flex items-center gap-0.5 py-2 mb-1">
              <div className="flex items-center rounded-lg border border-border/50 bg-muted/30 px-1 py-1 shadow-sm">
                <ToolBtn onClick={() => wrapSelection("**")} title="Negrito">
                  <Bold className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => wrapSelection("*")} title="Itálico">
                  <Italic className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => insertAtCursor("\n# ", "")} title="Título 1">
                  <Heading1 className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => insertAtCursor("\n## ", "")} title="Título 2">
                  <Heading2 className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => insertAtCursor("\n- ", "")} title="Lista">
                  <List className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => insertAtCursor("\n1. ", "")} title="Lista numerada">
                  <ListOrdered className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  onClick={() => {
                    setLinkText("");
                    setLinkUrl("");
                    setLinkModalOpen(true);
                  }}
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  onClick={() => {
                    resetImageModal();
                    setImageModalOpen(true);
                  }}
                  title="Imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </ToolBtn>
              </div>
            </div>
            <textarea
              ref={editorRef}
              data-nota-editor
              value={content_md}
              onChange={(e) => setContent_md(e.target.value)}
              placeholder="Escreva ou cole aqui… Suporta Markdown: **negrito**, listas, links e imagens."
              className={cn(
                "w-full min-h-[60vh] resize-none bg-transparent border-0 outline-none",
                "text-[1.0625rem] leading-[1.7] text-foreground placeholder:text-muted-foreground/50",
                "focus:ring-0"
              )}
            />
            <p className="mt-4 text-xs text-muted-foreground/60">
              Dica: <kbd className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px]">**texto**</kbd> negrito,{" "}
              <kbd className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px]">[link](url)</kbd> links.
            </p>
          </div>

          {/* Coluna direita — Visualização */}
          <div className="min-w-0 border-l border-border/50 pl-0 lg:pl-6">
            <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider sticky top-14 bg-background/95 py-1">
              Visualização
            </p>
            <div className="min-h-[60vh]">
              {content_md.trim() ? (
                <article
                  className={cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    "prose-headings:font-semibold prose-headings:tracking-tight",
                    "prose-p:leading-[1.7] prose-li:leading-[1.6]",
                    "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                    "prose-img:rounded-lg prose-img:max-w-full prose-img:border prose-img:border-border/50"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt, ...props }) => (
                        <span className="block my-4">
                          <img
                            src={src}
                            alt={alt ?? "Imagem"}
                            className="rounded-lg max-w-full h-auto border border-border/50 shadow-sm"
                            {...props}
                          />
                        </span>
                      ),
                    }}
                  >
                    {contentForPreview(content_md)}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-sm text-muted-foreground/70 italic">
                  A visualização do Markdown aparece aqui ao digitar.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Inserir imagem — upload ou URL */}
      <Dialog
        open={imageModalOpen}
        onOpenChange={(open) => {
          setImageModalOpen(open);
          if (!open) resetImageModal();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-background shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Inserir imagem
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Envie uma imagem do seu dispositivo ou cole o link de uma imagem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-0 border-b border-border/60">
              <button
                type="button"
                onClick={() => setImageMethod("url")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-medium transition-colors",
                  imageMethod === "url"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageMethod("upload")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-medium transition-colors",
                  imageMethod === "upload"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-4 w-4" />
                Do dispositivo
              </button>
            </div>
            {imageMethod === "url" && (
              <div className="space-y-2">
                <label htmlFor="image-url" className="text-sm font-medium">
                  URL da imagem
                </label>
                <Input
                  id="image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="rounded-lg bg-muted/30 border-border/60"
                />
              </div>
            )}
            {imageMethod === "upload" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivo de imagem</label>
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-border/60 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center py-4 px-2">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-medium text-foreground">Clique para enviar</span> ou arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, GIF ou WebP (máx. 5MB)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {imageFile && (
                  <p className="text-sm text-muted-foreground">
                    Selecionado: {imageFile.name}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImageModalOpen(false);
                resetImageModal();
              }}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInsertImageConfirm}
              disabled={
                uploadingImage ||
                (imageMethod === "url" ? !imageUrl.trim() : !imageFile)
              }
              className="rounded-lg"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Inserir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Inserir link — padrão do sistema */}
      <Dialog
        open={linkModalOpen}
        onOpenChange={(open) => {
          setLinkModalOpen(open);
          if (!open) {
            setLinkText("");
            setLinkUrl("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-background shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Inserir link
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informe o texto que aparecerá e a URL de destino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="link-text" className="text-sm font-medium">
                Texto do link
              </label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Ex: Site da disciplina"
                className="rounded-lg bg-muted/30 border-border/60"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="link-url" className="text-sm font-medium">
                URL <span className="text-destructive">*</span>
              </label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
                className="rounded-lg bg-muted/30 border-border/60"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setLinkModalOpen(false)}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInsertLinkConfirm}
              disabled={!linkUrl.trim()}
              className="rounded-lg"
            >
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Compartilhar */}
      <Dialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) setShareError(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-background shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Compartilhar anotação
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {shareError
                ? "O link abaixo é desta página. Quem receber precisa estar logado para ver a nota."
                : "Qualquer pessoa com o link pode ver esta anotação."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {shareError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                {shareError}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareLink}
                className="font-mono text-sm rounded-lg bg-muted/30 border-border/60"
              />
              <Button
                onClick={copyLink}
                className="rounded-lg shrink-0 gap-2"
              >
                <Check className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4">
            <Button variant="outline" onClick={() => setShareOpen(false)} className="rounded-lg">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
    >
      {children}
    </button>
  );
}
