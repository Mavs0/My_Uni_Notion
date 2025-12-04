"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { useTarefas, type Tarefa } from "@/hooks/useTarefas";
import {
  Loader2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  XCircle,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Flag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
type Material = {
  id: string;
  titulo: string;
  url?: string;
  tipo: "url" | "pdf" | "svg";
  arquivo?: string;
  nomeArquivo?: string;
};

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
function daysUntil(dtISO: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dtISO);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}
function PrioridadeBadge({
  prioridade,
}: {
  prioridade: "baixa" | "media" | "alta";
}) {
  const map = {
    baixa: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    media: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    alta: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs border flex items-center gap-1",
        map[prioridade]
      )}
    >
      <Flag className="h-3 w-3" />
      {prioridade}
    </span>
  );
}

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

export default function DisciplinaDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const {
    disciplinas,
    loading: loadingDisc,
    error: errorDisc,
  } = useDisciplinas();
  const {
    avaliacoes,
    loading: loadingAval,
    createAvaliacao,
    deleteAvaliacao,
  } = useAvaliacoes({
    disciplinaId: id,
  });
  const {
    tarefas,
    loading: loadingTarefas,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    toggleConcluida,
  } = useTarefas({
    disciplinaId: id,
  });
  
  const disciplina = useMemo(() => {
    if (!disciplinas || disciplinas.length === 0) return null;
    return disciplinas.find((d) => d.id === id) ?? null;
  }, [disciplinas, id]);
  
  const storeKey = (k: string) => `disc:${id}:${k}`;
  const [anotacoes, setAnotacoes] = useState("");
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [blocosAssistidos, setBlocosAssistidos] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);
  const [carregandoAnotacoes, setCarregandoAnotacoes] = useState(true);
  const [notaId, setNotaId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!disciplina) return;
    const disciplinaId = disciplina.id;
    async function carregarAnotacoes() {
      try {
        setCarregandoAnotacoes(true);
        const res = await fetch(
          `/api/notas?disciplina_id=${encodeURIComponent(disciplinaId)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAnotacoes(data.content_md || "");
          setNotaId(data.id || null);
        } else if (res.status === 401) {
          const local = localStorage.getItem(storeKey("notes"));
          if (local) setAnotacoes(local);
        }
      } catch (error) {
        console.error("Erro ao carregar anotações:", error);
        const local = localStorage.getItem(storeKey("notes"));
        if (local) setAnotacoes(local);
      } finally {
        setCarregandoAnotacoes(false);
      }
    }
    carregarAnotacoes();
    setMateriais(
      JSON.parse(localStorage.getItem(storeKey("materials")) || "[]")
    );
    setBlocosAssistidos(
      Number(localStorage.getItem(storeKey("blocks")) || "0")
    );
  }, [disciplina, id]);
  
  useEffect(() => {
    if (!disciplina || carregandoAnotacoes) return;
    const timeoutId = setTimeout(async () => {
      try {
        setSalvando(true);
        const res = await fetch("/api/notas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disciplina_id: disciplina.id,
            content_md: anotacoes,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const isNovaNota = !notaId && data.id;
          setNotaId(data.id);
          if (
            isNovaNota &&
            data.conquistasDesbloqueadas &&
            data.conquistasDesbloqueadas.length > 0
          ) {
            data.conquistasDesbloqueadas.forEach((conquista: any) => {
              toast.success(`🏆 Conquista desbloqueada: ${conquista.nome}`, {
                description: conquista.descricao,
                duration: 5000,
              });
            });
          }
          localStorage.setItem(storeKey("notes"), anotacoes);
        } else if (res.status === 401) {
          localStorage.setItem(storeKey("notes"), anotacoes);
        } else {
          console.error("Erro ao salvar anotações");
          localStorage.setItem(storeKey("notes"), anotacoes);
        }
      } catch (error) {
        console.error("Erro ao salvar anotações:", error);
        localStorage.setItem(storeKey("notes"), anotacoes);
      } finally {
        setSalvando(false);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [anotacoes, disciplina, carregandoAnotacoes]);
  useEffect(() => {
    localStorage.setItem(storeKey("materials"), JSON.stringify(materiais));
  }, [materiais, id]);
  useEffect(() => {
    localStorage.setItem(storeKey("blocks"), String(blocosAssistidos));
  }, [blocosAssistidos, id]);
  if (loadingDisc) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-400">Carregando disciplina...</span>
        </div>
      </main>
    );
  }
  if (errorDisc) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => router.push("/disciplinas")}
          className="mb-4 rounded border px-3 py-1 text-sm hover:bg-white/5"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <div className="font-medium text-red-500">
              Erro ao carregar disciplina
            </div>
            <div className="text-sm text-zinc-400">{errorDisc}</div>
          </div>
        </div>
      </main>
    );
  }
  if (!disciplina) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => router.push("/disciplinas")}
          className="mb-4 rounded border px-3 py-1 text-sm hover:bg-white/5"
        >
          ← Voltar
        </button>
        <div className="rounded-lg border p-6 text-center">
          <p className="text-sm text-zinc-500">Disciplina não encontrada.</p>
          <p className="mt-2 text-xs text-zinc-400">
            A disciplina pode ter sido removida ou você não tem permissão para
            acessá-la.
          </p>
        </div>
      </main>
    );
  }
  
  const horasPorBloco = 2;
  const horasAssistidas = blocosAssistidos * horasPorBloco;
  const pctSemana = Math.min(
    100,
    Math.round((horasAssistidas / Math.max(1, disciplina.horasSemana)) * 100)
  );
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {}
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
        {}
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
      {}
      <Section
        title="Anotações"
        right={
          <div className="flex items-center gap-2">
            {salvando && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-500">Salvando...</span>
              </div>
            )}
            {!salvando && notaId && anotacoes && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-500 font-medium">
                  Salvo
                </span>
              </div>
            )}
            {!salvando && !notaId && anotacoes && (
              <span className="text-xs text-yellow-500">Não salvo</span>
            )}
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Markdown simples (salvo automaticamente)
            </span>
          </div>
        }
      >
        {carregandoAnotacoes ? (
          <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
            Carregando anotações...
          </div>
        ) : (
          <>
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
          </>
        )}
      </Section>
      {}
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
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.titulo}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {m.tipo === "url" ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs text-blue-400 underline"
                      >
                        {m.url}
                      </a>
                    ) : m.tipo === "pdf" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          📄 {m.nomeArquivo || "arquivo.pdf"}
                        </span>
                        {m.arquivo && (
                          <a
                            href={m.arquivo}
                            download={m.nomeArquivo || "arquivo.pdf"}
                            className="text-xs text-blue-400 underline"
                          >
                            Baixar
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          🎨 {m.nomeArquivo || "arquivo.svg"}
                        </span>
                        {m.arquivo && (
                          <div className="flex items-center gap-2">
                            <a
                              href={m.arquivo}
                              download={m.nomeArquivo || "arquivo.svg"}
                              className="text-xs text-blue-400 underline"
                            >
                              Baixar
                            </a>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-blue-400">
                                Ver preview
                              </summary>
                              <div className="mt-2 rounded border bg-white/5 p-2">
                                <img
                                  src={m.arquivo}
                                  alt={m.titulo}
                                  className="max-h-48 w-auto"
                                />
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setMateriais((prev) => prev.filter((x) => x.id !== m.id))
                  }
                  className="ml-2 rounded border px-2 py-1 text-xs hover:bg-white/5"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {}
      <Section title="Tarefas" right={<AddTarefa disciplinaId={id} />}>
        {loadingTarefas ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : tarefas.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma tarefa cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {tarefas
              .sort((a, b) => {
                if (a.concluida !== b.concluida) {
                  return a.concluida ? 1 : -1;
                }
                if (a.dataVencimento && b.dataVencimento) {
                  return (
                    new Date(a.dataVencimento).getTime() -
                    new Date(b.dataVencimento).getTime()
                  );
                }
                if (a.dataVencimento) return -1;
                if (b.dataVencimento) return 1;
                return 0;
              })
              .map((t) => (
                <TarefaItem
                  key={t.id}
                  tarefa={t}
                  onToggle={async () => {
                    const result = await toggleConcluida(t.id, !t.concluida);
                    if (result.success) {
                      toast.success(
                        t.concluida
                          ? "Tarefa marcada como pendente"
                          : "Tarefa concluída!"
                      );
                    }
                  }}
                  onDelete={async () => {
                    const result = await deleteTarefa(t.id);
                    if (result.success) {
                      toast.success("Tarefa removida");
                    } else {
                      toast.error(result.error || "Erro ao remover tarefa");
                    }
                  }}
                  onEdit={async (updated) => {
                    const result = await updateTarefa(t.id, updated);
                    if (result.success) {
                      toast.success("Tarefa atualizada");
                    } else {
                      toast.error(result.error || "Erro ao atualizar tarefa");
                    }
                  }}
                />
              ))}
          </ul>
        )}
      </Section>
      {}
      <Section
        title="Avaliações"
        right={
          <NovaAvaliacaoButton
            disciplinaId={disciplina.id}
            onCreate={async (a) => {
              const result = await createAvaliacao({
                disciplinaId: a.disciplinaId,
                tipo: a.tipo,
                dataISO: a.dataISO,
                descricao: a.descricao,
                resumo_assuntos: a.resumo_assuntos,
              });
              if (!result.success) {
                toast.error(result.error || "Erro ao criar avaliação");
              } else {
                toast.success("Avaliação criada com sucesso!");
              }
            }}
          />
        }
      >
        {loadingAval ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            <span className="ml-2 text-sm text-zinc-400">
              Carregando avaliações...
            </span>
          </div>
        ) : avaliacoes.length === 0 ? (
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
                      onClick={async () => {
                        const result = await deleteAvaliacao(a.id);
                        if (!result.success) {
                          toast.error(
                            result.error || "Erro ao remover avaliação"
                          );
                        } else {
                          toast.success("Avaliação removida com sucesso!");
                        }
                      }}
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

const tipoBadgeMap: Record<AvaliacaoTipo, string> = {
  prova:
    "rounded px-2 py-0.5 text-xs border bg-red-500/15 text-red-400 border-red-500/30 capitalize",
  trabalho:
    "rounded px-2 py-0.5 text-xs border bg-blue-500/15 text-blue-400 border-blue-500/30 capitalize",
  seminario:
    "rounded px-2 py-0.5 text-xs border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 capitalize",
};

function AddMaterial({ onAdd }: { onAdd: (m: Material) => void }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [materialMethod, setMaterialMethod] = useState<"upload" | "url">("url");
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoArquivo, setTipoArquivo] = useState<"pdf" | "svg">("pdf");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo de 5MB.");
      return;
    }
    if (tipoArquivo === "pdf" && file.type !== "application/pdf") {
      setError("Formato inválido. Use PDF.");
      return;
    }
    if (tipoArquivo === "svg" && file.type !== "image/svg+xml") {
      setError("Formato inválido. Use SVG.");
      return;
    }
    setNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setArquivo(result);
      if (tipoArquivo === "svg") {
        setPreview(result);
      } else {
        setPreview(null);
      }
    };
    reader.readAsDataURL(file);
  }
  function resetForm() {
    setTitulo("");
    setUrl("");
    setArquivo(null);
    setNomeArquivo("");
    setPreview(null);
    setMaterialMethod("url");
    setTipoArquivo("pdf");
    setError(null);
  }
  function submit() {
    setError(null);
    setUploading(true);
    if (!titulo.trim()) {
      setError("Título é obrigatório");
      setUploading(false);
      return;
    }
    try {
      if (materialMethod === "url") {
        if (!url.trim()) {
          setError("URL é obrigatória");
          setUploading(false);
          return;
        }
        try {
          new URL(url);
        } catch {
          setError("URL inválida");
          setUploading(false);
          return;
        }
        onAdd({
          id: `m_${Date.now()}`,
          titulo,
          url,
          tipo: "url",
        });
      } else {
        if (!arquivo) {
          setError("Por favor, selecione um arquivo");
          setUploading(false);
          return;
        }
        onAdd({
          id: `m_${Date.now()}`,
          titulo,
          tipo: tipoArquivo,
          arquivo,
          nomeArquivo,
        });
      }
      resetForm();
      setOpen(false);
      toast.success("Material adicionado com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar material");
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          resetForm();
        }}
        variant="outline"
        size="sm"
      >
        + Adicionar
      </Button>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Material</DialogTitle>
            <DialogDescription>
              Adicione um link externo ou faça upload de um arquivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <label htmlFor="material-title" className="text-sm font-medium">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                id="material-title"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Slides da aula 1"
                className={error && !titulo.trim() ? "border-red-500" : ""}
              />
            </div>
            {}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                onClick={() => {
                  setMaterialMethod("url");
                  setArquivo(null);
                  setNomeArquivo("");
                  setPreview(null);
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  materialMethod === "url"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaterialMethod("upload");
                  setUrl("");
                  setError(null);
                }}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                  materialMethod === "upload"
                    ? "border-b-2 border-primary text-primary"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </button>
            </div>
            {}
            {materialMethod === "url" && (
              <div className="space-y-2">
                <label htmlFor="material-url" className="text-sm font-medium">
                  URL do Material <span className="text-red-500">*</span>
                </label>
                <Input
                  id="material-url"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://exemplo.com/material.pdf"
                  className={error && !url.trim() ? "border-red-500" : ""}
                />
                <p className="text-xs text-zinc-500">
                  Cole a URL completa do material (PDF, link externo, etc.)
                </p>
              </div>
            )}
            {}
            {materialMethod === "upload" && (
              <div className="space-y-4">
                {}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Arquivo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoArquivo("pdf");
                        setArquivo(null);
                        setNomeArquivo("");
                        setPreview(null);
                        setError(null);
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        tipoArquivo === "pdf"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <FileText className="h-4 w-4 inline mr-2" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoArquivo("svg");
                        setArquivo(null);
                        setNomeArquivo("");
                        setPreview(null);
                        setError(null);
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        tipoArquivo === "svg"
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 inline mr-2" />
                      SVG
                    </button>
                  </div>
                </div>
                {}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="material-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">
                          Clique para fazer upload
                        </span>{" "}
                        ou arraste e solte
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tipoArquivo.toUpperCase()} (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="material-upload"
                      type="file"
                      className="hidden"
                      accept={
                        tipoArquivo === "pdf"
                          ? "application/pdf"
                          : "image/svg+xml"
                      }
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {nomeArquivo && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Arquivo selecionado: {nomeArquivo}
                    </p>
                    {preview && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                disabled={uploading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={
                  uploading ||
                  !titulo.trim() ||
                  (materialMethod === "url" ? !url.trim() : !arquivo)
                }
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

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

function AddTarefa({ disciplinaId }: { disciplinaId: string }) {
  const { createTarefa } = useTarefas({ disciplinaId });
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">(
    "media"
  );
  async function salvar() {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    const result = await createTarefa({
      disciplinaId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      dataVencimento: dataVencimento || undefined,
      prioridade,
      concluida: false,
    });
    if (result.success) {
      toast.success("Tarefa criada com sucesso!");
      setTitulo("");
      setDescricao("");
      setDataVencimento("");
      setPrioridade("media");
      setOpen(false);
    } else {
      toast.error(result.error || "Erro ao criar tarefa");
    }
  }
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Nova Tarefa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Adicione uma nova tarefa para esta disciplina
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Fazer exercícios do capítulo 3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes da tarefa..."
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Data de vencimento
                </label>
                <Input
                  type="datetime-local"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) =>
                    setPrioridade(e.target.value as "baixa" | "media" | "alta")
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>Criar Tarefa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TarefaItem({
  tarefa,
  onToggle,
  onDelete,
  onEdit,
}: {
  tarefa: Tarefa;
  onToggle: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: (updated: Partial<Tarefa>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [descricao, setDescricao] = useState(tarefa.descricao || "");
  const [dataVencimento, setDataVencimento] = useState(
    tarefa.dataVencimento
      ? toLocalInputValue(new Date(tarefa.dataVencimento))
      : ""
  );
  const [prioridade, setPrioridade] = useState(tarefa.prioridade);
  const diasRestantes = tarefa.dataVencimento
    ? daysUntil(tarefa.dataVencimento)
    : null;
  const isVencida =
    diasRestantes !== null && diasRestantes < 0 && !tarefa.concluida;
  const isUrgente =
    diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 2;
  async function salvarEdicao() {
    await onEdit({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      dataVencimento: dataVencimento || undefined,
      prioridade,
    });
    setEditing(false);
  }
  if (editing) {
    return (
      <li className="rounded-lg border border-blue-500/50 bg-blue-500/5 p-3">
        <div className="space-y-3">
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da tarefa"
            className="text-sm"
          />
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="datetime-local"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="text-sm"
            />
            <select
              value={prioridade}
              onChange={(e) =>
                setPrioridade(e.target.value as "baixa" | "media" | "alta")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={salvarEdicao}>
              Salvar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTitulo(tarefa.titulo);
                setDescricao(tarefa.descricao || "");
                setDataVencimento(
                  tarefa.dataVencimento
                    ? toLocalInputValue(new Date(tarefa.dataVencimento))
                    : ""
                );
                setPrioridade(tarefa.prioridade);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </li>
    );
  }
  return (
    <li
      className={cn(
        "rounded-lg border p-3 transition-all",
        tarefa.concluida && "opacity-60 bg-zinc-900/30",
        isVencida && !tarefa.concluida && "border-red-500/50 bg-red-500/5",
        isUrgente && !tarefa.concluida && "border-orange-500/30 bg-orange-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-zinc-400 hover:text-emerald-400 transition-colors"
          title={
            tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída"
          }
        >
          {tarefa.concluida ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={cn(
                  "font-medium text-sm",
                  tarefa.concluida && "line-through text-zinc-500"
                )}
              >
                {tarefa.titulo}
              </h4>
              {tarefa.descricao && (
                <p className="mt-1 text-xs text-zinc-400">{tarefa.descricao}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Editar tarefa"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <PrioridadeBadge prioridade={tarefa.prioridade} />
            {tarefa.dataVencimento && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isVencida && !tarefa.concluida
                    ? "text-red-400"
                    : isUrgente && !tarefa.concluida
                    ? "text-orange-400"
                    : "text-zinc-400"
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>{fmtDate(tarefa.dataVencimento)}</span>
                {diasRestantes !== null && !tarefa.concluida && (
                  <span className="ml-1">
                    {diasRestantes < 0
                      ? `(Vencida há ${Math.abs(diasRestantes)} dias)`
                      : diasRestantes === 0
                      ? "(Hoje)"
                      : diasRestantes === 1
                      ? "(Amanhã)"
                      : `(Em ${diasRestantes} dias)`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}