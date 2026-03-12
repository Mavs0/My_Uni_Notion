"use client";

import * as React from "react";
import { useChat } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChamadaChatMeet() {
  const { chatMessages, send, isSending } = useChat();
  const [input, setInput] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    send(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card">
      {/* Header estilo Meet */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Mensagens</h2>
          <p className="text-xs text-muted-foreground">
            Envie uma mensagem para todos na chamada
          </p>
        </div>
      </div>

      {/* Lista de mensagens com scroll */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma mensagem ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seja o primeiro a enviar uma mensagem
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const isLocal = msg.from?.isLocal ?? false;
            const name = msg.from?.name ?? msg.from?.identity ?? "Participante";
            const time = new Date(msg.timestamp).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const hideName =
              idx > 0 &&
              chatMessages[idx - 1]?.from?.identity === msg.from?.identity &&
              msg.timestamp - (chatMessages[idx - 1]?.timestamp ?? 0) < 60_000;

            return (
              <div
                key={`${msg.timestamp}-${idx}`}
                className={cn("flex flex-col gap-0.5", isLocal && "items-end")}
              >
                {!hideName && (
                  <div className="flex items-center gap-2 px-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isLocal ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {isLocal ? "Você" : name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    isLocal
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input: "Digite algo..." com anexo e enviar (estilo anexos) */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 p-3 border-t border-border bg-background/50"
      >
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-lg" title="Anexar">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
        </Button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..."
          disabled={isSending}
          className="flex-1 min-w-0 h-10 px-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isSending}
          className="h-10 w-10 rounded-lg shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
