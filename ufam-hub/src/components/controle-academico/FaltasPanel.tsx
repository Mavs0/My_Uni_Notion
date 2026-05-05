"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Disciplina } from "@/hooks/useDisciplinas";
import {
  inferirAulasPorSemana,
  limiteFaltasPorAulasSemana,
} from "@/lib/controle-academico/business-rules";
import {
  getRegistoFaltas,
  loadMapaFaltas,
  saveMapaFaltas,
} from "@/lib/controle-academico/storage";
import type { MapaFaltas } from "@/lib/controle-academico/types";
import { cn } from "@/lib/utils";

type FaltasPanelProps = {
  disciplinas: Disciplina[];
  loadingDisciplinas: boolean;
};

export function FaltasPanel({
  disciplinas,
  loadingDisciplinas,
}: FaltasPanelProps) {
  const ativas = useMemo(
    () => disciplinas.filter((d) => d.ativo !== false),
    [disciplinas],
  );
  const [discId, setDiscId] = useState<string>("");
  const [mapa, setMapa] = useState<MapaFaltas>({});

  useEffect(() => {
    setMapa(loadMapaFaltas());
  }, []);

  const disciplina = useMemo(
    () => ativas.find((d) => d.id === discId) ?? null,
    [ativas, discId],
  );

  const registo = discId ? getRegistoFaltas(mapa, discId) : null;

  const inferencia = disciplina ? inferirAulasPorSemana(disciplina) : null;
  const aulasEfetivas: 1 | 2 | 3 | null =
    registo?.aulasPorSemanaManual ?? inferencia?.aulas ?? null;
  const limiteCalculado =
    aulasEfetivas != null ? limiteFaltasPorAulasSemana(aulasEfetivas) : null;

  const persist = useCallback((next: MapaFaltas) => {
    setMapa(next);
    saveMapaFaltas(next);
  }, []);

  const setAulasManual = (v: string) => {
    if (!discId) return;
    const prev = getRegistoFaltas(mapa, discId);
    const manual =
      v === "__auto__" || v === ""
        ? undefined
        : (Number.parseInt(v, 10) as 1 | 2 | 3);
    const aulasPorSemanaManual =
      manual === 1 || manual === 2 || manual === 3 ? manual : undefined;
    persist({
      ...mapa,
      [discId]: { ...prev, aulasPorSemanaManual },
    });
  };

  const setFaltas = (v: number) => {
    if (!discId) return;
    const faltasRegistradas = Math.max(0, Math.floor(v));
    const prev = getRegistoFaltas(mapa, discId);
    persist({
      ...mapa,
      [discId]: { ...prev, faltasRegistradas },
    });
  };

  const saldo =
    limiteCalculado != null && limiteCalculado > 0
      ? Math.max(0, limiteCalculado - (registo?.faltasRegistradas ?? 0))
      : null;
  const excedeu =
    limiteCalculado != null &&
    limiteCalculado > 0 &&
    (registo?.faltasRegistradas ?? 0) > limiteCalculado;
  const pct =
    limiteCalculado != null && limiteCalculado > 0
      ? Math.min(
          100,
          ((registo?.faltasRegistradas ?? 0) / limiteCalculado) * 100,
        )
      : 0;

  const selectManualValue =
    registo?.aulasPorSemanaManual != null
      ? String(registo.aulasPorSemanaManual)
      : "__auto__";

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <UserX className="h-5 w-5 text-muted-foreground" />
            Controle de faltas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Limite derivado da frequência semanal (75% de presença ≈ no máximo
            25% de faltas em horas-aula): 1×/sem → 5h, 2×/sem → 15h, 3×/sem →
            21h.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select
              value={discId || "__none__"}
              onValueChange={(v) => setDiscId(v === "__none__" ? "" : v)}
              disabled={loadingDisciplinas || ativas.length === 0}
            >
              <SelectTrigger className="h-11 max-w-xl rounded-xl">
                <SelectValue placeholder="Escolhe uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Selecionar —</SelectItem>
                {ativas.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!discId ? (
            <p className="text-sm text-muted-foreground">
              Escolhe uma disciplina para ver o limite automático de faltas e
              registar quantas faltas já tiveste.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
                <p className="font-medium text-foreground">Limite automático</p>
                {inferencia ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>
                      Horários na disciplina:{" "}
                      <span className="font-medium text-foreground">
                        {inferencia.horariosCount || "—"}
                      </span>
                    </li>
                    <li>
                      Horas por semana (cadastro):{" "}
                      <span className="font-medium text-foreground">
                        {disciplina?.horasSemana ?? "—"}
                      </span>
                    </li>
                    {inferencia.aulas != null &&
                    registo?.aulasPorSemanaManual == null ? (
                      <li>
                        Encontros por semana inferidos:{" "}
                        <span className="font-medium text-foreground">
                          {inferencia.aulas}×
                        </span>{" "}
                        → limite de{" "}
                        <span className="font-medium text-foreground">
                          {limiteFaltasPorAulasSemana(inferencia.aulas)} faltas
                          (h)
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}

                <div className="mt-4 space-y-2">
                  <Label>Aulas por semana (override)</Label>
                  <Select value={selectManualValue} onValueChange={setAulasManual}>
                    <SelectTrigger className="h-11 max-w-md rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__auto__">
                        Automático (horários ou 1–3h cadastradas)
                      </SelectItem>
                      <SelectItem value="1">1× por semana → 5 faltas (5h)</SelectItem>
                      <SelectItem value="2">
                        2× por semana → 15 faltas (15h)
                      </SelectItem>
                      <SelectItem value="3">
                        3× por semana → 21 faltas (21h)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {inferencia?.aulas == null &&
                  registo?.aulasPorSemanaManual == null ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Não foi possível inferir 1, 2 ou 3 encontros (ex.: mais de
                      três horários). Escolhe manualmente quantas vezes por
                      semana tens aula desta disciplina.
                    </p>
                  ) : null}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Regra de negócio: 75% de frequência na disciplina; o limite em
                  horas-aula depende só do número de encontros semanais (1×, 2×
                  ou 3×).
                </p>
              </div>

              {limiteCalculado != null && limiteCalculado > 0 ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/40 pb-4">
                  <span className="text-sm text-muted-foreground">
                    Limite de faltas (regra)
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {limiteCalculado}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({aulasEfetivas}× por semana)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Define nas opções acima quantas vezes por semana tens esta
                  disciplina (1, 2 ou 3) para calcular o limite.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="faltas-dadas">Faltas já registadas</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    onClick={() =>
                      setFaltas((registo?.faltasRegistradas ?? 0) - 1)
                    }
                    aria-label="Menos uma falta"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="faltas-dadas"
                    inputMode="numeric"
                    className="h-11 max-w-[140px] rounded-xl text-center font-medium"
                    value={registo?.faltasRegistradas ?? 0}
                    onChange={(e) =>
                      setFaltas(Number.parseInt(e.target.value, 10) || 0)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    onClick={() =>
                      setFaltas((registo?.faltasRegistradas ?? 0) + 1)
                    }
                    aria-label="Mais uma falta"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {limiteCalculado != null && limiteCalculado > 0 ? (
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Faltas que ainda podes ter (até ao limite)
                      </p>
                      <p className="text-3xl font-bold tabular-nums">
                        {excedeu ? 0 : saldo}
                      </p>
                    </div>
                    {excedeu ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">
                          Acima do limite da regra
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        excedeu ? "bg-destructive" : "bg-primary",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {registo?.faltasRegistradas ?? 0} de {limiteCalculado}{" "}
                    faltas (horas-aula) no limite.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-dashed border-border/80 bg-muted/10">
        <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Próximos passos</p>
          <p className="mt-2">
            Integração com calendário de aulas, justificativas e sincronização
            com frequência oficial da turma podem vir a substituir o registo
            manual e refinar o limite por carga horária total do semestre.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
