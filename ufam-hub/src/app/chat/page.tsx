"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/** Disciplinas mock – troque depois por Supabase */
const DISCIPLINAS = [
  { id: "d1", nome: "Fundamentos de IA" },
  { id: "d2", nome: "PW (Programação Web)" },
  { id: "d4", nome: "PAA" },
  { id: "d5", nome: "Álgebra II" },
  { id: "d3", nome: "Metodologia" },
  { id: "d6", nome: "Introd. Economia Política da Amazônia" },
] as const;

type Msg = { id: string; role: "user" | "assistant"; text: string; ts: number };
type Thread = {
  id: string;
  disciplinaId: string;
  title: string;
  msgs: Msg[];
  createdAt: number;
  updatedAt: number;
};

const storeKey = "chatThreads:v1";

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState<string>(
    DISCIPLINAS[0]?.id || ""
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // load/save localStorage
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
    const id = `t_${Date.now()}`;
    const disc = DISCIPLINAS.find((d) => d.id === disciplinaId);
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
  }

  function removeThread(id: string) {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (currentId === id)
      setCurrentId(threads.find((t) => t.id !== id)?.id ?? null);
  }

  async function send() {
    if (!input.trim()) return;
    setStreamErr(null);

    // cria thread se não houver
    let tId = currentId;
    if (!tId) {
      const id = `t_${Date.now()}`;
      const disc = DISCIPLINAS.find((d) => d.id === disciplinaId);
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

    // adiciona msg do user
    setThreads((prev) =>
      prev.map((t) =>
        t.id === tId
          ? { ...t, msgs: [...t.msgs, msgUser], updatedAt: Date.now() }
          : t
      )
    );

    // placeholder da resposta
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
        body: JSON.stringify({
          disciplinaId: current?.disciplinaId ?? disciplinaId,
          question: msgUser.text,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Falha na API (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        // atualiza texto stream
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

        // scroll para o fim
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e: any) {
      setStreamErr(e?.message || "Erro no streaming");
      // fallback curto
      setThreads((prev) =>
        prev.map((t) =>
          t.id === (current?.id ?? tId)
            ? {
                ...t,
                msgs: t.msgs.map((m) =>
                  m.id === msgAsstId
                    ? {
                        ...m,
                        text: "Não consegui responder agora. Tente novamente em instantes.",
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
    }
  }

  function clearCurrent() {
    if (!current) return;
    if (!confirm("Limpar mensagens desta conversa?")) return;
    setThreads((prev) =>
      prev.map((t) => (t.id === current.id ? { ...t, msgs: [] } : t))
    );
  }

  const disciplinaAtual = DISCIPLINAS.find(
    (d) => d.id === (current?.disciplinaId ?? disciplinaId)
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 border-r lg:flex lg:flex-col">
        <div className="flex items-center gap-2 p-3">
          <select
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            className="w-full rounded border bg-transparent px-2 py-1 text-sm"
            title="Disciplina para novas conversas"
          >
            {DISCIPLINAS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
          <button
            onClick={newThread}
            className="rounded border px-2 py-1 text-sm hover:bg-white/5"
          >
            + Nova
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <p className="p-3 text-sm text-zinc-500">Sem conversas ainda.</p>
          ) : (
            <ul className="p-2">
              {threads.map((t) => {
                const disc =
                  DISCIPLINAS.find((d) => d.id === t.disciplinaId)?.nome ??
                  "Disciplina";
                return (
                  <li
                    key={t.id}
                    className={`group mb-2 rounded border p-2 text-sm ${
                      t.id === currentId ? "bg-white/5" : ""
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setCurrentId(t.id)}
                    >
                      <div className="truncate font-medium">{t.title}</div>
                      <div className="truncate text-xs text-zinc-500">
                        {disc}
                      </div>
                    </button>
                    <div className="mt-1 hidden gap-2 group-hover:flex">
                      <button
                        onClick={() => removeThread(t.id)}
                        className="rounded border px-2 py-0.5 text-xs hover:bg-white/5"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t p-3 text-xs text-zinc-500">
          Dica: use <kbd className="rounded border px-1">Shift</kbd>+
          <kbd className="rounded border px-1">Enter</kbd> para quebrar linha.
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-zinc-500">
              Chat IA — {disciplinaAtual?.nome}
            </div>
            <div className="truncate text-xs text-zinc-500">
              Contexto: suas anotações dessa disciplina (quando plugar o
              Supabase).
            </div>
          </div>
          <div className="flex items-center gap-2">
            {current && (
              <button
                onClick={clearCurrent}
                className="rounded border px-2 py-1 text-xs hover:bg-white/5"
              >
                Limpar conversa
              </button>
            )}
            <Link
              href="/disciplinas"
              className="rounded border px-2 py-1 text-xs hover:bg-white/5"
            >
              Abrir disciplinas
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentMsgs.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-zinc-500">
              <div>
                <p>
                  Comece uma pergunta sobre <b>{disciplinaAtual?.nome}</b>.
                </p>
                <p className="mt-1">
                  Crie uma nova conversa na lateral ou mande sua primeira
                  mensagem abaixo.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMsgs.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-3xl whitespace-pre-wrap rounded border p-3 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-white/5"
                      : "mr-auto bg-transparent/5"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="mx-auto flex max-w-3xl flex-col gap-2"
          >
            {/* disciplina seletor (visível em telas pequenas) */}
            <div className="flex items-center gap-2 lg:hidden">
              <select
                value={disciplinaId}
                onChange={(e) => setDisciplinaId(e.target.value)}
                className="w-full rounded border bg-transparent px-2 py-1 text-sm"
                title="Disciplina para novas conversas"
              >
                {DISCIPLINAS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={newThread}
                className="rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                + Nova
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo…"
              className="min-h-[90px] w-full rounded border bg-transparent p-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                As respostas usam suas notas da disciplina (quando integradas).
              </span>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded border px-3 py-1 text-sm hover:bg-white/5 disabled:opacity-50"
              >
                {loading ? "Respondendo…" : "Enviar"}
              </button>
            </div>
            {streamErr && (
              <div className="text-xs text-red-400">{streamErr}</div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
