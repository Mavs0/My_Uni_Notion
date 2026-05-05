import {
  STORAGE_FALTAS_KEY,
  STORAGE_ME_DISCIPLINA_KEY,
  type MapaFaltas,
  type MapaME,
  type RegistoFaltasDisciplina,
  type RegistoMEDisciplina,
} from "./types";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function migrateMapaFaltas(raw: unknown): MapaFaltas {
  if (raw == null || typeof raw !== "object") return {};
  const out: MapaFaltas = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const row = v as Record<string, unknown>;
    const fr = Math.max(
      0,
      Math.floor(Number(row.faltasRegistradas ?? 0) || 0),
    );
    const manual = row.aulasPorSemanaManual;
    const aulasPorSemanaManual =
      manual === 1 || manual === 2 || manual === 3 ? manual : undefined;
    out[k] = { faltasRegistradas: fr, aulasPorSemanaManual };
  }
  return out;
}

export function loadMapaFaltas(): MapaFaltas {
  if (typeof window === "undefined") return {};
  const raw = safeParse<unknown>(
    localStorage.getItem(STORAGE_FALTAS_KEY),
    {},
  );
  return migrateMapaFaltas(raw);
}

export function saveMapaFaltas(mapa: MapaFaltas) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_FALTAS_KEY, JSON.stringify(mapa));
}

export function getRegistoFaltas(
  mapa: MapaFaltas,
  disciplinaId: string,
): RegistoFaltasDisciplina {
  return mapa[disciplinaId] ?? { faltasRegistradas: 0 };
}

function migrateMapaME(raw: unknown): MapaME {
  if (raw == null || typeof raw !== "object") return {};
  const out: MapaME = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const row = v as Record<string, unknown>;
    const t =
      typeof row.meTexto === "string"
        ? row.meTexto
        : typeof row.me === "string"
          ? row.me
          : typeof row.me === "number"
            ? String(row.me)
            : "";
    const n1 =
      typeof row.n1Texto === "string"
        ? row.n1Texto
        : typeof row.n1 === "string"
          ? row.n1
          : typeof row.n1 === "number"
            ? String(row.n1)
            : "";
    const n2 =
      typeof row.n2Texto === "string"
        ? row.n2Texto
        : typeof row.n2 === "string"
          ? row.n2
          : typeof row.n2 === "number"
            ? String(row.n2)
            : "";
    out[k] = { meTexto: t, n1Texto: n1, n2Texto: n2 };
  }
  return out;
}

export function loadMapaME(): MapaME {
  if (typeof window === "undefined") return {};
  const raw = safeParse<unknown>(
    localStorage.getItem(STORAGE_ME_DISCIPLINA_KEY),
    {},
  );
  return migrateMapaME(raw);
}

export function saveMapaME(mapa: MapaME) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ME_DISCIPLINA_KEY, JSON.stringify(mapa));
}

export function getRegistoME(
  mapa: MapaME,
  disciplinaId: string,
): RegistoMEDisciplina {
  return mapa[disciplinaId] ?? { meTexto: "", n1Texto: "", n2Texto: "" };
}
