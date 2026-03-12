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
  Underline,
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
  PanelLeftClose,
  PanelRightClose,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
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

/** Extrai sumário (headings) do markdown para a sidebar */
function extrairSumario(md: string): { level: number; text: string }[] {
  const items: { level: number; text: string }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) items.push({ level: m[1].length, text: m[2].trim() });
  }
  return items;
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
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(true);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const headingIdRef = useRef(0);

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

  const sumario = extrairSumario(content_md);
  const getNextHeadingId = () => `heading-${headingIdRef.current++}`;
  headingIdRef.current = 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Topo: linha do documento — espaçoso */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <Link href={`/disciplinas/${disciplinaId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 items-baseline gap-4">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Sem título"
                className="min-w-0 max-w-[320px] bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground sm:max-w-[420px]"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                {saving ? "Salvando…" : nota?.updated_at ? `Salvo · ${formatEditedAgo(nota.updated_at)}` : "Não salvo"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleShare}
              disabled={isNova}
              className="h-9 gap-2 rounded-lg bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <DropdownMenuItem onClick={handleSave} className="rounded-lg">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="rounded-lg text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir anotação
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Toolbar de formatação — ícones bem separados */}
        <div className="flex h-11 items-center gap-1 border-t border-border bg-muted/30 px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={() => setOutlineOpen((o) => !o)}
          >
            {outlineOpen ? <PanelLeftClose className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            <span className="hidden lg:inline">Sumário</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={() => setCommentsOpen((c) => !c)}
          >
            {commentsOpen ? <PanelRightClose className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            <span className="hidden lg:inline">Comentários</span>
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          <div className="flex items-center gap-0.5">
            <ToolBtn onClick={() => insertAtCursor("\n# ", "")} title="Título 1">
              <Heading1 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => insertAtCursor("\n## ", "")} title="Título 2">
              <Heading2 className="h-4 w-4" />
            </ToolBtn>
          </div>
          <div className="mx-2 h-5 w-px bg-border" />
          <ToolBtn onClick={() => wrapSelection("**")} title="Negrito">
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => wrapSelection("*")} title="Itálico">
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => wrapSelection("_", "_")} title="Sublinhado">
            <Underline className="h-4 w-4" />
          </ToolBtn>
          <div className="mx-2 h-5 w-px bg-border" />
          <ToolBtn onClick={() => { setLinkText(""); setLinkUrl(""); setLinkModalOpen(true); }} title="Link">
            <LinkIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => { resetImageModal(); setImageModalOpen(true); }} title="Imagem">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <div className="mx-2 h-5 w-px bg-border" />
          <ToolBtn onClick={() => insertAtCursor("\n- ", "")} title="Lista">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => insertAtCursor("\n1. ", "")} title="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
        </div>
      </header>

      {/* Corpo: três colunas com bastante espaço */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar esquerda — Sumário */}
        {outlineOpen && (
          <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/10">
            <div className="px-5 pt-5 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Sumário
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 pb-6">
              {titulo && (
                <p className="mb-4 truncate text-sm font-semibold text-foreground">{titulo}</p>
              )}
              {sumario.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Use # ou ## no texto para ver o índice aqui.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {sumario.map((item, i) => (
                    <li
                      key={i}
                      className={cn(
                        "cursor-pointer rounded-lg px-3 py-2 hover:bg-muted/60",
                        item.level === 1 && "font-medium text-foreground",
                        item.level >= 2 && "text-muted-foreground"
                      )}
                      style={{ paddingLeft: item.level >= 2 ? `${1 + (item.level - 1) * 0.75}rem` : "0.75rem" }}
                      onClick={() => {
                        const id = `heading-${sumario.indexOf(item)}`;
                        previewRef.current?.querySelector(`[id="${id}"]`)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {item.level === 1 ? <ChevronDown className="mr-2 inline h-4 w-4" /> : <ChevronRight className="mr-2 inline h-4 w-4" />}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          </aside>
        )}

        {/* Centro — Editor e Visualização com respiro */}
        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-8 py-10 lg:px-12">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Sem título"
              className="mb-8 w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
            />
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* Editor */}
              <div className="min-w-0">
                <textarea
                  ref={editorRef}
                  data-nota-editor
                  value={content_md}
                  onChange={(e) => setContent_md(e.target.value)}
                  placeholder="Escreva aqui…"
                  className={cn(
                    "min-h-[55vh] w-full resize-none rounded-lg border-0 bg-transparent py-2 text-[1.0625rem] leading-[1.75] outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                  )}
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  <kbd className="rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs">**texto**</kbd> negrito &nbsp;
                  <kbd className="rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs">[link](url)</kbd> link
                </p>
              </div>
              {/* Visualização */}
              <div ref={previewRef} className="min-w-0 rounded-lg border border-border bg-muted/5 lg:pl-8 lg:border-l-2">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Visualização
                </p>
                {content_md.trim() ? (
                  <article
                    className={cn(
                      "prose prose-sm dark:prose-invert max-w-none",
                      "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3",
                      "prose-p:leading-[1.75] prose-p:my-3 prose-li:leading-[1.65]",
                      "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                      "prose-img:rounded-lg prose-img:max-w-full prose-img:border prose-img:border-border prose-img:my-4"
                    )}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        h1: ({ children }) => <h1 id={getNextHeadingId()}>{children}</h1>,
                        h2: ({ children }) => <h2 id={getNextHeadingId()}>{children}</h2>,
                        h3: ({ children }) => <h3 id={getNextHeadingId()}>{children}</h3>,
                        a: ({ href, children, ...props }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline" {...props}>
                            {children}
                          </a>
                        ),
                        img: ({ src, alt, ...props }) => (
                          <span className="block my-4">
                            <img src={src} alt={alt ?? "Imagem"} className="rounded-lg max-w-full h-auto border border-border shadow-sm" {...props} />
                          </span>
                        ),
                      }}
                    >
                      {contentForPreview(content_md)}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <p className="py-8 text-sm italic text-muted-foreground/70">A visualização aparece aqui ao digitar.</p>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar direita — Comentários */}
        {commentsOpen && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-muted/10">
            <div className="px-6 pt-6 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Comentários
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum comentário ainda.</p>
              <p className="mt-2 text-sm text-muted-foreground/70">Em breve você poderá comentar aqui.</p>
            </div>
          </aside>
        )}
      </div>

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
      className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
    >
      {children}
    </button>
  );
}
