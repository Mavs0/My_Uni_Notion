export const STORAGE_FALTAS_KEY = "ufam-hub:controle-faltas:v1";
export const STORAGE_ME_DISCIPLINA_KEY = "ufam-hub:controle-me-disciplina:v1";

/** Só faltas registadas e eventual override de aulas/semana (1–3). */
export type RegistoFaltasDisciplina = {
  faltasRegistradas: number;
  /** Se a disciplina não permitir inferir 1–3 encontros, o utilizador define aqui. */
  aulasPorSemanaManual?: 1 | 2 | 3;
};

export type MapaFaltas = Record<string, RegistoFaltasDisciplina>;

/** ME e notas para MF no modelo UFAM habitual (N1, N2). */
export type RegistoMEDisciplina = {
  /** Texto livre para permitir vírgula decimal. */
  meTexto: string;
  /** 1ª avaliação (prova, trabalho, etc.) — MF padrão UFAM. */
  n1Texto: string;
  /** 2ª avaliação (ex.: 2ª prova / prova final) — peso 2 na MF padrão. */
  n2Texto: string;
};

export type MapaME = Record<string, RegistoMEDisciplina>;
