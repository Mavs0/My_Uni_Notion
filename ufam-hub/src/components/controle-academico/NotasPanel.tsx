"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Disciplina } from "@/hooks/useDisciplinas";
import { useAvaliacoes, type Avaliacao } from "@/hooks/useAvaliacoes";
import {
  CRITERIO_POS_PF_MIN,
  MF_UFAM_DIVISOR,
  MF_UFAM_PESO_N1,
  MF_UFAM_PESO_N2,
  ME_APROVACAO_DIRETA_MIN,
  calcularCriterioPosPf,
  calcularMfUfamPadraoNullable,
  parseNotaPt,
  situacaoMePf,
} from "@/lib/controle-academico/business-rules";
import {
  getRegistoME,
  loadMapaME,
  saveMapaME,
} from "@/lib/controle-academico/storage";
import type { MapaME, RegistoMEDisciplina } from "@/lib/controle-academico/types";
import { cn } from "@/lib/utils";

function labelTipo(t: Avaliacao["tipo"]) {
  if (t === "prova") return "Prova";
  if (t === "trabalho") return "Trabalho";
  return "Seminário";
}

function fmtNum(n: number | undefined | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function mediaPonderada(avs: Avaliacao[]): number | null {
  let s = 0;
  let w = 0;
  for (const a of avs) {
    if (a.nota == null || Number.isNaN(Number(a.nota))) continue;
    const peso =
      a.peso != null && !Number.isNaN(Number(a.peso)) ? Number(a.peso) : 1;
    if (peso <= 0) continue;
    s += Number(a.nota) * peso;
    w += peso;
  }
  if (w === 0) return null;
  return s / w;
}

type NotasPanelProps = {
  disciplinas: Disciplina[];
  loadingDisciplinas: boolean;
};

export function NotasPanel({
  disciplinas,
  loadingDisciplinas,
}: NotasPanelProps) {
  const ativas = useMemo(
    () => disciplinas.filter((d) => d.ativo !== false),
    [disciplinas],
  );
  const [discId, setDiscId] = useState<string>("");
  const [mapME, setMapME] = useState<MapaME>({});

  useEffect(() => {
    setMapME(loadMapaME());
  }, []);

  const registoDisc = discId ? getRegistoME(mapME, discId) : null;
  const meTexto = registoDisc?.meTexto ?? "";
  const n1Texto = registoDisc?.n1Texto ?? "";
  const n2Texto = registoDisc?.n2Texto ?? "";

  const patchRegistoDisc = useCallback(
    (patch: Partial<RegistoMEDisciplina>) => {
      if (!discId) return;
      setMapME((prev) => {
        const cur = getRegistoME(prev, discId);
        const next = { ...prev, [discId]: { ...cur, ...patch } };
        saveMapaME(next);
        return next;
      });
    },
    [discId],
  );

  const setMeTexto = useCallback(
    (t: string) => patchRegistoDisc({ meTexto: t }),
    [patchRegistoDisc],
  );
  const setN1Texto = useCallback(
    (t: string) => patchRegistoDisc({ n1Texto: t }),
    [patchRegistoDisc],
  );
  const setN2Texto = useCallback(
    (t: string) => patchRegistoDisc({ n2Texto: t }),
    [patchRegistoDisc],
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <LineChart className="h-5 w-5 text-muted-foreground" />
            Controle de notas (ME / PF / MF)
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            A <strong className="text-foreground">ME</strong> é a média do
            período (valor do orientador). A <strong className="text-foreground">MF</strong>{" "}
            habitual na UFAM usa{" "}
            <span className="font-mono text-foreground">
              (N1 + 2×N2) / {MF_UFAM_DIVISOR}
            </span>
            ; outras disciplinas podem seguir o plano de ensino. O critério{" "}
            <span className="font-mono text-foreground">2×ME − 15</span> aplica-se
            quando <strong className="text-foreground">ME &lt; {ME_APROVACAO_DIRETA_MIN.toFixed(1)}</strong>{" "}
            (prova final / aprovação nesse ramo).
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
            <p className="font-medium text-foreground">Regras de negócio</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">MF (modelo UFAM frequente):</span>{" "}
                <span className="font-mono text-foreground">
                  MF = ({MF_UFAM_PESO_N1}×N1 + {MF_UFAM_PESO_N2}×N2) / {MF_UFAM_DIVISOR}
                </span>
                — N1 é a 1ª avaliação, N2 a 2ª (ex.: 2ª prova ou prova final
                nesse esquema). Outras combinações são possíveis (ex.:{" "}
                <span className="font-mono">(P1 + P2 + T) / 3</span>) conforme o
                plano de ensino.
              </li>
              <li>
                Se <span className="font-medium text-foreground">ME ≥ {ME_APROVACAO_DIRETA_MIN.toFixed(1)}</span>
                , aprovação pelo critério da ME (sem necessidade de PF neste
                modelo).
              </li>
              <li>
                Se <span className="font-medium text-foreground">ME &lt; {ME_APROVACAO_DIRETA_MIN.toFixed(1)}</span>
                , critério pós-PF:{" "}
                <span className="font-mono text-foreground">2×ME − 15</span>. Se
                for{" "}
                <span className="font-medium text-foreground">
                  ≥ {CRITERIO_POS_PF_MIN.toFixed(1)}
                </span>
                , situação compatível com aprovação nesse critério; caso
                contrário, reprovação nesse critério.
              </li>
            </ul>
          </div>

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

          {discId ? (
            <NotasPorDisciplina
              disciplinaId={discId}
              meTexto={meTexto}
              n1Texto={n1Texto}
              n2Texto={n2Texto}
              onMeTextoChange={setMeTexto}
              onN1TextoChange={setN1Texto}
              onN2TextoChange={setN2Texto}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolhe uma disciplina para veres as avaliações, a média parcial e
              a situação face às regras ME / PF.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-dashed border-border/80 bg-muted/10">
        <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Outras fórmulas de MF</p>
          <p className="mt-2">
            Se a tua disciplina usar pesos diferentes, médias parciais extra ou
            arredondamentos específicos, confirma sempre no plano de ensino. No
            futuro poderemos guardar um “modelo de MF” por disciplina (UFAM
            padrão, média simples de três provas, etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LinkAvaliacoes() {
  return (
    <Link
      href="/avaliacoes"
      className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:mt-0"
    >
      <GraduationCap className="h-4 w-4" />
      Gerir avaliações
    </Link>
  );
}

function NotasPorDisciplina({
  disciplinaId,
  meTexto,
  n1Texto,
  n2Texto,
  onMeTextoChange,
  onN1TextoChange,
  onN2TextoChange,
}: {
  disciplinaId: string;
  meTexto: string;
  n1Texto: string;
  n2Texto: string;
  onMeTextoChange: (t: string) => void;
  onN1TextoChange: (t: string) => void;
  onN2TextoChange: (t: string) => void;
}) {
  const { avaliacoes, loading } = useAvaliacoes({ disciplinaId });
  const mediaParcial = useMemo(() => mediaPonderada(avaliacoes), [avaliacoes]);
  const meValor = parseNotaPt(meTexto);
  const n1Val = parseNotaPt(n1Texto);
  const n2Val = parseNotaPt(n2Texto);
  const mfUfam = useMemo(
    () => calcularMfUfamPadraoNullable(n1Val, n2Val),
    [n1Val, n2Val],
  );
  const situacao = situacaoMePf(meValor);
  const criterioPosPf =
    meValor != null && meValor < ME_APROVACAO_DIRETA_MIN
      ? calcularCriterioPosPf(meValor)
      : null;

  const semNota = avaliacoes.filter(
    (a) => a.nota == null || Number.isNaN(Number(a.nota)),
  ).length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="me-input">ME (média do período — valor oficial)</Label>
          <Input
            id="me-input"
            inputMode="decimal"
            placeholder="Ex.: 7,5"
            className="h-11 rounded-xl font-medium"
            value={meTexto}
            onChange={(e) => onMeTextoChange(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-lg"
            disabled={mediaParcial == null}
            onClick={() =>
              onMeTextoChange(
                mediaParcial!.toLocaleString("pt-PT", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                }),
              )
            }
          >
            Usar média parcial como referência
          </Button>
          <p className="text-xs text-muted-foreground">
            O botão só copia a média ponderada das avaliações; a ME válida é a
            que o professor/orientador atribuir.
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-4",
            mediaParcial == null
              ? "border-border/60 bg-muted/15"
              : "border-border/80 bg-muted/25",
          )}
        >
          <p className="text-sm font-medium text-muted-foreground">
            Média parcial (app)
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {mediaParcial != null
              ? mediaParcial.toLocaleString("pt-PT", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </p>
          <LinkAvaliacoes />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
        <p className="text-sm font-medium text-foreground">
          MF — modelo UFAM habitual
        </p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          MF = ({MF_UFAM_PESO_N1}×N1 + {MF_UFAM_PESO_N2}×N2) / {MF_UFAM_DIVISOR}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n1-input">N1 (1ª avaliação)</Label>
            <Input
              id="n1-input"
              inputMode="decimal"
              placeholder="Ex.: 7"
              className="h-11 rounded-xl"
              value={n1Texto}
              onChange={(e) => onN1TextoChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="n2-input">N2 (2ª avaliação / prova final)</Label>
            <Input
              id="n2-input"
              inputMode="decimal"
              placeholder="Ex.: 8,5"
              className="h-11 rounded-xl"
              value={n2Texto}
              onChange={(e) => onN2TextoChange(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-2 border-t border-border/50 pt-4">
          <span className="text-sm text-muted-foreground">MF calculada</span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {mfUfam != null
              ? mfUfam.toLocaleString("pt-PT", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl border p-4",
          situacao.tipo === "sem_me"
            ? "border-border/60 bg-muted/15"
            : situacao.tipo === "aprovado_me"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : situacao.tipo === "aprovado_pf_indicador"
                ? "border-emerald-500/25 bg-emerald-500/5"
                : "border-destructive/30 bg-destructive/5",
        )}
      >
        <p className="text-sm font-medium text-foreground">Situação (ME / PF)</p>
        {situacao.tipo === "sem_me" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Informa a ME (ou usa a referência da média parcial) para veres a
            situação face às regras.
          </p>
        ) : situacao.tipo === "aprovado_me" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Com ME ={" "}
            <span className="font-semibold text-foreground">
              {situacao.me.toLocaleString("pt-PT", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            : aprovação pelo critério da ME (ME ≥ {ME_APROVACAO_DIRETA_MIN.toFixed(1)}).
          </p>
        ) : situacao.tipo === "aprovado_pf_indicador" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            ME ={" "}
            <span className="font-semibold text-foreground">
              {situacao.me.toLocaleString("pt-PT", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            (&lt; {ME_APROVACAO_DIRETA_MIN.toFixed(1)}). Critério pós-PF:{" "}
            <span className="font-mono text-foreground">
              2×ME − 15 = {situacao.indicador.toLocaleString("pt-PT", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            (≥ {CRITERIO_POS_PF_MIN.toFixed(1)}) →{" "}
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              compatível com aprovação neste critério
            </span>
            .
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            ME ={" "}
            <span className="font-semibold text-foreground">
              {situacao.me.toLocaleString("pt-PT", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            . Critério pós-PF:{" "}
            <span className="font-mono text-foreground">
              2×ME − 15 = {situacao.indicador.toLocaleString("pt-PT", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            (&lt; {CRITERIO_POS_PF_MIN.toFixed(1)}) →{" "}
            <span className="font-medium text-destructive">
              reprovação neste critério
            </span>
            .
          </p>
        )}
        {criterioPosPf != null && meValor != null ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Critério explícito: 2×{meValor.toFixed(2).replace(".", ",")} − 15 ={" "}
            {criterioPosPf.toFixed(2).replace(".", ",")}.
          </p>
        ) : null}
      </div>

      {semNota > 0 ? (
        <p className="text-xs text-muted-foreground">
          {semNota} avaliação(ões) ainda sem nota — não entram na média parcial.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Peso</TableHead>
              <TableHead className="text-right">Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm">
                  A carregar…
                </TableCell>
              </TableRow>
            ) : avaliacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm">
                  Sem avaliações nesta disciplina.
                </TableCell>
              </TableRow>
            ) : (
              avaliacoes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {labelTipo(a.tipo)}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {a.descricao?.trim() || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtNum(a.peso)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtNum(a.nota)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
