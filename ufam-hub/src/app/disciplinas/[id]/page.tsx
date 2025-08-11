"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/** ===== Tipos base ===== */
type TTipo = "obrigatoria" | "eletiva" | "optativa";
type Disciplina = {
  id: string;
  nome: string;
  tipo: TTipo;
  horasSemana: number;
  local?: string;
  horarios?: { dia: number; inicio: string; fim: string }[];
};
type AvaliacaoTipo = "prova" | "trabalho" | "seminario";
type Avaliacao = {
  id: string;
  disciplinaId: string;
  tipo: AvaliacaoTipo;
  dataISO: string;
  descricao?: string;
  resumo_assuntos?: string;
  gerado_por_ia?: boolean;
};
type Material = { id: string; titulo: string; url: string };

/** ===== Mock (mesmo conjunto usado na lista) ===== */
const DISCIPLINAS_MOCK: Disciplina[] = [
  {
    id: "d1",
    nome: "Fundamentos de IA",
    tipo: "optativa",
    horasSemana: 4,
    local: "Sala 05",
    horarios: [
      { dia: 1, inicio: "16:00", fim: "18:00" },
      { dia: 3, inicio: "16:00", fim: "18:00" },
    ],
  },
  {
    id: "d2",
    nome: "PW (Programação Web)",
    tipo: "eletiva",
    horasSemana: 4,
    local: "Lab Virtu",
    horarios: [
      { dia: 2, inicio: "16:00", fim: "18:00" },
      { dia: 4, inicio: "16:00", fim: "18:00" },
    ],
  },
  {
    id: "d3",
    nome: "Metodologia",
    tipo: "obrigatoria",
    horasSemana: 2,
    local: "Lab Virtu",
    horarios: [{ dia: 5, inicio: "16:00", fim: "18:00" }],
  },
  {
    id: "d4",
    nome: "PAA (Projeto e Análise de Algoritmos)",
    tipo: "obrigatoria",
    horasSemana: 4,
    local: "Sala 01",
    horarios: [
      { dia: 1, inicio: "18:00", fim: "20:00" },
      { dia: 3, inicio: "18:00", fim: "20:00" },
    ],
  },
  {
    id: "d5",
    nome: "Álgebra II",
    tipo: "obrigatoria",
    horasSemana: 4,
    horarios: [
      { dia: 2, inicio: "18:00", fim: "20:00" },
      { dia: 4, inicio: "18:00", fim: "20:00" },
    ],
  },
  {
    id: "d6",
    nome: "Introdução à Economia Política e da Amazônia",
    tipo: "optativa",
    horasSemana: 2,
    horarios: [{ dia: 5, inicio: "18:00", fim: "20:00" }],
  },
];

/** ===== Utils ===== */
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function badgeTipo(tipo: TTipo) {
  const map: Record<TTipo, string> = {
    obrigatoria: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    eletiva: "bg-red-500/15 text-red-400 border-red-500/30",
    optativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return cn("rounded px-2 py-0.5 text-xs border capitalize", map[tipo]);
}
function fmtDate(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** ===== Layout Helpers ===== */
function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white/5 p-4 shadow-sm dark:bg-zinc-900/40">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </h2>
        {right}
      </header>
      {children}
    </section>
  );
}

/** ===== Page Component ===== */
export default function DisciplinaDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  /** Busca a disciplina do mock */
  const disciplina = useMemo(
    () => DISCIPLINAS_MOCK.find((d) => d.id === id) ?? null,
    [id]
  );

  /** States persistidos por disciplina no localStorage */
  const storeKey = (k: string) => `disc:${id}:${k}`;

  const [anotacoes, setAnotacoes] = useState("");
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [blocosAssistidos, setBlocosAssistidos] = useState<number>(0); // cada bloco = 2h

  /** Carrega do localStorage ao montar */
  useEffect(() => {
    if (!disciplina) return;
    setAnotacoes(localStorage.getItem(storeKey("notes")) || "");
    setMateriais(
      JSON.parse(localStorage.getItem(storeKey("materials")) || "[]")
    );
    setAvaliacoes(JSON.parse(localStorage.getItem(storeKey("exams")) || "[]"));
    setBlocosAssistidos(
      Number(localStorage.getItem(storeKey("blocks")) || "0")
    );
  }, [disciplina]);

  /** Salva nos changes (debounce simples nas notas) */
  useEffect(() => {
    const t = setTimeout(
      () => localStorage.setItem(storeKey("notes"), anotacoes),
      300
    );
    return () => clearTimeout(t);
  }, [anotacoes]);

  useEffect(() => {
    localStorage.setItem(storeKey("materials"), JSON.stringify(materiais));
  }, [materiais]);
  useEffect(() => {
    localStorage.setItem(storeKey("exams"), JSON.stringify(avaliacoes));
  }, [avaliacoes]);
  useEffect(() => {
    localStorage.setItem(storeKey("blocks"), String(blocosAssistidos));
  }, [blocosAssistidos]);

  if (!disciplina) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => router.push("/disciplinas")}
          className="mb-4 rounded border px-3 py-1 text-sm hover:bg-white/5"
        >
          ← Voltar
        </button>
        <p className="text-sm text-zinc-500">Disciplina não encontrada.</p>
      </main>
    );
  }

  /** Derivados */
  const horasPorBloco = 2;
  const horasAssistidas = blocosAssistidos * horasPorBloco;
  const pctSemana = Math.min(
    100,
    Math.round((horasAssistidas / Math.max(1, disciplina.horasSemana)) * 100)
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => router.push("/disciplinas")}
            className="mb-2 rounded border px-3 py-1 text-sm hover:bg-white/5"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-semibold">{disciplina.nome}</h1>
          <p className="text-sm text-zinc-500">
            <span className={badgeTipo(disciplina.tipo)}>
              {disciplina.tipo}
            </span>
            <span className="ml-2">{disciplina.horasSemana}h/sem</span>
            {disciplina.local && (
              <span className="ml-2">• {disciplina.local}</span>
            )}
          </p>
          {disciplina.horarios?.length ? (
            <div className="mt-1 text-sm text-zinc-500">
              {disciplina.horarios.map((h, i) => (
                <span key={i} className="mr-3">
                  {DIAS[h.dia]} {h.inicio}–{h.fim}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Widget horas assistidas */}
        <Section title="Progresso semanal">
          <div className="min-w-[260px]">
            <div className="mb-1 flex justify-between text-sm">
              <span>Horas assistidas</span>
              <span className="tabular-nums">
                {horasAssistidas}/{disciplina.horasSemana}h ({pctSemana}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${pctSemana}%` }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setBlocosAssistidos((v) => Math.max(0, v - 1))}
                className="rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                − 1 bloco
              </button>
              <button
                onClick={() => setBlocosAssistidos((v) => v + 1)}
                className="rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                + 1 bloco
              </button>
              <button
                onClick={() => setBlocosAssistidos(0)}
                className="ml-auto rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                Zerar
              </button>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Cada bloco = {horasPorBloco}h.
            </div>
          </div>
        </Section>
      </div>

      {/* Anotações */}
      <Section
        title="Anotações"
        right={
          <span className="text-xs text-zinc-500">
            Markdown simples (texto livre por enquanto)
          </span>
        }
      >
        <textarea
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
          placeholder="Escreva aqui suas anotações, fórmulas, referências..."
          className="h-48 w-full rounded border bg-transparent p-3"
        />
        {anotacoes && (
          <div className="mt-3 rounded border bg-white/5 p-3">
            <div className="mb-1 text-xs font-medium text-zinc-500">
              Pré-visualização
            </div>
            <pre className="whitespace-pre-wrap text-sm">{anotacoes}</pre>
          </div>
        )}
      </Section>

      {/* Materiais */}
      <Section
        title="Materiais"
        right={
          <AddMaterial onAdd={(m) => setMateriais((prev) => [m, ...prev])} />
        }
      >
        {materiais.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem materiais ainda.</p>
        ) : (
          <ul className="space-y-2">
            {materiais.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.titulo}</div>
                  <a
                    href={m.url}
                    target="_blank"
                    className="truncate text-xs text-blue-400 underline"
                  >
                    {m.url}
                  </a>
                </div>
                <button
                  onClick={() =>
                    setMateriais((prev) => prev.filter((x) => x.id !== m.id))
                  }
                  className="rounded border px-2 py-1 text-xs hover:bg-white/5"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Avaliações da disciplina */}
      <Section
        title="Avaliações"
        right={
          <NovaAvaliacaoButton
            disciplinaId={disciplina.id}
            onCreate={(a) => setAvaliacoes((prev) => [a, ...prev])}
          />
        }
      >
        {avaliacoes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Sem avaliações cadastradas para esta disciplina.
          </p>
        ) : (
          <ul className="space-y-2">
            {avaliacoes
              .sort(
                (a, b) =>
                  new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
              )
              .map((a) => (
                <li key={a.id} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm">
                        <span className={tipoBadgeMap[a.tipo]}>{a.tipo}</span>
                        <span className="ml-2 text-zinc-300">
                          {fmtDate(a.dataISO)}
                        </span>
                      </div>
                      {a.descricao && (
                        <div className="text-sm text-zinc-500">
                          {a.descricao}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setAvaliacoes((prev) =>
                          prev.filter((x) => x.id !== a.id)
                        )
                      }
                      className="rounded border px-2 py-1 text-xs hover:bg-white/5"
                    >
                      Remover
                    </button>
                  </div>
                  {a.resumo_assuntos && (
                    <div className="mt-3 rounded border bg-white/5 p-3 text-sm">
                      <div className="mb-1 text-xs font-medium text-zinc-500">
                        Resumo dos assuntos {a.gerado_por_ia ? "(IA)" : ""}
                      </div>
                      <div className="whitespace-pre-wrap">
                        {a.resumo_assuntos}
                      </div>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

/** ===== Badge para tipo de avaliação ===== */
const tipoBadgeMap: Record<AvaliacaoTipo, string> = {
  prova:
    "rounded px-2 py-0.5 text-xs border bg-red-500/15 text-red-400 border-red-500/30 capitalize",
  trabalho:
    "rounded px-2 py-0.5 text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30 capitalize",
  seminario:
    "rounded px-2 py-0.5 text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 capitalize",
};

/** ===== Componente: adicionar material ===== */
function AddMaterial({ onAdd }: { onAdd: (m: Material) => void }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");

  function submit() {
    if (!titulo || !url) return;
    onAdd({ id: `m_${Date.now()}`, titulo, url });
    setTitulo("");
    setUrl("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1 text-sm hover:bg-white/5"
      >
        + Adicionar
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-lg">
            <header className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Novo material</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                Fechar
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <label className="grid gap-1 text-sm">
                <span>Título</span>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="rounded border bg-transparent px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded border bg-transparent px-2 py-1"
                />
              </label>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded border px-3 py-1 text-sm hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  className="rounded border px-3 py-1 text-sm hover:bg-white/5"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** ===== Componente: criar avaliação (modal com resumo IA mock) ===== */
function NovaAvaliacaoButton({
  disciplinaId,
  onCreate,
}: {
  disciplinaId: string;
  onCreate: (a: Avaliacao) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const [dataLocal, setDataLocal] = useState<string>(
    toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000))
  );
  const [descricao, setDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [loadingResumo, setLoadingResumo] = useState(false);

  async function gerarResumoIA() {
    setLoadingResumo(true);
    await new Promise((r) => setTimeout(r, 600));
    const txt = [
      `📌 Objetivo da ${tipo}`,
      `• Revisar conceitos-chave.`,
      `• Resolver exercícios representativos dos tópicos.`,
      "",
      `📝 Tópicos sugeridos`,
      `1) Definições essenciais`,
      `2) Exemplos resolvidos`,
      `3) Armadilhas comuns`,
    ].join("\n");
    setResumo(txt);
    setLoadingResumo(false);
  }

  function salvar() {
    const iso = new Date(dataLocal).toISOString();
    onCreate({
      id: `a_${Date.now()}`,
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao,
      resumo_assuntos: resumo || undefined,
      gerado_por_ia: !!resumo,
    });
    setDescricao("");
    setResumo("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1 text-sm hover:bg-white/5"
      >
        + Nova avaliação
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-background shadow-lg">
            <header className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">Nova avaliação</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded border px-2 py-1 text-sm hover:bg-white/5"
              >
                Fechar
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <label className="grid gap-1 text-sm">
                <span>Tipo</span>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as AvaliacaoTipo)}
                  className="rounded border bg-transparent px-2 py-1"
                >
                  <option value="prova">Prova</option>
                  <option value="trabalho">Trabalho</option>
                  <option value="seminario">Seminário</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Data e hora</span>
                <input
                  type="datetime-local"
                  value={dataLocal}
                  onChange={(e) => setDataLocal(e.target.value)}
                  className="rounded border bg-transparent px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Descrição</span>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="min-h-[80px] rounded border bg-transparent p-2"
                />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Resumo (opcional)</span>
                <button
                  onClick={gerarResumoIA}
                  className="rounded border px-2 py-1 text-xs hover:bg-white/5"
                  disabled={loadingResumo}
                >
                  {loadingResumo ? "Gerando…" : "Gerar resumo IA"}
                </button>
              </div>
              <textarea
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                className="min-h-[120px] rounded border bg-transparent p-2 text-sm"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded border px-3 py-1 text-sm hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  className="rounded border px-3 py-1 text-sm hover:bg-white/5"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
