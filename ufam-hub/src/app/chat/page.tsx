"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
type Msg = { id: string; role: "user" | "assistant"; text: string; ts: number };
type Thread = {
  id: string;
  disciplinaId: string;
  title: string;
  msgs: Msg[];
  createdAt: number;
  updatedAt: number;
  favorited?: boolean;
};
const storeKey = "chatThreads:v1";
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
        {}
        <div className="flex items-center justify-between border-b p-5 bg-muted/30">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-foreground" />
              <h1 className="font-semibold truncate text-foreground">
                {disciplinaAtual?.nome || "Chat IA"}
              </h1>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Contexto: suas anotações dessa disciplina
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {current && (
              <>
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
        {}
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
          ) : currentMsgs.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Comece uma conversa
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Faça perguntas sobre{" "}
                  <b className="text-foreground">{disciplinaAtual?.nome}</b> e
                  receba respostas baseadas nas suas anotações.
                </p>
                <Button
                  onClick={() => setShowNewThreadDialog(true)}
                  variant="outline"
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
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground border"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {m.text || (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Pensando...
                        </span>
                      )}
                    </div>
                  </div>
                  {m.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        U
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        {}
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
                  className="w-full min-h-[100px] max-h-[200px] rounded-lg border bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={loading || !disciplinas || disciplinas.length === 0}
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
      {}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar Conversa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja limpar todas as mensagens desta conversa?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmClear}>
              Limpar
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
            <DialogTitle>Excluir Conversa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conversa? Todas as mensagens
              serão perdidas e esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThreadToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteThread}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}