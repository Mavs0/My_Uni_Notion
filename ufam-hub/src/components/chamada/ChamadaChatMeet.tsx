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
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 dark:bg-emerald-500/20">
          <svg
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Chat do grupo
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Mensagens visíveis para todos na chamada
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-3"
      >
        {chatMessages.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg
                className="h-6 w-6 text-slate-500 dark:text-slate-400"
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
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Nenhuma mensagem ainda
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
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
                        isLocal ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300",
                      )}
                    >
                      {isLocal ? "Você" : name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {time}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    isLocal
                      ? "rounded-br-md bg-emerald-600 text-white dark:bg-emerald-600"
                      : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
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
        className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800"
          title="Anexar"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva uma mensagem…"
          disabled={isSending}
          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isSending}
          className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}
