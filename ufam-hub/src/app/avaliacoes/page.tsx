"use client";

import { useMemo, useState } from "react";

/** ===== Tipos ===== */
type Disciplina = { id: string; nome: string; professor?: string };
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

/** ===== MOCKS (trocar por Supabase depois) ===== */
const DISCIPLINAS: Disciplina[] = [
  { id: "d1", nome: "Cálculo I", professor: "Prof. A" },
  { id: "d2", nome: "Programação I", professor: "Profa. B" },
  { id: "d3", nome: "Álgebra Linear" },
];

const START_AVALIACOES: Avaliacao[] = [
  {
    id: "a1",
    disciplinaId: "d2",
    tipo: "prova",
    dataISO: addDaysISO(2),
    descricao: "Cap. 1–3",
  },
  {
    id: "a2",
    disciplinaId: "d1",
    tipo: "trabalho",
    dataISO: addDaysISO(5),
    descricao: "Listas 1 e 2",
  },
  { id: "a3", disciplinaId: "d3", tipo: "seminario", dataISO: addDaysISO(9) },
];

/** ===== Utils ===== */
function addDaysISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}
function fmtDate(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function daysUntil(dtISO: string) {
  const now = new Date();
  const target = new Date(dtISO);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function toLocalInputValue(d: Date) {
  // yyyy-MM-ddTHH:mm para <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** ===== Badge por tipo ===== */
function TipoBadge({ tipo }: { tipo: AvaliacaoTipo }) {
  const map: Record<AvaliacaoTipo, string> = {
    prova: "bg-red-500/15 text-red-400 border-red-500/30",
    trabalho: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    seminario: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span
      className={cn("rounded px-2 py-0.5 text-xs border capitalize", map[tipo])}
    >
      {tipo}
    </span>
  );
}

/** ===== Modal simples ===== */
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-background shadow-lg">
        <header className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded border px-2 py-1 text-sm hover:bg-white/5"
          >
            Fechar
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/** ===== Página ===== */
export default function AvaliacoesPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(START_AVALIACOES);
  const [fDisc, setFDisc] = useState<string>("todas");
  const [fTipo, setFTipo] = useState<"tudo" | AvaliacaoTipo>("tudo");
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Avaliacao | null>(null);

  const discMap = useMemo(
    () => new Map(DISCIPLINAS.map((d) => [d.id, d.nome])),
    []
  );

  const list = useMemo(() => {
    let arr = [...avaliacoes];
    if (fDisc !== "todas") arr = arr.filter((a) => a.disciplinaId === fDisc);
    if (fTipo !== "tudo") arr = arr.filter((a) => a.tipo === fTipo);
    if (q) {
      const needle = q.toLowerCase();
      arr = arr.filter((a) => {
        const nome = discMap.get(a.disciplinaId)?.toLowerCase() || "";
        const desc = a.descricao?.toLowerCase() || "";
        return nome.includes(needle) || desc.includes(needle);
      });
    }
    return arr.sort(
      (a, b) => new Date(a.dataISO).getTime() - new Date(b.dataISO).getTime()
    );
  }, [avaliacoes, fDisc, fTipo, q, discMap]);

  function removeItem(id: string) {
    setAvaliacoes((prev) => prev.filter((x) => x.id !== id));
  }

  function saveEdited(updated: Avaliacao) {
    setAvaliacoes((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Avaliações</h1>
          <p className="text-zinc-500">
            Provas, trabalhos e seminários por disciplina
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenNew(true)}
            className="rounded-md border px-3 py-2 text-sm hover:bg-white/5"
          >
            + Nova avaliação
          </button>
        </div>
      </header>

      {/* Filtros */}
      <section className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:gap-3">
        <select
          value={fDisc}
          onChange={(e) => setFDisc(e.target.value)}
          className="rounded border bg-transparent px-2 py-1 text-sm"
        >
          <option value="todas">Todas as disciplinas</option>
          {DISCIPLINAS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>

        <select
          value={fTipo}
          onChange={(e) => setFTipo(e.target.value as any)}
          className="rounded border bg-transparent px-2 py-1 text-sm"
        >
          <option value="tudo">Todos os tipos</option>
          <option value="prova">Prova</option>
          <option value="trabalho">Trabalho</option>
          <option value="seminario">Seminário</option>
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por disciplina ou descrição..."
          className="flex-1 rounded border bg-transparent px-2 py-1 text-sm"
        />
      </section>

      {/* Lista */}
      <section className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma avaliação encontrada.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((a) => {
              const nomeDisc = discMap.get(a.disciplinaId) ?? "Disciplina";
              const dias = daysUntil(a.dataISO);
              return (
                <li key={a.id} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TipoBadge tipo={a.tipo} />
                        <span className="font-medium">{nomeDisc}</span>
                      </div>
                      {a.descricao && (
                        <div className="text-sm text-zinc-500">
                          {a.descricao}
                        </div>
                      )}
                      <div className="text-xs text-zinc-500">
                        {dias > 0 ? `Faltam ${dias} dias` : "Hoje"} •{" "}
                        {fmtDate(a.dataISO)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(a)}
                        className="rounded border px-2 py-1 text-xs hover:bg-white/5"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeItem(a.id)}
                        className="rounded border px-2 py-1 text-xs hover:bg-white/5"
                        title="Remover"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Resumo gerado */}
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
              );
            })}
          </ul>
        )}
      </section>

      {/* Modal nova avaliação */}
      <NovaAvaliacaoModal
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={(novo) => setAvaliacoes((prev) => [novo, ...prev])}
      />

      {/* Modal editar avaliação */}
      <EditarAvaliacaoModal
        open={!!editing}
        avaliacao={editing}
        onClose={() => setEditing(null)}
        onSave={(upd) => {
          saveEdited(upd);
          setEditing(null);
        }}
      />
    </main>
  );
}

/** ===== Modal de criação com "Gerar resumo IA" (mock) ===== */
function NovaAvaliacaoModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (a: Avaliacao) => void;
}) {
  const [disciplinaId, setDisciplinaId] = useState<string>(
    DISCIPLINAS[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const [dataLocal, setDataLocal] = useState<string>(() =>
    toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000))
  );
  const [descricao, setDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [loadingResumo, setLoadingResumo] = useState(false);

  async function gerarResumoIA() {
    setLoadingResumo(true);
    await new Promise((r) => setTimeout(r, 600)); // simula latência
    const disc =
      DISCIPLINAS.find((d) => d.id === disciplinaId)?.nome ?? "Disciplina";
    const base = [
      `📌 **Objetivo da ${tipo}** de ${disc}`,
      `• Relembrar conceitos-chave.`,
      `• Focar em exercícios similares ao que cairá.`,
      "",
      `📝 **Tópicos sugeridos**`,
      `1) Definições e propriedades básicas`,
      `2) Exemplos resolvidos + variações`,
      `3) Erros comuns e como evitar`,
      "",
      `🎯 **Dica**: monte 5 questões rápidas e cronometre.`,
    ].join("\n");
    setResumo(base);
    setLoadingResumo(false);
  }

  function salvar() {
    const id = `a_${Date.now()}`;
    const iso = new Date(dataLocal).toISOString();
    const novo: Avaliacao = {
      id,
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao,
      resumo_assuntos: resumo || undefined,
      gerado_por_ia: !!resumo,
    };
    onCreate(novo);
    onClose();
    setDescricao("");
    setResumo("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova avaliação">
      <FormAvaliacao
        disciplinaId={disciplinaId}
        setDisciplinaId={setDisciplinaId}
        tipo={tipo}
        setTipo={setTipo}
        dataLocal={dataLocal}
        setDataLocal={setDataLocal}
        descricao={descricao}
        setDescricao={setDescricao}
        resumo={resumo}
        setResumo={setResumo}
        onGerarResumoIA={gerarResumoIA}
        loadingResumo={loadingResumo}
        onCancel={onClose}
        onSubmit={salvar}
        submitLabel="Salvar"
      />
    </Modal>
  );
}

/** ===== Modal de edição ===== */
function EditarAvaliacaoModal({
  open,
  avaliacao,
  onClose,
  onSave,
}: {
  open: boolean;
  avaliacao: Avaliacao | null;
  onClose: () => void;
  onSave: (a: Avaliacao) => void;
}) {
  const [disciplinaId, setDisciplinaId] = useState<string>("");
  const [tipo, setTipo] = useState<AvaliacaoTipo>("prova");
  const [dataLocal, setDataLocal] = useState<string>(
    toLocalInputValue(new Date())
  );
  const [descricao, setDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [loadingResumo, setLoadingResumo] = useState(false);

  // carrega valores quando abrir/avaliacao mudar
  useState(() => {
    if (avaliacao) {
      setDisciplinaId(avaliacao.disciplinaId);
      setTipo(avaliacao.tipo);
      setDataLocal(toLocalInputValue(new Date(avaliacao.dataISO)));
      setDescricao(avaliacao.descricao ?? "");
      setResumo(avaliacao.resumo_assuntos ?? "");
    }
  });

  async function gerarResumoIA() {
    setLoadingResumo(true);
    await new Promise((r) => setTimeout(r, 500));
    const disc =
      DISCIPLINAS.find((d) => d.id === disciplinaId)?.nome ?? "Disciplina";
    const txt = `Resumo atualizado para ${disc} (${tipo}). Dica: revise exercícios e teoremas principais.`;
    setResumo((prev) => (prev ? `${prev}\n\n—\n${txt}` : txt));
    setLoadingResumo(false);
  }

  function salvar() {
    if (!avaliacao) return;
    const iso = new Date(dataLocal).toISOString();
    onSave({
      ...avaliacao,
      disciplinaId,
      tipo,
      dataISO: iso,
      descricao,
      resumo_assuntos: resumo || undefined,
      gerado_por_ia: !!resumo,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar avaliação">
      {avaliacao && (
        <FormAvaliacao
          disciplinaId={disciplinaId}
          setDisciplinaId={setDisciplinaId}
          tipo={tipo}
          setTipo={setTipo}
          dataLocal={dataLocal}
          setDataLocal={setDataLocal}
          descricao={descricao}
          setDescricao={setDescricao}
          resumo={resumo}
          setResumo={setResumo}
          onGerarResumoIA={gerarResumoIA}
          loadingResumo={loadingResumo}
          onCancel={onClose}
          onSubmit={salvar}
          submitLabel="Salvar alterações"
        />
      )}
    </Modal>
  );
}

/** ===== Form compartilhado (criar/editar) ===== */
function FormAvaliacao(props: {
  disciplinaId: string;
  setDisciplinaId: (v: string) => void;
  tipo: AvaliacaoTipo;
  setTipo: (v: AvaliacaoTipo) => void;
  dataLocal: string;
  setDataLocal: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  resumo: string;
  setResumo: (v: string) => void;
  onGerarResumoIA: () => Promise<void> | void;
  loadingResumo: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const {
    disciplinaId,
    setDisciplinaId,
    tipo,
    setTipo,
    dataLocal,
    setDataLocal,
    descricao,
    setDescricao,
    resumo,
    setResumo,
    onGerarResumoIA,
    loadingResumo,
    onCancel,
    onSubmit,
    submitLabel,
  } = props;

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span>Disciplina</span>
        <select
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          className="rounded border bg-transparent px-2 py-1"
        >
          {DISCIPLINAS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </label>

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
          placeholder="Ex.: Cap. 1–3; lista 1 e 2; apresentação de tópicos..."
          className="min-h-[80px] rounded border bg-transparent p-2"
        />
      </label>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Resumo dos assuntos (opcional)
        </span>
        <button
          onClick={onGerarResumoIA}
          className="rounded border px-2 py-1 text-xs hover:bg-white/5"
          disabled={loadingResumo}
        >
          {loadingResumo ? "Gerando…" : "Gerar resumo IA"}
        </button>
      </div>
      <textarea
        value={resumo}
        onChange={(e) => setResumo(e.target.value)}
        placeholder="Resumo a estudar para esta avaliação..."
        className="min-h-[120px] rounded border bg-transparent p-2 text-sm"
      />

      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded border px-3 py-1 text-sm hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="rounded border px-3 py-1 text-sm hover:bg-white/5"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
