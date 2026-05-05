import type { Disciplina } from "@/hooks/useDisciplinas";

/** Média do período / avaliações (ME): aprovação directa a partir deste valor. */
export const ME_APROVACAO_DIRETA_MIN = 8;

/**
 * Quando ME é inferior a 8, o valor **2×ME − 15** (critério pós-PF) compara-se
 * a este mínimo para aprovação nesse ramo.
 */
export const CRITERIO_POS_PF_MIN = 5;

/** MF habitual UFAM: N2 pesa o dobro de N1. */
export const MF_UFAM_PESO_N1 = 1;
export const MF_UFAM_PESO_N2 = 2;
export const MF_UFAM_DIVISOR = MF_UFAM_PESO_N1 + MF_UFAM_PESO_N2;

const LIMITE_FALTAS: Record<1 | 2 | 3, number> = {
  1: 5,
  2: 15,
  3: 21,
};

/** 75% de presença ≈ 25% de faltas; limites em “horas-aula” para 1/2/3 encontros por semana. */
export function limiteFaltasPorAulasSemana(aulas: 1 | 2 | 3): number {
  return LIMITE_FALTAS[aulas];
}

export type InferenciaAulasSemana = {
  aulas: 1 | 2 | 3 | null;
  /** Quantidade de horários semanais na disciplina (tamanho do array). */
  horariosCount: number;
  horasSemanaArred: number;
};

/**
 * Deduz encontros por semana: preferencialmente pelo n.º de horários;
 * se não houver horários, tenta `horasSemana` arredondado só se for 1–3.
 */
export function inferirAulasPorSemana(d: Disciplina): InferenciaAulasSemana {
  const horariosCount = d.horarios?.length ?? 0;
  if (horariosCount >= 1 && horariosCount <= 3) {
    return {
      aulas: horariosCount as 1 | 2 | 3,
      horariosCount,
      horasSemanaArred: Math.round(d.horasSemana ?? 0),
    };
  }
  const hs = Math.round(d.horasSemana ?? 0);
  if (horariosCount === 0 && hs >= 1 && hs <= 3) {
    return { aulas: hs as 1 | 2 | 3, horariosCount, horasSemanaArred: hs };
  }
  return {
    aulas: null,
    horariosCount,
    horasSemanaArred: hs,
  };
}

/** Critério pós-PF quando ME &lt; 8: 2×ME − 15. */
export function calcularCriterioPosPf(ME: number): number {
  return 2 * ME - 15;
}

/** @deprecated usar `calcularCriterioPosPf` */
export const criterioProvaFinalIndicador = calcularCriterioPosPf;

/**
 * MF no modelo **mais comum** na UFAM: média ponderada em que a 2ª nota (N2)
 * tem peso 2 e a 1ª (N1) tem peso 1 — MF = (N1 + 2×N2) / 3.
 * Outras disciplinas podem usar outras expressões (ex.: (P1+P2+T)/3) conforme
 * o plano de ensino.
 */
export function calcularMfUfamPadrao(n1: number, n2: number): number {
  return (MF_UFAM_PESO_N1 * n1 + MF_UFAM_PESO_N2 * n2) / MF_UFAM_DIVISOR;
}

export function calcularMfUfamPadraoNullable(
  n1: number | null,
  n2: number | null,
): number | null {
  if (n1 == null || n2 == null || Number.isNaN(n1) || Number.isNaN(n2)) {
    return null;
  }
  return calcularMfUfamPadrao(n1, n2);
}

export function parseNotaPt(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export type SituacaoME_PF =
  | { tipo: "sem_me" }
  | { tipo: "aprovado_me"; me: number }
  | { tipo: "aprovado_pf_indicador"; me: number; indicador: number }
  | { tipo: "reprovado_pf_indicador"; me: number; indicador: number };

/**
 * ME ≥ 8 → aprovação pela ME.
 * ME < 8 → critério pós-PF: 2×ME − 15 ≥ CRITERIO_POS_PF_MIN.
 */
export function situacaoMePf(me: number | null): SituacaoME_PF {
  if (me == null) return { tipo: "sem_me" };
  if (me >= ME_APROVACAO_DIRETA_MIN) {
    return { tipo: "aprovado_me", me };
  }
  const indicador = calcularCriterioPosPf(me);
  if (indicador >= CRITERIO_POS_PF_MIN) {
    return { tipo: "aprovado_pf_indicador", me, indicador };
  }
  return { tipo: "reprovado_pf_indicador", me, indicador };
}
