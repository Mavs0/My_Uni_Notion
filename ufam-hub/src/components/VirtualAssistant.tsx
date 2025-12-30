"use client";
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Calendar,
  BookOpen,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}
interface QuickAction {
  label: string;
  action: string;
  icon?: React.ReactNode;
}
const QUICK_QUESTIONS = [
  "Quais provas tenho hoje?",
  "Resuma minhas avaliações da semana",
  "Quantas disciplinas estou cursando?",
  "O que tenho agendado para amanhã?",
];
export function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Limpar mensagens quando fecha e quando abre novamente
  useEffect(() => {
    if (!isOpen) {
      // Limpar mensagens quando fecha
      setMessages([]);
      setQuickActions([]);
    } else {
      // Garantir que está limpo quando abre
      setMessages([]);
      setQuickActions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const extractQuickActions = (text: string) => {
    const actions: QuickAction[] = [];
    const lowerText = text.toLowerCase();

    // Detectar menções a avaliações/provas
    if (
      lowerText.includes("avaliação") ||
      lowerText.includes("prova") ||
      lowerText.includes("trabalho")
    ) {
      actions.push({
        label: "Ver Avaliações",
        action: "Ver minhas avaliações",
        icon: <Calendar className="h-4 w-4" />,
      });
    }

    // Detectar menções a disciplinas
    if (lowerText.includes("disciplina") || lowerText.includes("matéria")) {
      actions.push({
        label: "Ver Disciplinas",
        action: "Listar minhas disciplinas",
        icon: <BookOpen className="h-4 w-4" />,
      });
    }

    // Detectar menções a horários
    if (lowerText.includes("horário") || lowerText.includes("aula")) {
      actions.push({
        label: "Ver Horários",
        action: "Mostrar meus horários",
        icon: <Clock className="h-4 w-4" />,
      });
    }

    // Detectar menções a notas/anotações
    if (lowerText.includes("nota") || lowerText.includes("anotação")) {
      actions.push({
        label: "Ver Anotações",
        action: "Mostrar minhas anotações",
        icon: <FileText className="h-4 w-4" />,
      });
    }

    setQuickActions(actions);
  };
  // Função auxiliar para gerar IDs únicos
  const generateUniqueId = (prefix: string) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Função auxiliar para remover duplicatas de mensagens
  const removeDuplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      if (seen.has(msg.id)) {
        return false;
      }
      seen.add(msg.id);
      return true;
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMessage: Message = {
      id: generateUniqueId("msg_user"),
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      const uniquePrev = removeDuplicateMessages(prev);
      if (uniquePrev.some((m) => m.id === userMessage.id)) {
        return uniquePrev;
      }
      return [...uniquePrev, userMessage];
    });
    setInput("");
    setLoading(true);
    setIsTyping(true);
    setQuickActions([]); // Limpar ações anteriores
    const assistantMessageId = generateUniqueId("msg_assistant");
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      const uniquePrev = removeDuplicateMessages(prev);
      if (uniquePrev.some((m) => m.id === assistantMessageId)) {
        return uniquePrev;
      }
      return [...uniquePrev, assistantMessage];
    });
    try {
      const response = await fetch("/api/ai/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: text.trim(),
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Erro na API (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      if (!response.body) {
        throw new Error("Resposta da API não contém dados");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let hasContent = false;
      let chunkCount = 0;
      const maxChunks = 1000;
      const timeout = 60000;
      const startTime = Date.now();
      console.log("📡 [VA] Iniciando leitura do stream...");
      while (true) {
        if (Date.now() - startTime > timeout) {
          console.error("⏱️ [VA] Timeout ao ler stream após", timeout, "ms");
          throw new Error("Timeout: resposta demorou muito para chegar");
        }
        if (chunkCount >= maxChunks) {
          console.warn(
            "⚠️ [VA] Limite de chunks atingido, finalizando leitura"
          );
          break;
        }
        const { value, done } = await reader.read();
        if (done) {
          console.log(
            `✅ [VA] Stream finalizado (done = true). Total: ${chunkCount} chunks, ${accumulatedText.length} chars`
          );
          break;
        }
        if (!value || value.length === 0) {
          console.warn("⚠️ [VA] Chunk vazio recebido, continuando...");
          chunkCount++;
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        if (chunkCount <= 5 || chunkCount % 10 === 0) {
          console.log(
            `📦 [VA] Chunk ${chunkCount} recebido (${chunk.length} chars):`,
            chunk.substring(0, 100).replace(/\n/g, "\\n")
          );
        }
        if (chunk && chunk.length > 0) {
          accumulatedText += chunk;
          hasContent = true;
          setIsTyping(true);
          setMessages((prev) => {
            const uniquePrev = removeDuplicateMessages(prev);
            return uniquePrev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, text: accumulatedText }
                : msg
            );
          });
        }
      }
      console.log(
        `✅ [VA] Stream processado: ${chunkCount} chunks, ${accumulatedText.length} caracteres`
      );
      setIsTyping(false);
      // Extrair ações rápidas da resposta
      if (accumulatedText.trim()) {
        extractQuickActions(accumulatedText);
      }
      if (!hasContent || !accumulatedText.trim()) {
        console.error(
          "❌ [VA] Stream vazio recebido. Chunks:",
          chunkCount,
          "Text length:",
          accumulatedText.length,
          "Has content:",
          hasContent,
          "Text preview:",
          accumulatedText.substring(0, 200)
        );
        throw new Error(
          "Resposta vazia da API - nenhum conteúdo recebido do stream. Verifique se a API do Gemini está configurada corretamente e se o modelo 'gemini-pro' está disponível."
        );
      }
    } catch (error: any) {
      console.error("Erro no Virtual Assistant:", error);
      const errorMessage = error?.message || "Erro desconhecido";
      const errorText =
        errorMessage.includes("API") &&
        (errorMessage.includes("não configurada") ||
          errorMessage.includes("API key"))
          ? "❌ API de IA não configurada. Verifique as configurações."
          : errorMessage.includes("Não autorizado")
          ? "❌ Você precisa estar logado para usar o assistente."
          : errorMessage.includes("500")
          ? "❌ Problema no servidor. Verifique se a API de IA está configurada."
          : `❌ ${errorMessage}`;
      setMessages((prev) => {
        const uniquePrev = removeDuplicateMessages(prev);
        return uniquePrev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: errorText,
              }
            : msg
        );
      });
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Limpar mensagens imediatamente ao fechar
    setMessages([]);
    setQuickActions([]);
  };
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="flex flex-col h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl border-2">
        {}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Assistente Virtual
              </h3>
              <p className="text-xs text-muted-foreground">UFAM Hub IA</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <>
            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground font-medium mb-1">
                      Olá! Como posso ajudar?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Faça uma pergunta ou escolha uma opção rápida
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground px-2">
                      Perguntas rápidas:
                    </p>
                    {QUICK_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q)}
                        className="w-full text-left text-sm p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground border"
                        }`}
                      >
                        {msg.text || (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Pensando...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Indicador de digitação */}
                  {isTyping && !loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Digitando...
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Botões de ação rápida */}
                  {quickActions.length > 0 && !loading && !isTyping && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {quickActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.action)}
                          className="text-xs h-8"
                        >
                          {action.icon}
                          <span className="ml-1">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            {}
            <div className="p-4 border-t bg-muted/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
