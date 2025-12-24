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
  Zap,
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
  const { disciplinas, loading: loadingDisc } = useDisciplinas();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<string>(
    disciplinas[0]?.id || ""
  );
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const raw = localStorage.getItem(storeKey);
    if (raw) {
      const data: Thread[] = JSON.parse(raw);
      setThreads(data);
      if (data[0]) setCurrentId(data[0].id);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify(threads));
  }, [threads]);
  const current = useMemo(
    () => threads.find((t) => t.id === currentId) || null,
    [threads, currentId]
  );
  const currentMsgs = current?.msgs ?? [];
  function newThread() {
    if (!disciplinas || disciplinas.length === 0) {
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
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.msgs.some((m) => m.text.toLowerCase().includes(query))
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return b.updatedAt - a.updatedAt;
      } else if (sortBy === "oldest") {
        return a.updatedAt - b.updatedAt;
      } else {
        return a.title.localeCompare(b.title, "pt-BR");
      }
    });
    filtered.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      return 0;
    });
    return filtered;
  }, [threads, filterFavorites, searchQuery, sortBy]);
  async function send() {
    if (!input.trim()) return;
    if (!disciplinas || disciplinas.length === 0) {
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
      text: input,
      ts: Date.now(),
    };
    setInput("");
    setThreads((prev) =>
      prev.map((t) =>
        t.id === tId
          ? { ...t, msgs: [...t.msgs, msgUser], updatedAt: Date.now() }
          : t
      )
    );
    const msgAsstId = `m_${Date.now()}_a`;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === tId
          ? {
              ...t,
              msgs: [
                ...t.msgs,
                { id: msgAsstId, role: "assistant", text: "", ts: Date.now() },
              ],
              updatedAt: Date.now(),
            }
          : t
      )
    );
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          disciplinaId: current?.disciplinaId ?? disciplinaId,
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
      console.log("📊 Response status:", res.status);
      console.log("📊 Response ok:", res.ok);
      console.log(
        "📊 Response headers:",
        Object.fromEntries(res.headers.entries())
      );
      console.log("📊 Response body:", res.body ? "presente" : "ausente");
      if (!res.body) {
        console.error("❌ Response não tem body!");
        const errorText = await res
          .text()
          .catch(() => "Não foi possível ler o erro");
        console.error("❌ Response text:", errorText);
        throw new Error("Resposta da API não contém dados");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let chunkCount = 0;
      let hasReceivedData = false;
      console.log("📡 Iniciando leitura do stream...");
      const timeout = setTimeout(() => {
        console.error("⏱️ Timeout: nenhum dado recebido após 30 segundos");
        reader.cancel();
      }, 30000);
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            clearTimeout(timeout);
            console.log(
              `✅ Stream finalizado. Total de chunks: ${chunkCount}, Texto acumulado: ${acc.length} caracteres, Dados recebidos: ${hasReceivedData}`
            );
            break;
          }
          if (value && value.length > 0) {
            hasReceivedData = true;
            clearTimeout(timeout);
          }
          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          if (chunkCount <= 5 || chunkCount % 10 === 0) {
            console.log(
              `📦 Chunk ${chunkCount} recebido (${chunk.length} chars, ${value.length} bytes raw):`,
              chunk.substring(0, 200).replace(/\n/g, "\\n")
            );
          }
          if (chunk && chunk.length > 0) {
            acc += chunk;
            setIsTyping(true);
            setThreads((prev) =>
              prev.map((t) =>
                t.id === (current?.id ?? tId)
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
        if (!acc.trim()) {
          clearTimeout(timeout);
          console.error("❌ Stream vazio recebido após processamento");
          console.error("Chunks recebidos:", chunkCount);
          console.error("Dados recebidos:", hasReceivedData);
          throw new Error(
            "Resposta vazia da API - verifique se a API de IA está configurada corretamente"
          );
        }
        clearTimeout(timeout);
        setIsTyping(false);
        // Sugestões serão atualizadas automaticamente pelo useEffect quando currentMsgs mudar
        console.log(
          "✅ Stream processado com sucesso. Texto final:",
          acc.substring(0, 100) + "..."
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
          t.id === (current?.id ?? tId)
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
              }
            : t
        )
      );
    } finally {
      setLoading(false);
      setIsTyping(false);
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
      prev.map((t) => (t.id === current.id ? { ...t, msgs: [] } : t))
    );
    setShowClearDialog(false);
  }
  const disciplinaAtual = disciplinas.find(
    (d) => d.id === (current?.disciplinaId ?? disciplinaId)
  );
  const corDisciplina = disciplinaAtual?.cor || "#6366f1";

  // Atualizar sugestões quando necessário
  useEffect(() => {
    if (modoAtual !== "chat" || !disciplinaAtual) {
      setSuggestions([]);
      return;
    }

    const sugestoesGerais = [
      `Explique os principais conceitos de ${disciplinaAtual.nome}`,
      `Quais são os tópicos mais importantes de ${disciplinaAtual.nome}?`,
      `Resuma o conteúdo de ${disciplinaAtual.nome}`,
      `Quais são as aplicações práticas de ${disciplinaAtual.nome}?`,
    ];

    // Se há mensagens recentes, gerar sugestões baseadas nelas
    if (currentMsgs.length > 0) {
      const ultimaMsg = currentMsgs[currentMsgs.length - 1];
      if (ultimaMsg.role === "assistant") {
        sugestoesGerais.push(
          "Explique mais sobre isso",
          "Dê exemplos práticos",
          "Como isso se relaciona com outros conceitos?",
          "Quais são os pontos-chave para lembrar?"
        );
      }
    }

    setSuggestions(sugestoesGerais.slice(0, 4));
  }, [
    modoAtual,
    disciplinaAtual?.id,
    disciplinaAtual?.nome,
    currentMsgs.length,
  ]);

  // Compartilhar conversa
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

  // Copiar link de compartilhamento
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShowShareDialog(false);
    // Mostrar toast de sucesso (se disponível)
  };

  // Exportar para Markdown
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

  // Copiar mensagem
  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Funções para os novos modos
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
        body: JSON.stringify({
          disciplinaId,
          tema: quizConfig.tema,
          quantidade: quizConfig.quantidade,
          dificuldade: quizConfig.dificuldade,
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar quiz");
      const data = await res.json();
      if (data.quiz) {
        setQuizData(data.quiz);
      } else {
        throw new Error(data.error || "Erro ao processar quiz");
      }
    } catch (error: any) {
      setStreamErr(error.message);
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
        body: JSON.stringify({
          conceito: explicacaoConfig.conceito,
          disciplinaId,
          nivel: explicacaoConfig.nivel,
        }),
      });
      if (!res.ok) throw new Error("Erro ao explicar conceito");
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

  const gerarMapaMental = async () => {
    if (!mapaConfig.texto.trim()) {
      setStreamErr("Cole o texto que deseja transformar em mapa mental");
      return;
    }
    setMapaLoading(true);
    setMapaMentalData(null);
    try {
      const res = await fetch("/api/ai/mapa-mental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: mapaConfig.texto,
          titulo: mapaConfig.titulo,
          disciplinaId,
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar mapa mental");
      const data = await res.json();
      if (data.mapaMental) {
        setMapaMentalData(data.mapaMental);
      } else {
        throw new Error(data.error || "Erro ao processar mapa mental");
      }
    } catch (error: any) {
      setStreamErr(error.message);
    } finally {
      setMapaLoading(false);
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
    <div className="flex h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)] gap-4">
      {}
      <aside className="hidden w-80 shrink-0 lg:flex lg:flex-col border rounded-lg bg-card shadow-sm">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
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
              value={disciplinaId || undefined}
              onValueChange={setDisciplinaId}
              disabled={!disciplinas || disciplinas.length === 0}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {!disciplinas || disciplinas.length === 0 ? (
                  <SelectItem value="__disabled__" disabled>
                    Nenhuma disciplina cadastrada
                  </SelectItem>
                ) : (
                  disciplinas.map((d) => (
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
                    disabled={!disciplinas || disciplinas.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!disciplinas || disciplinas.length === 0
                      ? "Cadastre uma disciplina primeiro"
                      : "Nova conversa"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {}
        <div className="border-b p-3 space-y-2 bg-muted/30">
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
        <div className="border-t p-3 text-xs text-muted-foreground bg-muted/30">
          <p className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Dica: Use{" "}
            <kbd className="rounded border px-1 bg-background">Shift</kbd>+
            <kbd className="rounded border px-1 bg-background">Enter</kbd> para
            quebrar linha
          </p>
        </div>
      </aside>
      {}
      <section className="flex min-w-0 flex-1 flex-col rounded-lg border bg-card shadow-sm">
        {/* Header com modos */}
        <div className="border-b bg-muted/30">
          <div
            className="flex items-center justify-between p-4 pb-0 border-b-2"
            style={{ borderBottomColor: `${corDisciplina}40` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${corDisciplina}20`,
                    border: `2px solid ${corDisciplina}40`,
                  }}
                >
                  <BookOpen
                    className="h-5 w-5"
                    style={{ color: corDisciplina }}
                  />
                </div>
                <h1
                  className="font-semibold truncate"
                  style={{ color: corDisciplina }}
                >
                  {disciplinaAtual?.nome || "Chat IA"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  Contexto: suas anotações dessa disciplina
                </div>
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
            <div className="flex items-center gap-2 ml-4">
              {current && modoAtual === "chat" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShareThread}
                          title="Compartilhar conversa"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Compartilhar conversa</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToMarkdown()}
                          title="Exportar para Markdown"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar para Markdown</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportThread(current)}
                    title="Exportar conversa"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearCurrent}>
                    Limpar
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/disciplinas">Disciplinas</Link>
              </Button>
            </div>
          </div>

          {/* Tabs de modos */}
          <div className="px-4 pt-3">
            <div className="flex gap-1 overflow-x-auto pb-0">
              {MODOS.map((modo) => {
                const Icon = modo.icon;
                const isActive = modoAtual === modo.id;
                return (
                  <button
                    key={modo.id}
                    onClick={() => setModoAtual(modo.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-background text-foreground border border-b-0"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {modo.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Área de conteúdo baseada no modo */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {!disciplinas || disciplinas.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Nenhuma disciplina cadastrada
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Você precisa cadastrar pelo menos uma disciplina para usar o
                  chat de IA.
                </p>
                <Button asChild variant="default">
                  <Link href="/disciplinas">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Disciplina
                  </Link>
                </Button>
              </div>
            </div>
          ) : modoAtual === "chat" ? (
            /* MODO CHAT */
            currentMsgs.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div className="max-w-md">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      backgroundColor: `${corDisciplina}20`,
                      border: `3px solid ${corDisciplina}40`,
                    }}
                  >
                    <Sparkles
                      className="h-8 w-8"
                      style={{ color: corDisciplina }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Comece uma conversa
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça perguntas sobre{" "}
                    <b style={{ color: corDisciplina }}>
                      {disciplinaAtual?.nome}
                    </b>{" "}
                    e receba respostas baseadas nas suas anotações.
                  </p>
                  {/* Explicação sobre anotações */}
                  <div
                    className="mb-6 rounded-lg border p-4 text-sm"
                    style={{
                      backgroundColor: `${corDisciplina}10`,
                      borderColor: `${corDisciplina}30`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        className="h-5 w-5 shrink-0 mt-0.5"
                        style={{ color: corDisciplina }}
                      />
                      <div className="space-y-2">
                        <p
                          className="font-medium"
                          style={{ color: corDisciplina }}
                        >
                          Como funcionam as anotações?
                        </p>
                        <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
                          <li>
                            As anotações são criadas e editadas na página da
                            disciplina
                          </li>
                          <li>
                            A IA usa automaticamente suas anotações como
                            contexto para responder perguntas
                          </li>
                          <li>
                            Quanto mais anotações você tiver, mais precisas
                            serão as respostas
                          </li>
                        </ul>
                        {disciplinaAtual && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mt-2 h-7 text-xs"
                            style={{
                              borderColor: `${corDisciplina}40`,
                            }}
                          >
                            <Link
                              href={`/disciplinas/${disciplinaAtual.id}`}
                              className="flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Ir para Anotações
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Sugestões iniciais */}
                  {suggestions.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 justify-center">
                        <Zap className="h-3 w-3" />
                        Sugestões de perguntas:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {suggestions.slice(0, 3).map((sugestao, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInput(sugestao);
                              inputRef.current?.focus();
                            }}
                            className="text-xs h-8"
                            style={{
                              borderColor: `${corDisciplina}40`,
                              color: corDisciplina,
                            }}
                          >
                            {sugestao}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => setShowNewThreadDialog(true)}
                    variant="outline"
                    style={{
                      borderColor: `${corDisciplina}40`,
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conversa
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
                        className={`rounded-lg px-4 py-3 shadow-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground border"
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
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {m.text || (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Pensando...
                            </span>
                          )}
                        </div>
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
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInput(sugestao);
                              inputRef.current?.focus();
                            }}
                            className="text-xs h-8"
                            style={{
                              borderColor: `${corDisciplina}40`,
                              color: corDisciplina,
                            }}
                          >
                            {sugestao}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                <div ref={bottomRef} />
              </div>
            )
          ) : modoAtual === "quiz" ? (
            /* MODO QUIZ */
            <div className="max-w-3xl mx-auto space-y-6">
              {!quizData ? (
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Modo Quiz</h3>
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
                      className="w-full"
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
                    <Card key={pergunta.numero} className="p-5">
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
            /* MODO EXPLICAÇÃO */
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Explicar Conceito
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
                    className="w-full"
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
                <Card className="p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{explicacaoTexto}</div>
                  </div>
                </Card>
              )}
            </div>
          ) : modoAtual === "mapa_mental" ? (
            /* MODO MAPA MENTAL */
            <div className="max-w-4xl mx-auto space-y-6">
              {!mapaMentalData ? (
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                        <Network className="h-8 w-8 text-violet-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Mapa Mental
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Cole um texto e a IA transformará em um mapa mental
                        estruturado
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
                          placeholder="Cole aqui o texto das suas anotações, resumos ou qualquer conteúdo que deseja organizar..."
                          className="w-full min-h-[200px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={gerarMapaMental}
                      disabled={mapaLoading || !mapaConfig.texto.trim()}
                      className="w-full"
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
                    <Button
                      variant="outline"
                      onClick={() => setMapaMentalData(null)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Novo Mapa
                    </Button>
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
          <div className="border-t p-4 bg-muted/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="mx-auto max-w-4xl"
            >
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full min-h-[100px] max-h-[200px] rounded-lg border bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 transition-all"
                    style={{
                      borderColor: `${corDisciplina}30`,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={
                      loading || !disciplinas || disciplinas.length === 0
                    }
                    placeholder={
                      !disciplinas || disciplinas.length === 0
                        ? "Cadastre uma disciplina para usar o chat..."
                        : "Pergunte algo sobre a disciplina..."
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !input.trim() ||
                    !disciplinas ||
                    disciplinas.length === 0
                  }
                  size="lg"
                  className="shrink-0"
                  style={{
                    backgroundColor: corDisciplina,
                    borderColor: corDisciplina,
                  }}
                  title={
                    !disciplinas || disciplinas.length === 0
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
        <DialogContent>
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
                  {disciplinas.map((d) => (
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
    </div>
  );
}
