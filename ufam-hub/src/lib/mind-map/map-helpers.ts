import type { MapaMentalData, MindMapRamo, MindMapSubRamo } from "@/types/mind-map";
import { mkMindMapId } from "./ids";

export function ensureMapShape(data: MapaMentalData): MapaMentalData {
  return {
    ...data,
    ramos: (data.ramos || []).map((r) => ({
      ...r,
      notas: r.notas,
      id: r.id || mkMindMapId("r"),
      subramos: (r.subramos || []).map((s) => ({
        ...s,
        id: s.id || mkMindMapId("s"),
      })),
    })),
  };
}

export function updateRamo(
  data: MapaMentalData,
  ramoId: string,
  patch: Partial<MindMapRamo>
): MapaMentalData {
  return {
    ...data,
    ramos: data.ramos.map((r) =>
      r.id === ramoId ? { ...r, ...patch, id: r.id } : r
    ),
  };
}

export function removeRamo(data: MapaMentalData, ramoId: string): MapaMentalData {
  return { ...data, ramos: data.ramos.filter((r) => r.id !== ramoId) };
}

export function addRamo(
  data: MapaMentalData,
  ramo: Omit<MindMapRamo, "id"> & { id?: string }
): MapaMentalData {
  const r: MindMapRamo = {
    ...ramo,
    id: ramo.id || mkMindMapId("r"),
    subramos: ramo.subramos || [],
  };
  return { ...data, ramos: [...data.ramos, r] };
}

export function addSubramo(
  data: MapaMentalData,
  ramoId: string,
  sub: Omit<MindMapSubRamo, "id"> & { id?: string }
): MapaMentalData {
  const s: MindMapSubRamo = {
    ...sub,
    id: sub.id || mkMindMapId("s"),
  };
  return updateRamo(data, ramoId, {
    subramos: [...(data.ramos.find((x) => x.id === ramoId)?.subramos || []), s],
  });
}

export function updateSubramo(
  data: MapaMentalData,
  ramoId: string,
  subId: string,
  patch: Partial<MindMapSubRamo>
): MapaMentalData {
  return {
    ...data,
    ramos: data.ramos.map((r) => {
      if (r.id !== ramoId) return r;
      return {
        ...r,
        subramos: (r.subramos || []).map((s) =>
          s.id === subId ? { ...s, ...patch, id: s.id } : s
        ),
      };
    }),
  };
}

export function removeSubramo(
  data: MapaMentalData,
  ramoId: string,
  subId: string
): MapaMentalData {
  return {
    ...data,
    ramos: data.ramos.map((r) =>
      r.id === ramoId
        ? {
            ...r,
            subramos: (r.subramos || []).filter((s) => s.id !== subId),
          }
        : r
    ),
  };
}

export function buildTopicoContext(ramo: MindMapRamo): string {
  const lines: string[] = [
    `Tópico: ${ramo.texto}`,
    ramo.notas ? `Notas: ${ramo.notas}` : "",
    "Subitens:",
  ].filter(Boolean) as string[];
  for (const s of ramo.subramos || []) {
    lines.push(`- ${s.texto}${s.detalhes ? ` — ${s.detalhes}` : ""}`);
  }
  return lines.join("\n");
}

export function mapToPlainContext(data: MapaMentalData): string {
  const lines: string[] = [
    `Título: ${data.titulo}`,
    `Descrição: ${data.descricao}`,
    `Nó central: ${data.nocentral.texto}`,
    `Resumo: ${data.resumo}`,
    "Ramos:",
  ];
  for (const r of data.ramos) {
    lines.push(`- ${r.texto}`);
    for (const s of r.subramos || []) {
      lines.push(`  • ${s.texto}${s.detalhes ? ` — ${s.detalhes}` : ""}`);
    }
  }
  return lines.join("\n");
}
