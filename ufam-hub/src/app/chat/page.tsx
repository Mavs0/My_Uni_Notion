"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  X,
  Star,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  Brain,
  HelpCircle,
  Lightbulb,
  Network,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Copy,
  Share2,
  FileText,
  Eye,
  FileDown,
  FileUp,
  Zap,
  Tag,
  Save,
  Tags,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageRenderer } from "@/components/chat/MessageRenderer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  contextoUsado?: string[];
  anotacoesUsadas?: string[];
};
type Thread = {
  id: string;
  disciplinaId: string;
  title: string;
  msgs: Msg[];
  createdAt: number;
  updatedAt: number;
  favorited?: boolean;
  modo?: "chat" | "quiz" | "explicacao" | "mapa_mental";
  tags?: string[];
};

type QuizPergunta = {
  numero: number;
  pergunta: string;
  opcoes: { a: string; b: string; c: string; d: string };
  resposta_correta: string;
  explicacao: string;
};

type QuizData = {
  titulo: string;
  perguntas: QuizPergunta[];
};

type MapaMentalRamo = {
  id: string;
  texto: string;
  cor: string;
  subramos?: { id: string; texto: string; detalhes?: string }[];
};

type MapaMentalData = {
  titulo: string;
  descricao: string;
  nocentral: { texto: string; cor: string };
  ramos: MapaMentalRamo[];
  resumo: string;
};

const storeKey = "chatThreads:v1";
const MODOS = [
  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Conversa livre" },
  { id: "quiz", label: "Quiz", icon: Brain, desc: "Teste seus conhecimentos" },
  {
    id: "explicacao",
    label: "Explicar",
    icon: Lightbulb,
    desc: "Conceitos com exemplos",
  },
  {
    id: "mapa_mental",
    label: "Mapa Mental",
    icon: Network,
    desc: "Visualize ideias",
  },
] as const;
export default function ChatPage() {
  const { disciplinas, disciplinasAtivas, loading: loadingDisc } =
    useDisciplinas();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent");
  const [modoAtual, setModoAtual] = useState<
    "chat" | "quiz" | "explicacao" | "mapa_mental"
  >("chat");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizRespostas, setQuizRespostas] = useState<Record<number, string>>(
    {}
  );
  const [quizMostrarResultado, setQuizMostrarResultado] = useState(false);
  const [mapaMentalData, setMapaMentalData] = useState<MapaMentalData | null>(
    null
  );
  const [quizLoading, setQuizLoading] = useState(false);
  const [explicacaoLoading, setExplicacaoLoading] = useState(false);
  const [mapaLoading, setMapaLoading] = useState(false);
  const [pdfExtractLoading, setPdfExtractLoading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [quizConfig, setQuizConfig] = useState({
    tema: "",
    quantidade: 5,
    dificuldade: "medio",
  });
  const [explicacaoConfig, setExplicacaoConfig] = useState({
    conceito: "",
    nivel: "intermediario",
  });
  const [mapaConfig, setMapaConfig] = useState({ texto: "", titulo: "" });
  const [explicacaoTexto, setExplicacaoTexto] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [contextInfo, setContextInfo] = useState<{
    anotacoes: string[];
    avaliacoes: string[];
  } | null>(null);
  const [showSaveAsNoteDialog, setShowSaveAsNoteDialog] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [threadTags, setThreadTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [msgAsstId, setMsgAsstId] = useState<string | null>(null);
  const [showSaveMapaDialog, setShowSaveMapaDialog] = useState(false);
  const [showLoadMapaDialog, setShowLoadMapaDialog] = useState(false);
  const [mapasSalvos, setMapasSalvos] = useState<any[]>([]);
  const [loadingMapasSalvos, setLoadingMapasSalvos] = useState(false);
  const [mapaTitleToSave, setMapaTitleToSave] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [storageHydrated, setStorageHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const data: Thread[] = JSON.parse(raw);
        setThreads(data);
        if (data[0]) setCurrentId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar threads do localStorage:", error);
    } finally {
      setStorageHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (disciplinasAtivas.length === 0) return;
    const ativa = disciplinasAtivas.some((d) => d.id === disciplinaId);
    if (disciplinaId === "" || !ativa) {
      setDisciplinaId(disciplinasAtivas[0]?.id ?? "");
    }
  }, [disciplinasAtivas, disciplinaId]);
  useEffect(() => {
    if (!storageHydrated) return;
    try {
      localStorage.setItem(storeKey, JSON.stringify(threads));
    } catch (error) {
      console.error("Erro ao salvar threads no localStorage:", error);
    }
    const allTags = new Set<string>();
    threads.forEach((t) => {
      if (t.tags) {
        t.tags.forEach((tag) => allTags.add(tag));
      }
    });
    setAvailableTags(Array.from(allTags).sort());
  }, [threads, storageHydrated]);
  const current = useMemo(
    () => threads.find((t) => t.id === currentId) || null,
    [threads, currentId]
  );
  const currentMsgs = current?.msgs ?? [];
  function newThread() {
    if (!disciplinasAtivas || disciplinasAtivas.length === 0) {
      return;
    }
    const id = `t_${Date.now()}`;
    const disc = disciplinas.find((d) => d.id === disciplinaId);
    const th: Thread = {
      id,
      disciplinaId,
      title: `${disc?.nome || "Chat"} — ${new Date().toLocaleDateString(
        "pt-BR"
      )}`,
      msgs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setThreads((prev) => [th, ...prev]);
    setCurrentId(id);
    setShowNewThreadDialog(false);
  }
  function removeThread(id: string) {
    setThreadToDelete(id);
  }
  function confirmDeleteThread() {
    if (!threadToDelete) return;
    setThreads((prev) => prev.filter((t) => t.id !== threadToDelete));
    if (currentId === threadToDelete) {
      setCurrentId(threads.find((t) => t.id !== threadToDelete)?.id ?? null);
    }
    setThreadToDelete(null);
  }
  function toggleFavorite(threadId: string) {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId ? { ...t, favorited: !t.favorited } : t
      )
    );
  }
  function exportThread(thread: Thread) {
    const disciplina = disciplinas.find((d) => d.id === thread.disciplinaId);
    const disciplinaNome = disciplina?.nome || "Desconhecida";
    let content = `Conversa: ${thread.title}\n`;
    content += `Disciplina: ${disciplinaNome}\n`;
    content += `Data: ${new Date(thread.createdAt).toLocaleString("pt-BR")}\n`;
    content += `Total de mensagens: ${thread.msgs.length}\n`;
    content += `\n${"=".repeat(60)}\n\n`;
    thread.msgs.forEach((msg, index) => {
      const role = msg.role === "user" ? "Você" : "Assistente IA";
      const timestamp = new Date(msg.ts).toLocaleString("pt-BR");
      content += `[${index + 1}] ${role} (${timestamp}):\n`;
      content += `${msg.text}\n\n`;
    });
    content += `\n${"=".repeat(60)}\n`;
    content += `Exportado em: ${new Date().toLocaleString("pt-BR")}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-${thread.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  const filteredAndSortedThreads = useMemo(() => {
    let filtered = [...threads];
    if (filterFavorites) {
      filtered = filtered.filter((t) => t.favorited);
    }
    if (filterTag) {
      filtered = filtered.filter(
        (t) => t.tags && t.tags.includes(filterTag)
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.msgs.some((m) => m.text.toLowerCase().includes(query)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return b.updatedAt - a.updatedAt;
      } else if (sortBy === "oldest") {
        return a.updatedAt - b.updatedAt;
      } else {
        return (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
      }
    });
    filtered.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      return 0;
    });
    return filtered;
  }, [threads, filterFavorites, searchQuery, sortBy, filterTag]);
  async function send(overrideText?: string) {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend) return;
    if (!disciplinasAtivas || disciplinasAtivas.length === 0) {
      setStreamErr(
        "Você precisa cadastrar pelo menos uma disciplina para usar o chat de IA."
      );
      return;
    }
    setStreamErr(null);
    let tId = currentId;
    if (!tId) {
      const id = `t_${Date.now()}`;
      const disc = disciplinas.find((d) => d.id === disciplinaId);
      const th: Thread = {
        id,
        disciplinaId,
        title: `${disc?.nome || "Chat"} — ${new Date().toLocaleDateString(
          "pt-BR"
        )}`,
        msgs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setThreads((prev) => [th, ...prev]);
      tId = id;
      setCurrentId(id);
    }
    const msgUser: Msg = {
      id: `m_${Date.now()}_u`,
      role: "user",
      text: textToSend,
      ts: Date.now(),
    };
    const msgAsstId = `m_${Date.now() + 1}_a`;
    setMsgAsstId(msgAsstId);
    if (!overrideText) setInput("");
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== tId) return t;
        const newMsgs = [
          ...t.msgs,
          msgUser,
          { id: msgAsstId, role: "assistant" as const, text: "", ts: Date.now() },
        ];
        const newTitle =
          t.msgs.length === 0
            ? msgUser.text.length > 50
              ? msgUser.text.substring(0, 50) + "..."
              : msgUser.text
            : t.title;
        return {
          ...t,
          msgs: newMsgs,
          title: newTitle,
          updatedAt: Date.now(),
        };
      })
    );
    setLoading(true);
    const disciplinaParaApi = disciplinaId;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          disciplinaId: disciplinaParaApi,
          question: msgUser.text,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Erro na API (${res.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      if (!res.body) {
        const errorText = await res
          .text()
          .catch(() => "Não foi possível ler o erro");
        throw new Error(errorText || "Resposta da API não contém dados");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      const timeout = setTimeout(() => {
        reader.cancel();
      }, 30000);
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (value && value.length > 0) {
            clearTimeout(timeout);
            const chunk = decoder.decode(value, { stream: true });
            if (chunk && chunk.length > 0) {
              acc += chunk;
              setIsTyping(true);
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === tId
                    ? {
                        ...t,
                        msgs: t.msgs.map((m) =>
                          m.id === msgAsstId ? { ...m, text: acc } : m
                        ),
                        updatedAt: Date.now(),
                      }
                    : t
                )
              );
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          }
          if (done) {
            clearTimeout(timeout);
            break;
          }
        }
        if (!acc.trim()) {
          clearTimeout(timeout);
          throw new Error(
            "Resposta vazia da API - verifique se a API de IA está configurada corretamente"
          );
        }
        clearTimeout(timeout);
        setIsTyping(false);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === tId
              ? {
                  ...t,
                  msgs: t.msgs.map((m) =>
                    m.id === msgAsstId ? { ...m, text: acc } : m
                  ),
                  updatedAt: Date.now(),
                }
              : t
          )
        );
      } catch (streamError) {
        clearTimeout(timeout);
        throw streamError;
      }
    } catch (e: any) {
      console.error("Erro no chat:", e);
      const errorMessage = e?.message || "Erro desconhecido";
      setStreamErr(errorMessage);
      const errorText =
        (errorMessage.includes("API") &&
          (errorMessage.includes("não configurada") ||
            errorMessage.includes("API key"))) ||
        errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY")
          ? "Erro: API de IA não configurada. Verifique as configurações."
          : errorMessage.includes("Não autorizado")
          ? "Erro: Você precisa estar logado para usar o chat."
          : errorMessage.includes("500")
          ? "Erro: Problema no servidor. Verifique se a API de IA está configurada."
          : errorMessage;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === tId
            ? {
                ...t,
                msgs: t.msgs.map((m) =>
                  m.id === msgAsstId
                    ? {
                        ...m,
                        text: `❌ ${errorText}\n\nPor favor, verifique:\n- Se está logado\n- Se a API de IA está configurada\n- Sua conexão com a internet`,
                      }
                    : m
                ),
                updatedAt: Date.now(),
              }
            : t
        )
      );
    } finally {
      setLoading(false);
      setIsTyping(false);
      setMsgAsstId(null);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }
  function clearCurrent() {
    if (!current) return;
    setShowClearDialog(true);
  }
  function confirmClear() {
    if (!current) return;
    setThreads((prev) =>
      prev.map((t) => 
        t.id === current.id 
          ? { ...t, msgs: [], updatedAt: Date.now() } 
          : t
      )
    );
    setShowClearDialog(false);
  }
  const disciplinaAtual = disciplinas.find(
    (d) => d.id === (current?.disciplinaId ?? disciplinaId)
  );
  const corDisciplina = disciplinaAtual?.cor || "#6366f1";

  useEffect(() => {
    if (modoAtual !== "chat" || !disciplinaAtual) {
      setSuggestions([]);
      return;
    }

    let sugestoesGerais: string[] = [];

    if (currentMsgs.length === 0) {
      sugestoesGerais = [
        `Explique os principais conceitos de ${disciplinaAtual.nome}`,
        `Quais são os tópicos mais importantes de ${disciplinaAtual.nome}?`,
        `Resuma o conteúdo de ${disciplinaAtual.nome}`,
        `Quais são as aplicações práticas de ${disciplinaAtual.nome}?`,
      ];
    } else {
      const ultimaMsg = currentMsgs[currentMsgs.length - 1];
      if (ultimaMsg.role === "assistant" && ultimaMsg.text) {
        const palavras = ultimaMsg.text
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4)
          .slice(0, 3);
        
        sugestoesGerais = [
          "Explique mais sobre isso",
          "Dê exemplos práticos",
          "Como isso se relaciona com outros conceitos?",
          "Quais são os pontos-chave para lembrar?",
        ];
      } else if (ultimaMsg.role === "user") {
        sugestoesGerais = [
          "Explique de forma mais detalhada",
          "Dê exemplos práticos",
          "Como aplicar isso na prática?",
          "Quais são as principais dificuldades?",
        ];
      }
    }

    setSuggestions(sugestoesGerais.slice(0, 4));
  }, [
    modoAtual,
    disciplinaAtual?.id,
    disciplinaAtual?.nome,
    currentMsgs.length,
    currentMsgs[currentMsgs.length - 1]?.text,
  ]);

  const handleShareThread = () => {
    if (!current) return;
    const threadData = {
      title: current.title,
      disciplina: disciplinaAtual?.nome || "",
      messages: current.msgs,
      createdAt: current.createdAt,
    };
    const encoded = btoa(JSON.stringify(threadData));
    const link = `${window.location.origin}/chat/shared/${encoded}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copiado!");
      setShowShareDialog(false);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleSaveAsNote = async () => {
    if (!current || !noteTitle.trim()) return;
    try {
      const disciplina = disciplinas.find((d) => d.id === current.disciplinaId);
      if (!disciplina) {
        setStreamErr("Disciplina não encontrada");
        return;
      }

      let contentMd = `# ${noteTitle}\n\n`;
      contentMd += `**Disciplina:** ${disciplina.nome}\n`;
      contentMd += `**Data da conversa:** ${new Date(current.createdAt).toLocaleString("pt-BR")}\n\n`;
      contentMd += `---\n\n`;

      current.msgs.forEach((msg) => {
        const role = msg.role === "user" ? "**Você:**" : "**Assistente IA:**";
        contentMd += `${role}\n\n${msg.text}\n\n---\n\n`;
      });

      const response = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplina_id: current.disciplinaId,
          titulo: noteTitle.trim(),
          content_md: contentMd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar anotação");
      }

      setShowSaveAsNoteDialog(false);
      setNoteTitle("");
      setStreamErr(null);
      toast.success("Conversa salva como anotação!");
    } catch (error: any) {
      setStreamErr(error.message || "Erro ao salvar como anotação");
    }
  };

  const openTagsDialog = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setThreadTags(thread.tags || []);
      setCurrentId(threadId);
      setShowTagsDialog(true);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !threadTags.includes(newTag.trim())) {
      setThreadTags([...threadTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setThreadTags(threadTags.filter((t) => t !== tag));
  };

  const saveTags = () => {
    if (!currentId) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentId ? { ...t, tags: threadTags } : t
      )
    );
    setShowTagsDialog(false);
  };

  const exportToMarkdown = () => {
    if (!current) return;
    const disciplina = disciplinas.find((d) => d.id === current.disciplinaId);
    let md = `# ${current.title}\n\n`;
    md += `**Disciplina:** ${disciplina?.nome || "Desconhecida"}\n`;
    md += `**Data:** ${new Date(current.createdAt).toLocaleString(
      "pt-BR"
    )}\n\n`;
    md += `---\n\n`;
    current.msgs.forEach((msg) => {
      const role = msg.role === "user" ? "Você" : "Assistente IA";
      md += `## ${role}\n\n`;
      md += `${msg.text}\n\n`;
      if (msg.anotacoesUsadas && msg.anotacoesUsadas.length > 0) {
        md += `*Contexto usado: ${msg.anotacoesUsadas.join(", ")}*\n\n`;
      }
      md += `---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-${current.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Mensagem copiada!");
    } catch (error) {
      toast.error("Erro ao copiar mensagem");
    }
  };

  const gerarQuiz = async () => {
    if (!disciplinaId) {
      setStreamErr("Selecione uma disciplina primeiro");
      return;
    }
    setQuizLoading(true);
    setQuizData(null);
    setQuizRespostas({});
    setQuizMostrarResultado(false);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          disciplinaId,
          tema: quizConfig.tema,
          quantidade: quizConfig.quantidade,
          dificuldade: quizConfig.dificuldade,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : `Erro ao gerar quiz (${res.status})`;
        throw new Error(msg);
      }
      if (data.quiz) {
        setQuizData(data.quiz);
      } else {
        throw new Error(data.error || "Erro ao processar quiz");
      }
    } catch (error: any) {
      setStreamErr(error.message);
      if (error.message?.includes("Cota") || error.message?.includes("quota")) {
        toast.error(error.message);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const calcularPontuacaoQuiz = () => {
    if (!quizData) return { acertos: 0, total: 0, percentual: 0 };
    let acertos = 0;
    quizData.perguntas.forEach((p) => {
      if (quizRespostas[p.numero] === p.resposta_correta) {
        acertos++;
      }
    });
    return {
      acertos,
      total: quizData.perguntas.length,
      percentual: Math.round((acertos / quizData.perguntas.length) * 100),
    };
  };

  const explicarConceito = async () => {
    if (!explicacaoConfig.conceito.trim()) {
      setStreamErr("Digite o conceito que deseja entender");
      return;
    }
    setExplicacaoLoading(true);
    setExplicacaoTexto("");
    try {
      const res = await fetch("/api/ai/explicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conceito: explicacaoConfig.conceito,
          disciplinaId,
          nivel: explicacaoConfig.nivel,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Erro ao explicar conceito (${res.status})`,
        );
      }
      if (!res.body) throw new Error("Resposta sem conteúdo");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setExplicacaoTexto(acc);
      }
    } catch (error: any) {
      setStreamErr(error.message);
    } finally {
      setExplicacaoLoading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF válido");
      return;
    }
    setPdfExtractLoading(true);
    setStreamErr(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ai/pdf-extract", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao processar PDF");
      }
      const { texto } = await res.json();
      if (texto) {
        setMapaConfig((prev) => ({ ...prev, texto }));
        toast.success(`Texto extraído do PDF (${file.name})`);
      } else {
        toast.error("Nenhum texto encontrado no PDF. Tente outro arquivo.");
      }
    } catch (err: any) {
      setStreamErr(err.message);
      toast.error(err.message);
    } finally {
      setPdfExtractLoading(false);
      e.target.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const gerarMapaMental = async () => {
    if (!mapaConfig.texto.trim()) {
      setStreamErr("Cole o texto ou envie um PDF para transformar em mapa mental");
      return;
    }
    setMapaLoading(true);
    setMapaMentalData(null);
    try {
      const res = await fetch("/api/ai/mapa-mental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          texto: mapaConfig.texto,
          titulo: mapaConfig.titulo,
          disciplinaId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : `Erro ao gerar mapa mental (${res.status})`;
        throw new Error(msg);
      }
      if (data.mapaMental) {
        setMapaMentalData(data.mapaMental);
      } else {
        throw new Error(data.error || "Erro ao processar mapa mental");
      }
    } catch (error: any) {
      setStreamErr(error.message);
      if (error.message?.includes("Cota") || error.message?.includes("quota")) {
        toast.error(error.message);
      }
    } finally {
      setMapaLoading(false);
    }
  };

  const carregarMapasSalvos = async () => {
    setLoadingMapasSalvos(true);
    try {
      const res = await fetch("/api/colaboracao/biblioteca?tipo=mapa_mental");
      if (!res.ok) throw new Error("Erro ao carregar mapas mentais");
      const data = await res.json();
      setMapasSalvos(data.materiais || []);
    } catch (error: any) {
      toast.error("Erro ao carregar mapas mentais salvos");
      console.error(error);
    } finally {
      setLoadingMapasSalvos(false);
    }
  };

  const salvarMapaMental = async () => {
    if (!mapaMentalData) {
      toast.error("Nenhum mapa mental para salvar");
      return;
    }
    if (!mapaTitleToSave.trim()) {
      toast.error("Digite um título para o mapa mental");
      return;
    }
    try {
      const res = await fetch("/api/colaboracao/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: mapaTitleToSave.trim(),
          descricao: mapaMentalData.descricao || mapaMentalData.resumo,
          tipo: "mapa_mental",
          categoria: "estudo",
          tags: ["mapa-mental", "ia"],
          visibilidade: "privado",
          arquivo_url: JSON.stringify(mapaMentalData),
          arquivo_tipo: "application/json",
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar mapa mental");
      }
      toast.success("Mapa mental salvo com sucesso!");
      setShowSaveMapaDialog(false);
      setMapaTitleToSave("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar mapa mental");
      console.error(error);
    }
  };

  const carregarMapaMental = async (material: any) => {
    try {
      const mapaData = JSON.parse(material.arquivo_url || "{}");
      setMapaMentalData(mapaData);
      setShowLoadMapaDialog(false);
      toast.success("Mapa mental carregado!");
    } catch (error: any) {
      toast.error("Erro ao carregar mapa mental");
      console.error(error);
    }
  };
  if (loadingDisc) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MessageSquare className="size-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-background via-muted/30 to-primary/[0.06]",
        "dark:via-background dark:to-emerald-950/25",
        "lg:h-[min(100dvh,calc(100vh-5rem))] lg:max-h-[calc(100vh-5rem)] lg:flex-row lg:gap-4",
      )}
    >
      <aside className="hidden w-80 shrink-0 lg:flex lg:flex-col lg:rounded-2xl lg:border lg:border-border/50 lg:bg-card/70 lg:shadow-xl lg:backdrop-blur-xl dark:lg:border-white/5 dark:lg:bg-card/45">
        <div className="border-b border-border/50 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground">Chat IA</h2>
              <p className="text-xs text-muted-foreground">
                {threads.length > 0 && (
                  <span>
                    {threads.length}{" "}
                    {threads.length === 1 ? "conversa" : "conversas"}
                    {threads.filter((t) => t.favorited).length > 0 && (
                      <span className="ml-1">
                        • {threads.filter((t) => t.favorited).length}{" "}
                        {threads.filter((t) => t.favorited).length === 1
                          ? "favorita"
                          : "favoritas"}
                      </span>
                    )}
                  </span>
                )}
                {threads.length === 0 && "Assistente acadêmico"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={
                disciplinaId ||
                disciplinasAtivas[0]?.id ||
                undefined
              }
              onValueChange={setDisciplinaId}
              disabled={!disciplinasAtivas || disciplinasAtivas.length === 0}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {!disciplinasAtivas || disciplinasAtivas.length === 0 ? (
                  <SelectItem value="__disabled__" disabled>
                    Nenhuma disciplina cadastrada
                  </SelectItem>
                ) : (
                  disciplinasAtivas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowNewThreadDialog(true)}
                    size="sm"
                    className="shrink-0"
                    disabled={!disciplinasAtivas || disciplinasAtivas.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!disciplinasAtivas || disciplinasAtivas.length === 0
                      ? "Cadastre uma disciplina primeiro"
                      : "Nova conversa"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {}
        <div className="space-y-2 border-b border-border/50 bg-muted/20 p-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filterFavorites ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterFavorites(!filterFavorites)}
              className="flex-1 text-xs h-8"
            >
              <Star
                className={`h-3.5 w-3.5 mr-1.5 ${
                  filterFavorites ? "fill-current" : ""
                }`}
              />
              Favoritos
            </Button>
            {availableTags.length > 0 && (
              <Select
                value={filterTag || undefined}
                onValueChange={(value) => setFilterTag(value || null)}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recente</SelectItem>
                <SelectItem value="oldest">Mais antiga</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filteredAndSortedThreads.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground font-medium">
                {threads.length === 0
                  ? "Nenhuma conversa ainda"
                  : searchQuery || filterFavorites
                  ? "Nenhuma conversa encontrada"
                  : "Nenhuma conversa"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {threads.length === 0
                  ? "Crie uma nova conversa para começar"
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredAndSortedThreads.map((t) => {
                const disc =
                  disciplinas.find((d) => d.id === t.disciplinaId)?.nome ??
                  "Disciplina";
                const isFavorite = t.favorited || false;
                return (
                  <li
                    key={t.id}
                    className={`group rounded-lg border p-3 cursor-pointer transition-all ${
                      t.id === currentId
                        ? "bg-accent border-primary/30 shadow-sm"
                        : "hover:bg-accent/50 border-border"
                    }`}
                    onClick={() => setCurrentId(t.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isFavorite && (
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          <div className="font-medium text-sm truncate text-foreground">
                            {t.title}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {disc}
                        </div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1.5 py-0 h-5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {t.tags.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0 h-5"
                              >
                                +{t.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>
                            {t.msgs.length}{" "}
                            {t.msgs.length === 1 ? "mensagem" : "mensagens"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(t.updatedAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                      <TooltipProvider>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(t.id);
                                }}
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    isFavorite
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isFavorite
                                  ? "Remover dos favoritos"
                                  : "Adicionar aos favoritos"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTagsDialog(t.id);
                                }}
                              >
                                <Tags className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Gerenciar tags</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportThread(t);
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Exportar conversa</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeThread(t.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir conversa</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="border-t border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground backdrop-blur-sm">
          <p className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Dica: Use{" "}
            <kbd className="rounded border px-1 bg-background">Shift</kbd>+
            <kbd className="rounded border px-1 bg-background">Enter</kbd> para
            quebrar linha
          </p>
        </div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 shadow-xl backdrop-blur-md dark:border-white/5 dark:bg-card/35">
        {/* Header com modos */}
        <div className="border-b border-border/50 bg-gradient-to-r from-muted/40 via-transparent to-primary/[0.04] dark:from-muted/15">
          <div className="flex flex-col gap-3 border-b border-border/40 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-2 ring-white/10"
                  style={{
                    background: `linear-gradient(145deg, ${corDisciplina}35, ${corDisciplina}12)`,
                    boxShadow: `0 8px 24px -8px ${corDisciplina}55`,
                  }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: corDisciplina }} />
                </div>
                <div className="min-w-0">
                  <h1
                    className="truncate text-lg font-semibold tracking-tight sm:text-xl"
                    style={{ color: corDisciplina }}
                  >
                    {disciplinaAtual?.nome || "Chat IA"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Contexto: suas anotações desta disciplina
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {disciplinaAtual && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-6 px-2 text-xs"
                        >
                          <Link
                            href={`/disciplinas/${disciplinaAtual.id}`}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            Ver/Editar Anotações
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          As anotações que você cria na página da disciplina são
                          usadas automaticamente como contexto para a IA
                          responder suas perguntas
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-2">
              {current && modoAtual === "chat" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleShareThread}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Compartilhar conversa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (current) {
                              setNoteTitle(current.title);
                              setShowSaveAsNoteDialog(true);
                            }
                          }}
                          disabled={!current || currentMsgs.length === 0}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Salvar conversa como anotação</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (current) {
                              openTagsDialog(current.id);
                            }
                          }}
                          disabled={!current}
                        >
                          <Tags className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Gerenciar tags da conversa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => exportToMarkdown()}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar para Markdown</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => exportThread(current)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar conversa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={clearCurrent}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Limpar conversa</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <Link href="/disciplinas">
                        <BookOpen className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ir para Disciplinas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Modos — pílulas estilo hub */}
          <div className="px-3 pb-3 pt-1 sm:px-4">
            <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/50 bg-muted/30 p-1.5 dark:bg-muted/15">
              {MODOS.map((modo) => {
                const Icon = modo.icon;
                const isActive = modoAtual === modo.id;
                return (
                  <button
                    key={modo.id}
                    type="button"
                    title={modo.desc}
                    onClick={() => setModoAtual(modo.id as any)}
                    className={cn(
                      "flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:min-w-0 sm:flex-1 sm:text-sm",
                      isActive
                        ? "bg-background text-foreground shadow-md ring-1 ring-border/80 dark:bg-background/95"
                        : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                    )}
                    style={
                      isActive
                        ? {
                            boxShadow: `0 1px 0 0 ${corDisciplina}40, 0 8px 24px -12px ${corDisciplina}66`,
                          }
                        : undefined
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{modo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Área de conteúdo baseada no modo */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-background/50 to-muted/15 p-4 sm:p-6 md:p-8">
          {!disciplinasAtivas || disciplinasAtivas.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
              <div className="max-w-md rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Nenhuma disciplina cadastrada
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Cadastre uma disciplina para usar o chat e as ferramentas de IA.
                </p>
                <Button asChild className="rounded-full shadow-md">
                  <Link href="/disciplinas">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar disciplina
                  </Link>
                </Button>
              </div>
            </div>
          ) : modoAtual === "chat" ? (
            currentMsgs.length === 0 ? (
              <div className="flex min-h-[min(70vh,36rem)] flex-col items-center justify-center px-2 text-center">
                <div className="w-full max-w-lg">
                  <div
                    className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg ring-2 ring-white/10"
                    style={{
                      background: `linear-gradient(160deg, ${corDisciplina}45, ${corDisciplina}15)`,
                      boxShadow: `0 20px 40px -20px ${corDisciplina}88`,
                    }}
                  >
                    <Sparkles className="h-10 w-10 text-white drop-shadow" />
                  </div>
                  <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Como posso ajudar hoje?
                  </h2>
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Pergunte sobre{" "}
                    <span className="font-medium text-foreground" style={{ color: corDisciplina }}>
                      {disciplinaAtual?.nome}
                    </span>{" "}
                    — as respostas usam o que você escreveu nas anotações da disciplina.
                  </p>
                  <div
                    className="mb-6 rounded-2xl border border-border/60 bg-card/80 p-4 text-left shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/40"
                    style={{
                      borderColor: `${corDisciplina}35`,
                      background: `linear-gradient(135deg, ${corDisciplina}12, transparent)`,
                    }}
                  >
                    <div className="flex gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0" style={{ color: corDisciplina }} />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-foreground">Como funcionam as anotações?</p>
                        <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          <li>Crie e edite notas na página da disciplina.</li>
                          <li>A IA usa esse conteúdo como contexto automaticamente.</li>
                          <li>Quanto mais você anotar, melhores tendem a ser as respostas.</li>
                        </ul>
                        {disciplinaAtual && (
                          <Button variant="secondary" size="sm" className="mt-2 rounded-full" asChild>
                            <Link href={`/disciplinas/${disciplinaAtual.id}`} className="gap-1.5">
                              <FileText className="h-3.5 w-3.5" />
                              Ir para anotações
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Sugestões rápidas
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestions.slice(0, 4).map((sugestao, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              void send(sugestao);
                            }}
                            className="rounded-full border border-border/70 bg-background/90 px-3 py-2 text-left text-xs font-medium leading-snug text-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/50 sm:text-sm"
                            style={{ borderColor: `${corDisciplina}33` }}
                          >
                            {sugestao}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => setShowNewThreadDialog(true)}
                    className="rounded-full px-6 shadow-md"
                    style={{ backgroundColor: corDisciplina, borderColor: corDisciplina }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova conversa
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {currentMsgs.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                        style={{
                          backgroundColor: `${corDisciplina}20`,
                          border: `2px solid ${corDisciplina}40`,
                        }}
                      >
                        <Sparkles
                          className="h-4 w-4"
                          style={{ color: corDisciplina }}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[75%]">
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border bg-muted/90 text-foreground backdrop-blur-sm dark:bg-muted/50"
                        }`}
                        style={
                          m.role === "assistant"
                            ? {
                                borderLeftColor: corDisciplina,
                                borderLeftWidth: "3px",
                              }
                            : {}
                        }
                      >
                        <MessageRenderer
                          content={m.text}
                          isStreaming={loading && m.id === msgAsstId && !m.text}
                          onCopy={() => {
                            copyMessage(m.text);
                            toast.success("Mensagem copiada!");
                          }}
                        />
                        {/* Mostrar contexto usado se disponível */}
                        {m.role === "assistant" &&
                          m.text &&
                          m.anotacoesUsadas &&
                          m.anotacoesUsadas.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <button
                                onClick={() => {
                                  setContextInfo({
                                    anotacoes: m.anotacoesUsadas || [],
                                    avaliacoes: [],
                                  });
                                  setShowContextDialog(true);
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Ver contexto usado ({
                                  m.anotacoesUsadas.length
                                }{" "}
                                {m.anotacoesUsadas.length === 1
                                  ? "anotação"
                                  : "anotações"}
                                )
                              </button>
                            </div>
                          )}
                      </div>
                      {/* Botões de ação para mensagens do assistente */}
                      {m.role === "assistant" && m.text && (
                        <div className="flex items-center gap-1 px-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyMessage(m.text)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copiar mensagem</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={async () => {
                                    if (!current) return;
                                    const ultimaPergunta = currentMsgs
                                      .slice()
                                      .reverse()
                                      .find((msg) => msg.role === "user");
                                    if (ultimaPergunta) {
                                      setThreads((prev) =>
                                        prev.map((t) =>
                                          t.id === current.id
                                            ? {
                                                ...t,
                                                msgs: t.msgs.filter(
                                                  (msg) => msg.id !== m.id
                                                ),
                                                updatedAt: Date.now(),
                                              }
                                            : t
                                        )
                                      );
                                      setTimeout(() => {
                                        setInput(ultimaPergunta.text);
                                        setTimeout(() => {
                                          send();
                                        }, 100);
                                      }, 100);
                                      toast.info("Regenerando resposta...");
                                    }
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Regenerar resposta</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                        style={{
                          backgroundColor: `${corDisciplina}20`,
                          border: `2px solid ${corDisciplina}40`,
                        }}
                      >
                        <span
                          className="text-xs font-medium"
                          style={{ color: corDisciplina }}
                        >
                          U
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {/* Indicador de digitação */}
                {isTyping && !loading && (
                  <div className="flex justify-start gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                      style={{
                        backgroundColor: `${corDisciplina}20`,
                        border: `2px solid ${corDisciplina}40`,
                      }}
                    >
                      <Sparkles
                        className="h-4 w-4"
                        style={{ color: corDisciplina }}
                      />
                    </div>
                    <div className="bg-muted text-foreground border rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: corDisciplina,
                            animationDelay: "0ms",
                          }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: corDisciplina,
                            animationDelay: "150ms",
                          }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{
                            backgroundColor: corDisciplina,
                            animationDelay: "300ms",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Digitando...
                      </span>
                    </div>
                  </div>
                )}
                {/* Sugestões de perguntas */}
                {suggestions.length > 0 &&
                  currentMsgs.length > 0 &&
                  !loading &&
                  !isTyping && (
                    <div className="pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="h-3 w-3" />
                        Sugestões:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((sugestao, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              void send(sugestao);
                            }}
                            className="rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-left text-xs font-medium text-foreground shadow-sm transition hover:bg-muted/60"
                            style={{ borderColor: `${corDisciplina}40` }}
                          >
                            {sugestao}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                <div ref={bottomRef} />
              </div>
            )
          ) : modoAtual === "quiz" ? (
            <div className="mx-auto max-w-3xl space-y-6">
              {!quizData ? (
                <Card
                  className={cn(
                    "overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.08] via-card/90 to-card/70 p-6 shadow-xl backdrop-blur-sm",
                    "dark:from-emerald-500/15 dark:via-card/50 dark:to-card/40",
                  )}
                >
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-2 ring-emerald-500/20">
                        <Brain className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold tracking-tight">Quiz da disciplina</h3>
                      <p className="text-sm text-muted-foreground">
                        A IA vai gerar perguntas baseadas no conteúdo de{" "}
                        <b className="text-foreground">
                          {disciplinaAtual?.nome}
                        </b>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Tema específico (opcional)
                        </label>
                        <Input
                          value={quizConfig.tema}
                          onChange={(e) =>
                            setQuizConfig({
                              ...quizConfig,
                              tema: e.target.value,
                            })
                          }
                          placeholder="Ex: Funções, Derivadas, Integrais..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Quantidade de perguntas
                          </label>
                          <Select
                            value={String(quizConfig.quantidade)}
                            onValueChange={(v) =>
                              setQuizConfig({
                                ...quizConfig,
                                quantidade: Number(v),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 perguntas</SelectItem>
                              <SelectItem value="5">5 perguntas</SelectItem>
                              <SelectItem value="10">10 perguntas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Dificuldade
                          </label>
                          <Select
                            value={quizConfig.dificuldade}
                            onValueChange={(v) =>
                              setQuizConfig({ ...quizConfig, dificuldade: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="facil">Fácil</SelectItem>
                              <SelectItem value="medio">Médio</SelectItem>
                              <SelectItem value="dificil">Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={gerarQuiz}
                      disabled={quizLoading}
                      className="w-full rounded-xl shadow-md"
                      size="lg"
                    >
                      {quizLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando Quiz...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Gerar Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {quizData.titulo}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {quizData.perguntas.length} perguntas
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuizData(null);
                        setQuizRespostas({});
                        setQuizMostrarResultado(false);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Novo Quiz
                    </Button>
                  </div>

                  {quizData.perguntas.map((pergunta) => (
                    <Card
                      key={pergunta.numero}
                      className="rounded-2xl border-border/60 p-5 shadow-md backdrop-blur-sm dark:border-white/5"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {pergunta.numero}
                          </span>
                          <p className="text-base font-medium pt-0.5">
                            {pergunta.pergunta}
                          </p>
                        </div>

                        <div className="space-y-2 ml-10">
                          {Object.entries(pergunta.opcoes).map(
                            ([letra, texto]) => {
                              const selecionada =
                                quizRespostas[pergunta.numero] === letra;
                              const correta =
                                pergunta.resposta_correta === letra;
                              const mostrarCorreta =
                                quizMostrarResultado && correta;
                              const mostrarErrada =
                                quizMostrarResultado && selecionada && !correta;

                              return (
                                <button
                                  key={letra}
                                  onClick={() => {
                                    if (!quizMostrarResultado) {
                                      setQuizRespostas({
                                        ...quizRespostas,
                                        [pergunta.numero]: letra,
                                      });
                                    }
                                  }}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    mostrarCorreta
                                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                                      : mostrarErrada
                                      ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
                                      : selecionada
                                      ? "bg-primary/10 border-primary"
                                      : "hover:bg-muted/50 border-border"
                                  }`}
                                  disabled={quizMostrarResultado}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="h-6 w-6 rounded-full border flex items-center justify-center text-xs font-medium uppercase">
                                      {letra}
                                    </span>
                                    <span className="flex-1">{texto}</span>
                                    {mostrarCorreta && (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    )}
                                    {mostrarErrada && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>

                        {quizMostrarResultado && (
                          <div className="ml-10 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                            <p className="text-sm text-muted-foreground">
                              <b className="text-foreground">Explicação:</b>{" "}
                              {pergunta.explicacao}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {!quizMostrarResultado ? (
                    <Button
                      onClick={() => setQuizMostrarResultado(true)}
                      className="w-full"
                      size="lg"
                      disabled={
                        Object.keys(quizRespostas).length !==
                        quizData.perguntas.length
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ver Resultado
                    </Button>
                  ) : (
                    <Card className="p-6 bg-primary/5 border-primary/20">
                      <div className="text-center space-y-3">
                        <h4 className="text-lg font-semibold">
                          Resultado Final
                        </h4>
                        <div className="text-4xl font-bold text-primary">
                          {calcularPontuacaoQuiz().percentual}%
                        </div>
                        <p className="text-muted-foreground">
                          Você acertou{" "}
                          <b className="text-foreground">
                            {calcularPontuacaoQuiz().acertos}
                          </b>{" "}
                          de{" "}
                          <b className="text-foreground">
                            {calcularPontuacaoQuiz().total}
                          </b>{" "}
                          perguntas
                        </p>
                        <Button
                          onClick={() => {
                            setQuizData(null);
                            setQuizRespostas({});
                            setQuizMostrarResultado(false);
                          }}
                          variant="outline"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fazer outro Quiz
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : modoAtual === "explicacao" ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <Card
                className={cn(
                  "rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.09] via-card/90 to-card/70 p-6 shadow-xl backdrop-blur-sm",
                  "dark:from-amber-500/12 dark:via-card/50",
                )}
              >
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 ring-2 ring-amber-500/25">
                      <Lightbulb className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold tracking-tight">
                      Explicar conceito
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Digite um conceito e receba uma explicação detalhada com
                      exemplos práticos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Conceito que deseja entender
                      </label>
                      <Input
                        value={explicacaoConfig.conceito}
                        onChange={(e) =>
                          setExplicacaoConfig({
                            ...explicacaoConfig,
                            conceito: e.target.value,
                          })
                        }
                        placeholder="Ex: Recursão, Polimorfismo, Derivadas, etc."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Nível de detalhamento
                      </label>
                      <Select
                        value={explicacaoConfig.nivel}
                        onValueChange={(v) =>
                          setExplicacaoConfig({ ...explicacaoConfig, nivel: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">
                            Básico - Linguagem simples
                          </SelectItem>
                          <SelectItem value="intermediario">
                            Intermediário - Balance teoria e prática
                          </SelectItem>
                          <SelectItem value="avancado">
                            Avançado - Termos técnicos
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={explicarConceito}
                    disabled={
                      explicacaoLoading || !explicacaoConfig.conceito.trim()
                    }
                    className="w-full rounded-xl shadow-md"
                    size="lg"
                  >
                    {explicacaoLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando explicação...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Explicar
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {explicacaoTexto && (
                <Card className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg backdrop-blur-sm dark:border-white/5 dark:bg-card/50">
                  <MessageRenderer content={explicacaoTexto} />
                </Card>
              )}
            </div>
          ) : modoAtual === "mapa_mental" ? (
            <div className="mx-auto max-w-4xl space-y-6">
              {!mapaMentalData ? (
                <Card
                  className={cn(
                    "rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-500/[0.09] via-card/90 to-card/70 p-6 shadow-xl backdrop-blur-sm",
                    "dark:from-violet-500/12 dark:via-card/50",
                  )}
                >
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 ring-2 ring-violet-500/25">
                        <Network className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold tracking-tight">
                        Mapa mental
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Cole um texto, envie um PDF ou resuma um documento para
                        criar um mapa mental estruturado
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Título do mapa (opcional)
                        </label>
                        <Input
                          value={mapaConfig.titulo}
                          onChange={(e) =>
                            setMapaConfig({
                              ...mapaConfig,
                              titulo: e.target.value,
                            })
                          }
                          placeholder="Ex: Estruturas de Dados"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Texto para transformar
                        </label>
                        <textarea
                          value={mapaConfig.texto}
                          onChange={(e) =>
                            setMapaConfig({
                              ...mapaConfig,
                              texto: e.target.value,
                            })
                          }
                          placeholder="Cole aqui o texto das suas anotações, resumos ou envie um PDF abaixo..."
                          className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            ref={pdfInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                            id="mapa-pdf-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={pdfExtractLoading}
                          >
                            {pdfExtractLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Extraindo texto...
                              </>
                            ) : (
                              <>
                                <FileUp className="h-4 w-4 mr-2" />
                                Enviar PDF (.pdf)
                              </>
                            )}
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            ou cole o texto acima
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={gerarMapaMental}
                        disabled={mapaLoading || !mapaConfig.texto.trim()}
                        className="flex-1 rounded-xl shadow-md"
                        size="lg"
                      >
                        {mapaLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando mapa mental...
                          </>
                        ) : (
                          <>
                            <Network className="h-4 w-4 mr-2" />
                            Gerar Mapa Mental
                          </>
                        )}
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                carregarMapasSalvos();
                                setShowLoadMapaDialog(true);
                              }}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Carregar mapa mental salvo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {mapaMentalData.titulo}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {mapaMentalData.descricao}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setMapaTitleToSave(mapaMentalData.titulo);
                                setShowSaveMapaDialog(true);
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Salvar mapa mental</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                carregarMapasSalvos();
                                setShowLoadMapaDialog(true);
                              }}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Carregar mapa mental salvo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="outline"
                        onClick={() => setMapaMentalData(null)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Novo Mapa
                      </Button>
                    </div>
                  </div>

                  {/* Visualização do Mapa Mental */}
                  <Card className="p-6 overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Nó Central */}
                      <div className="flex justify-center mb-8">
                        <div
                          className="px-6 py-4 rounded-xl font-bold text-lg text-white shadow-lg"
                          style={{
                            backgroundColor: mapaMentalData.nocentral.cor,
                          }}
                        >
                          {mapaMentalData.nocentral.texto}
                        </div>
                      </div>

                      {/* Ramos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mapaMentalData.ramos.map((ramo) => (
                          <Card
                            key={ramo.id}
                            className="p-4 border-l-4"
                            style={{ borderLeftColor: ramo.cor }}
                          >
                            <div className="space-y-3">
                              <h4
                                className="font-semibold text-base"
                                style={{ color: ramo.cor }}
                              >
                                {ramo.texto}
                              </h4>
                              {ramo.subramos && ramo.subramos.length > 0 && (
                                <ul className="space-y-2">
                                  {ramo.subramos.map((sub) => (
                                    <li
                                      key={sub.id}
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      <ChevronRight
                                        className="h-4 w-4 mt-0.5 shrink-0"
                                        style={{ color: ramo.cor }}
                                      />
                                      <div>
                                        <span className="font-medium">
                                          {sub.texto}
                                        </span>
                                        {sub.detalhes && (
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {sub.detalhes}
                                          </p>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Resumo */}
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h5 className="font-medium mb-1">Resumo</h5>
                        <p className="text-sm text-muted-foreground">
                          {mapaMentalData.resumo}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : null}
        </div>
        {/* Input de chat - só aparece no modo chat */}
        {modoAtual === "chat" && (
          <div className="border-t border-border/50 bg-card/40 p-3 backdrop-blur-lg dark:bg-card/25 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="mx-auto max-w-4xl"
            >
              <div
                className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background/95 p-2 shadow-inner dark:border-white/10 dark:bg-background/80 sm:gap-3 sm:p-3"
                style={{ boxShadow: `0 0 0 1px ${corDisciplina}18 inset` }}
              >
                <div className="relative min-w-0 flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (inputRef.current) {
                        inputRef.current.style.height = "auto";
                        inputRef.current.style.height = `${Math.min(
                          inputRef.current.scrollHeight,
                          200
                        )}px`;
                      }
                    }}
                    className="max-h-[200px] min-h-[52px] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!loading && input.trim()) {
                          send();
                        }
                      }
                    }}
                    disabled={
                      loading || !disciplinasAtivas || disciplinasAtivas.length === 0
                    }
                    placeholder={
                      !disciplinasAtivas || disciplinasAtivas.length === 0
                        ? "Cadastre uma disciplina para usar o chat..."
                        : "Pergunte algo sobre a disciplina... (Shift+Enter para nova linha)"
                    }
                    rows={1}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !input.trim() ||
                    !disciplinasAtivas ||
                    disciplinasAtivas.length === 0
                  }
                  size="lg"
                  className="h-11 w-11 shrink-0 rounded-xl p-0 shadow-md sm:h-12 sm:w-12"
                  style={{
                    backgroundColor: corDisciplina,
                    borderColor: corDisciplina,
                  }}
                  title={
                    !disciplinasAtivas || disciplinasAtivas.length === 0
                      ? "Cadastre uma disciplina para usar o chat"
                      : undefined
                  }
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {streamErr && (
                <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/20 p-2">
                  <p className="text-xs text-destructive">{streamErr}</p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                As respostas usam suas notas da disciplina selecionada
              </p>
            </form>
          </div>
        )}

        {/* Erro global para outros modos */}
        {streamErr && modoAtual !== "chat" && (
          <div className="border-t p-4 bg-muted/30">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2">
                <p className="text-xs text-destructive">{streamErr}</p>
              </div>
            </div>
          </div>
        )}
      </section>
      {}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Disciplina
              </label>
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinasAtivas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewThreadDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={newThread}>Criar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog de Compartilhamento */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Conversa</DialogTitle>
            <DialogDescription>
              Copie o link abaixo para compartilhar esta conversa com outros
              usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyShareLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportToMarkdown()}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Markdown
              </Button>
              <Button
                variant="outline"
                onClick={() => exportThread(current!)}
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Contexto */}
      <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contexto Usado na Resposta</DialogTitle>
            <DialogDescription>
              Estas são as anotações que foram utilizadas para gerar a resposta
              da IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {contextInfo?.anotacoes && contextInfo.anotacoes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Anotações utilizadas:</h4>
                <ul className="space-y-2">
                  {contextInfo.anotacoes.map((anotacao, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-muted text-sm border"
                    >
                      {anotacao}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma informação de contexto disponível.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContextDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Limpar Conversa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja limpar todas as mensagens da conversa{" "}
              <span className="font-semibold text-foreground">
                {current?.title}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-destructive/10 border-destructive/30 p-4 text-sm">
              <p className="text-destructive font-medium">
                ⚠️ Atenção: Esta ação é irreversível!
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>Todas as mensagens serão removidas permanentemente</li>
                <li>O histórico da conversa será apagado</li>
                <li>Não será possível recuperar essas mensagens</li>
                <li>A conversa continuará existindo, mas vazia</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Compartilhamento */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartilhar Conversa</DialogTitle>
            <DialogDescription>
              Copie o link abaixo para compartilhar esta conversa com outros
              usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyShareLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportToMarkdown()}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Markdown
              </Button>
              <Button
                variant="outline"
                onClick={() => exportThread(current!)}
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Contexto */}
      <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contexto Usado na Resposta</DialogTitle>
            <DialogDescription>
              Estas são as anotações que foram utilizadas para gerar a resposta
              da IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {contextInfo?.anotacoes && contextInfo.anotacoes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Anotações utilizadas:</h4>
                <ul className="space-y-2">
                  {contextInfo.anotacoes.map((anotacao, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-lg bg-muted text-sm border"
                    >
                      {anotacao}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma informação de contexto disponível.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContextDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {}
      <Dialog
        open={!!threadToDelete}
        onOpenChange={(open) => !open && setThreadToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Conversa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conversa{" "}
              <span className="font-semibold text-foreground">
                {threads.find((t) => t.id === threadToDelete)?.title}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-destructive/10 border-destructive/30 p-4 text-sm">
              <p className="text-destructive font-medium">
                ⚠️ Atenção: Esta ação é irreversível!
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>A conversa será excluída permanentemente</li>
                <li>Todas as mensagens serão removidas</li>
                <li>O histórico completo será apagado</li>
                <li>Não será possível recuperar esses dados</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThreadToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteThread}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Salvar como Nota */}
      <Dialog open={showSaveAsNoteDialog} onOpenChange={setShowSaveAsNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Conversa como Anotação</DialogTitle>
            <DialogDescription>
              Crie uma anotação a partir desta conversa para acessá-la facilmente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Título da Anotação
              </label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Ex: Resumo sobre Recursão"
              />
            </div>
            {current && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Disciplina:</strong> {disciplinaAtual?.nome || "N/A"}
                </p>
                <p>
                  <strong>Mensagens:</strong> {currentMsgs.length}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveAsNoteDialog(false);
                setNoteTitle("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAsNote}
              disabled={!noteTitle.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Tags */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
            <DialogDescription>
              Adicione tags para organizar e encontrar suas conversas facilmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Adicionar Tag
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button onClick={addTag} disabled={!newTag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tags Disponíveis
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !threadTags.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          if (!threadTags.includes(tag)) {
                            setThreadTags([...threadTags, tag]);
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
            {threadTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tags da Conversa
                </label>
                <div className="flex flex-wrap gap-2">
                  {threadTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTagsDialog(false);
                setNewTag("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={saveTags}>
              <Tag className="h-4 w-4 mr-2" />
              Salvar Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Salvar Mapa Mental */}
      <Dialog open={showSaveMapaDialog} onOpenChange={setShowSaveMapaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Mapa Mental</DialogTitle>
            <DialogDescription>
              Salve este mapa mental como material para acessá-lo facilmente depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Título do Mapa Mental
              </label>
              <Input
                value={mapaTitleToSave}
                onChange={(e) => setMapaTitleToSave(e.target.value)}
                placeholder="Ex: Estruturas de Dados - Mapa Mental"
              />
            </div>
            {mapaMentalData && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Descrição:</strong> {mapaMentalData.descricao || mapaMentalData.resumo}
                </p>
                <p>
                  <strong>Ramos:</strong> {mapaMentalData.ramos.length}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveMapaDialog(false);
                setMapaTitleToSave("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarMapaMental}
              disabled={!mapaTitleToSave.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de Carregar Mapa Mental */}
      <Dialog open={showLoadMapaDialog} onOpenChange={setShowLoadMapaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregar Mapa Mental Salvo</DialogTitle>
            <DialogDescription>
              Selecione um mapa mental salvo para carregar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loadingMapasSalvos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : mapasSalvos.length === 0 ? (
              <div className="text-center py-8">
                <Network className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Nenhum mapa mental salvo encontrado.
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {mapasSalvos.map((material) => (
                  <Card
                    key={material.id}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => carregarMapaMental(material)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">
                          {material.titulo}
                        </h4>
                        {material.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {material.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(material.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {material.tags && material.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex flex-wrap gap-1">
                                {material.tags.slice(0, 3).map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0 h-4"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLoadMapaDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
