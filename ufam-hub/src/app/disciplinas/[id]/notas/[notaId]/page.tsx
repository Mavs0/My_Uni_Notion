"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  Upload,
  PanelLeftClose,
  PanelRightClose,
  MessageSquare,
  FileText,
  ChevronRight,
  Search,
  Sparkles,
  LayoutPanelLeft,
  BookOpen,
  Eye,
  Pencil,
  Columns2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { CompartilharNotaDialog } from "@/components/CompartilharNotaDialog";

type Nota = {
  id: string;
  disciplinaId: string;
  titulo: string;
  content_md: string;
  created_at?: string;
  updated_at?: string;
};

type NotaComentario = {
  id: string;
  conteudo: string;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      full_name?: string;
      email?: string;
    };
  };
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageMethod, setImageMethod] = useState<"upload" | "url">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [explorerOpen, setExplorerOpen] = useState(false);
  /** Painel direito visível por padrão — comentários na lateral. */
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"assistente" | "comentarios">("comentarios");
  const [assistenteMsgs, setAssistenteMsgs] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [assistenteInput, setAssistenteInput] = useState("");
  const [assistenteBusy, setAssistenteBusy] = useState(false);
  const [comentarios, setComentarios] = useState<NotaComentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notasLista, setNotasLista] = useState<{ id: string; titulo: string }[]>([]);
  const [notasSearch, setNotasSearch] = useState("");
  const [disciplinaNome, setDisciplinaNome] = useState("");
  /** Padrão: só editor (mais espaço). Dividir só em telas grandes. */
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const comentariosEndRef = useRef<HTMLDivElement>(null);
  const assistenteEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!disciplinaId) return;
    let cancelled = false;
    (async () => {
      try {
        const [dRes, nRes] = await Promise.all([
          fetch("/api/disciplinas"),
          fetch(`/api/notas?disciplina_id=${encodeURIComponent(disciplinaId)}`),
        ]);
        if (cancelled) return;
        if (dRes.ok) {
          const d = await dRes.json();
          const disc = (d.disciplinas || []).find(
            (x: { id: string }) => x.id === disciplinaId
          );
          if (disc?.nome) setDisciplinaNome(disc.nome);
        }
        if (nRes.ok) {
          const n = await nRes.json();
          setNotasLista(
            (n.notas || []).map((x: { id: string; titulo: string }) => ({
              id: x.id,
              titulo: x.titulo || "Sem título",
            }))
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [disciplinaId]);

  const loadComentarios = useCallback(async () => {
    if (isNova) {
      setComentarios([]);
      return;
    }
    try {
      setLoadingComentarios(true);
      const res = await fetch(`/api/notas/${notaId}/comentarios`);
      if (res.ok) {
        const data = await res.json();
        setComentarios(data.comentarios || []);
      }
    } catch {
      console.error("Erro ao carregar comentários da nota");
    } finally {
      setLoadingComentarios(false);
    }
  }, [notaId, isNova]);

  useEffect(() => {
    loadComentarios();
  }, [loadComentarios]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/profile");
        if (!cancelled && r.ok) {
          const { profile } = await r.json();
          setCurrentUserId(profile?.id ?? null);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Desktop (lg+): painel Assistente/Comentários aberto por defeito; mobile: editor a largura total. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) setRightPanelOpen(true);
  }, []);

  useEffect(() => {
    if (rightTab !== "comentarios" || !rightPanelOpen) return;
    comentariosEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comentarios.length, rightTab, rightPanelOpen]);

  useEffect(() => {
    if (rightTab !== "assistente" || !rightPanelOpen) return;
    assistenteEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistenteMsgs, assistenteBusy, rightTab, rightPanelOpen]);

  const notasFiltradas = useMemo(() => {
    const q = notasSearch.trim().toLowerCase();
    if (!q) return notasLista;
    return notasLista.filter((n) => n.titulo.toLowerCase().includes(q));
  }, [notasLista, notasSearch]);

  const enviarAssistente = async () => {
    const text = assistenteInput.trim();
    if (!text || assistenteBusy) return;
    const prevHistory = assistenteMsgs;
    setAssistenteInput("");
    setAssistenteMsgs((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setAssistenteBusy(true);
    let acc = "";
    try {
      const res = await fetch("/api/ai/nota-assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          disciplinaId,
          notaId: isNova ? null : notaId,
          question: text,
          history: prevHistory,
          draftTitulo: titulo,
          draftContent: content_md,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        let msg = "Erro ao responder";
        if (ct.includes("application/json")) {
          const j = await res.json();
          msg = j.error || msg;
        } else {
          msg = (await res.text()) || msg;
        }
        throw new Error(msg);
      }
      if (!res.body) throw new Error("Resposta vazia do servidor");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setAssistenteMsgs((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { role: "assistant", content: acc };
          }
          return next;
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no assistente");
      setAssistenteMsgs((prev) => {
        const next = [...prev];
        if (
          next[next.length - 1]?.role === "assistant" &&
          !next[next.length - 1]?.content
        ) {
          next.pop();
        }
        if (next[next.length - 1]?.role === "user") next.pop();
        return next;
      });
      setAssistenteInput(text);
    } finally {
      setAssistenteBusy(false);
    }
  };

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

  const openShare = () => {
    if (isNova || !nota) {
      toast.error("Salve a nota antes de compartilhar.");
      return;
    }
    setShareOpen(true);
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

  const getInitials = (nome?: string, email?: string) => {
    if (nome) {
      const parts = nome.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (
          parts[0][0] + parts[parts.length - 1][0]
        ).toUpperCase();
      }
      return nome.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const handleEnviarComentario = async () => {
    if (isNova || !novoComentario.trim()) return;
    try {
      setEnviandoComentario(true);
      const res = await fetch(`/api/notas/${notaId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: novoComentario }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comentario) {
          setComentarios((prev) => [...prev, data.comentario]);
        }
        setNovoComentario("");
        toast.success("Comentário adicionado");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao enviar comentário");
      }
    } catch {
      toast.error("Erro ao enviar comentário");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: string) => {
    if (isNova) return;
    try {
      const res = await fetch(
        `/api/notas/${notaId}/comentarios?comentario_id=${encodeURIComponent(comentarioId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
        toast.success("Comentário removido");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erro ao remover");
      }
    } catch {
      toast.error("Erro ao remover comentário");
    }
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-background">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap border-b border-border/60 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <Link href="/disciplinas" className="hover:text-foreground transition-colors">
            Disciplinas
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          <Link
            href={`/disciplinas/${disciplinaId}`}
            className="max-w-[140px] truncate hover:text-foreground transition-colors"
          >
            {disciplinaNome || "Disciplina"}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          <span className="text-muted-foreground/80">Notas</span>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
          <span className="truncate font-medium text-foreground max-w-[200px]">
            {titulo || "Sem título"}
          </span>
        </div>
        <div className="flex min-h-14 flex-col gap-3 px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <Link href={`/disciplinas/${disciplinaId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Sem título"
                className="min-w-0 w-full max-w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground sm:max-w-[min(100%,28rem)] md:max-w-md lg:max-w-xl"
              />
              <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                {saving ? "Salvando…" : nota?.updated_at ? `Salvo · ${formatEditedAgo(nota.updated_at)}` : "Não salvo"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <Button
              size="sm"
              onClick={openShare}
              disabled={isNova}
              className="h-9 gap-2 rounded-lg bg-primary px-3 text-primary-foreground hover:bg-primary/90 sm:px-4"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Compartilhar</span>
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
        <div className="flex h-11 min-h-11 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden border-t border-border bg-muted/30 px-2 py-0 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={() => setExplorerOpen((o) => !o)}
          >
            {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <LayoutPanelLeft className="h-4 w-4" />}
            <span className="hidden sm:inline">Explorador</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 rounded-lg px-3 text-muted-foreground hover:bg-background hover:text-foreground"
            onClick={() => setRightPanelOpen((c) => !c)}
          >
            {rightPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {rightPanelOpen ? "Fechar painel" : "Abrir painel"}
            </span>
          </Button>
          <div className="mx-2 hidden h-5 w-px bg-border sm:block" />
          <div className="flex items-center gap-0.5 rounded-lg border border-border/80 bg-background/80 p-0.5">
            {(
              [
                { id: "edit" as const, label: "Escrever", icon: Pencil },
                { id: "split" as const, label: "Dividir", icon: Columns2 },
                { id: "preview" as const, label: "Leitura", icon: Eye },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  viewMode === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
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

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Explorador + sumário (anexo 03 — painel de documentos) */}
        {explorerOpen && (
          <>
            <button
              type="button"
              aria-label="Fechar explorador"
              className="fixed inset-0 z-[45] bg-black/50 lg:hidden"
              onClick={() => setExplorerOpen(false)}
            />
            <aside
              className={cn(
                "flex min-h-0 w-[min(88vw,18rem)] max-w-[85vw] shrink-0 flex-col overflow-hidden border-r border-border bg-card/50 shadow-2xl",
                "fixed inset-y-0 left-0 z-[46]",
                "lg:static lg:z-auto lg:h-auto lg:w-64 lg:max-w-none lg:shadow-none",
              )}
            >
            <div className="border-b border-border px-3 py-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Notas da disciplina
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={notasSearch}
                  onChange={(e) => setNotasSearch(e.target.value)}
                  placeholder="Buscar nota…"
                  className="h-9 rounded-lg border-border bg-muted/40 pl-8 text-sm"
                />
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-2">
              <ul className="space-y-0.5">
                {notasFiltradas.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/disciplinas/${disciplinaId}/notas/${n.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        n.id === notaId
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="truncate">{n.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {notasFiltradas.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground">Nenhuma nota encontrada.</p>
              )}
            </nav>
            <div className="border-t border-border">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Sumário desta nota
                </p>
              </div>
              <nav className="max-h-48 overflow-y-auto px-3 pb-4">
                {sumario.length === 0 ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Use # ou ## no texto para gerar o índice.
                  </p>
                ) : (
                  <ul className="space-y-0.5 text-sm">
                    {sumario.map((item, i) => (
                      <li
                        key={i}
                        className={cn(
                          "cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/70",
                          item.level === 1 && "font-medium text-foreground",
                          item.level >= 2 && "text-muted-foreground text-xs"
                        )}
                        style={{
                          paddingLeft:
                            item.level >= 2 ? `${0.5 + (item.level - 1) * 0.5}rem` : undefined,
                        }}
                        onClick={() => {
                          const id = `heading-${sumario.indexOf(item)}`;
                          previewRef.current
                            ?.querySelector(`[id="${id}"]`)
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>
          </aside>
          </>
        )}

        <main className="relative z-0 min-w-0 flex-1 overflow-auto bg-muted/15">
          <div className="mx-auto w-full max-w-[min(100%,88rem)] px-3 py-5 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
            {(viewMode === "edit" || viewMode === "split") && (
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Sem título"
                className="mb-6 w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
              />
            )}
            {viewMode === "preview" && (
              <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
                {titulo || "Sem título"}
              </h1>
            )}
            <div
              className={cn(
                "rounded-2xl border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm",
                viewMode === "split" &&
                  "grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-0 xl:divide-x xl:divide-border/80",
                (viewMode === "edit" || viewMode === "preview") && "overflow-hidden",
              )}
            >
              {(viewMode === "edit" || viewMode === "split") && (
                <div className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">
                  {viewMode === "split" && (
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Editor
                    </p>
                  )}
                  <textarea
                    ref={editorRef}
                    data-nota-editor
                    value={content_md}
                    onChange={(e) => setContent_md(e.target.value)}
                    placeholder="Escreva aqui… Use Markdown."
                    className={cn(
                      "min-h-[min(70vh,42rem)] w-full resize-y break-words rounded-xl border border-border/50 bg-muted/30 px-4 py-4 text-[1.0625rem] leading-[1.8] outline-none placeholder:text-muted-foreground/45 focus:border-primary/35 focus:ring-2 focus:ring-primary/15 sm:px-5 sm:py-5 sm:text-[1.075rem]",
                      viewMode === "edit" && "min-h-[min(75vh,48rem)]",
                    )}
                  />
                  <p className="mt-4 text-xs text-muted-foreground">
                    <kbd className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono">**negrito**</kbd>{" "}
                    <kbd className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono">[texto](url)</kbd>
                  </p>
                </div>
              )}
              {(viewMode === "preview" || viewMode === "split") && (
                <div
                  ref={previewRef}
                  className={cn(
                    "min-w-0 bg-background/60 p-5 sm:p-8 lg:p-10 xl:p-12",
                    viewMode === "split" && "xl:min-h-[min(70vh,42rem)]",
                  )}
                >
                  {viewMode === "split" && (
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Pré-visualização
                    </p>
                  )}
                  {content_md.trim() ? (
                    <article
                      className={cn(
                        "prose prose-base dark:prose-invert max-w-none lg:prose-lg",
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
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline-offset-2 hover:underline"
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
                                className="h-auto max-w-full rounded-lg border border-border shadow-sm"
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
                    <p className="py-12 text-center text-sm italic text-muted-foreground/70">
                      Nada para pré-visualizar ainda.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {rightPanelOpen && (
          <>
            <button
              type="button"
              aria-label="Fechar painel lateral"
              className="fixed inset-0 z-[45] bg-black/50 lg:hidden"
              onClick={() => setRightPanelOpen(false)}
            />
            <aside
              className={cn(
                "flex min-h-0 w-[min(100vw-0.75rem,20rem)] max-w-[min(100vw-0.5rem,22rem)] shrink-0 flex-col overflow-hidden border-l border-border bg-card/50 shadow-2xl",
                "fixed inset-y-0 right-0 z-[46] max-h-[100dvh]",
                "lg:static lg:z-auto lg:h-auto lg:max-h-none lg:w-80 lg:max-w-none lg:shadow-none",
              )}
            >
            <div className="flex shrink-0 border-b border-border">
              <button
                type="button"
                onClick={() => setRightTab("assistente")}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:gap-2 sm:text-xs",
                  rightTab === "assistente"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="truncate">Assistente</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab("comentarios")}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors sm:gap-2 sm:text-xs",
                  rightTab === "comentarios"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">Comentários</span>
                {comentarios.length > 0 && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-bold tabular-nums text-primary">
                    {comentarios.length}
                  </span>
                )}
              </button>
            </div>
            {rightTab === "assistente" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                  <div className="rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">UFAM Hub · Assistente</p>
                    <p className="mt-1">
                      Pergunte com base no texto desta anotação (Markdown). A conversa fica só neste painel até você limpar.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[
                        "Resuma os pontos principais desta nota.",
                        "O que eu deveria revisar primeiro?",
                        "Explique o trecho mais difícil em linguagem simples.",
                      ].map((hint) => (
                        <button
                          key={hint}
                          type="button"
                          disabled={assistenteBusy}
                          onClick={() => setAssistenteInput(hint)}
                          className="max-w-full rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-left text-[11px] leading-snug text-foreground/90 transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                  {assistenteMsgs.map((m, i) => (
                    <div
                      key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                      className={cn(
                        "flex w-full",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[min(95%,100%)] break-words rounded-xl px-3 py-2 text-sm",
                          m.role === "user"
                            ? "bg-primary/15 text-foreground"
                            : "border border-border/70 bg-muted/30 text-foreground",
                        )}
                      >
                        {m.role === "user" ? (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        ) : m.content ? (
                          <div
                            className={cn(
                              "prose prose-sm dark:prose-invert max-w-none break-words",
                              "prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5",
                            )}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          assistenteBusy && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={assistenteEndRef} aria-hidden className="h-px shrink-0" />
                </div>
                <div className="shrink-0 border-t border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {isNova ? "Rascunho" : "Nota salva"} · contexto do editor
                    </span>
                    {assistenteMsgs.length > 0 && (
                      <button
                        type="button"
                        className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        onClick={() => setAssistenteMsgs([])}
                        disabled={assistenteBusy}
                      >
                        Limpar conversa
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-2">
                    <Textarea
                      value={assistenteInput}
                      onChange={(e) => setAssistenteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void enviarAssistente();
                        }
                      }}
                      placeholder="Pergunte sobre esta nota…"
                      disabled={assistenteBusy}
                      rows={2}
                      className="min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-10 w-10 shrink-0 self-end rounded-lg"
                      disabled={assistenteBusy || !assistenteInput.trim()}
                      onClick={() => void enviarAssistente()}
                      aria-label="Enviar"
                    >
                      {assistenteBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {rightTab === "comentarios" && (
              <div className="flex min-h-0 flex-1 flex-col">
                {isNova ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/35" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Salve a anotação primeiro
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
                      Depois você pode registrar comentários e lembretes nesta lateral.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                      {loadingComentarios ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        </div>
                      ) : comentarios.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
                          <MessageSquare className="mx-auto mb-2 h-9 w-9 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">
                            Nenhum comentário ainda.
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/75">
                            Use o campo abaixo para anotar ideias, dúvidas ou revisões.
                          </p>
                        </div>
                      ) : (
                        comentarios.map((c) => {
                          const meta = c.usuario?.raw_user_meta_data;
                          const nome =
                            meta?.nome ||
                            meta?.full_name ||
                            meta?.email ||
                            "Você";
                          const email = meta?.email || "";
                          return (
                            <div
                              key={c.id}
                              className="flex gap-2.5 rounded-xl border border-border/70 bg-muted/25 p-2.5"
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(nome, email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <span className="text-xs font-medium text-foreground">
                                      {nome}
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                      {new Date(c.created_at).toLocaleString(
                                        "pt-BR",
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )}
                                    </span>
                                  </div>
                                  {c.usuario?.id === currentUserId && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeletarComentario(c.id)}
                                      title="Remover comentário"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/95">
                                  {c.conteudo}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={comentariosEndRef} aria-hidden />
                    </div>
                    <div className="shrink-0 border-t border-border p-3">
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          placeholder="Comentário ou lembrete sobre esta nota…"
                          rows={3}
                          disabled={enviandoComentario}
                          className="min-h-[4.5rem] resize-none text-sm"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              (e.metaKey || e.ctrlKey)
                            ) {
                              e.preventDefault();
                              handleEnviarComentario();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="w-full gap-2"
                          disabled={
                            enviandoComentario || !novoComentario.trim()
                          }
                          onClick={handleEnviarComentario}
                        >
                          {enviandoComentario ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar
                        </Button>
                        <p className="text-[10px] text-muted-foreground">
                          Atalho:{" "}
                          <kbd className="rounded border border-border bg-muted/60 px-1 font-mono">
                            ⌘
                          </kbd>
                          {" + "}
                          <kbd className="rounded border border-border bg-muted/60 px-1 font-mono">
                            Enter
                          </kbd>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
          </>
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

      {!isNova && nota && (
        <CompartilharNotaDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          notaId={nota.id}
          disciplinaId={disciplinaId}
          tituloNota={titulo || nota.titulo}
        />
      )}
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
