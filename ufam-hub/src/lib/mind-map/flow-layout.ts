import type { Edge, Node } from "@xyflow/react";
import type { MapaMentalData } from "@/types/mind-map";

export const MM_FLOW_ROOT_ID = "mm-root";

export type MindMapFlowNodeData = {
  kind: "root" | "ramo" | "sub";
  label: string;
  color: string;
  subtitle?: string;
  ramoId?: string;
  selected?: boolean;
};

const ROOT_W = 232;
const ROOT_H = 68;
const RAMO_W = 260;
const RAMO_BASE_H = 56;
const SUB_W = 228;
/** Distância do centro ao centro do ramo — deve ser > metade(root)+metade(ramo) para haver “fio” visível entre eles. */
const MAIN_R = 300;
/** Espaço entre caixas ao longo do raio (tópico → subtópico). */
const CHAIN_GAP = 36;

function estimateRamoHeight(texto: string, notas?: string): number {
  const lines = Math.ceil(texto.length / 28) || 1;
  let h = RAMO_BASE_H + Math.max(0, lines - 1) * 18;
  if (notas?.trim()) h += 22;
  return Math.min(h, 140);
}

function estimateSubHeight(texto: string, detalhes?: string): number {
  const lines = Math.ceil(texto.length / 26) || 1;
  let h = 40 + Math.max(0, lines - 1) * 16;
  if (detalhes?.trim()) h += Math.min(48, 16 + Math.ceil(detalhes.length / 32) * 14);
  return Math.min(h, 120);
}

/** Layout radial: centro → ramos em arco → subitens ao longo do mesmo raio. */
export function mapDataToMindMapFlow(
  data: MapaMentalData,
  selectedRamoId: string | null
): { nodes: Node<MindMapFlowNodeData>[]; edges: Edge[] } {
  const CX = 460;
  const CY = 340;

  const nodes: Node<MindMapFlowNodeData>[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: MM_FLOW_ROOT_ID,
    type: "mindMap",
    position: { x: CX - ROOT_W / 2, y: CY - ROOT_H / 2 },
    data: {
      kind: "root",
      label: data.nocentral.texto,
      color: data.nocentral.cor,
      selected: false,
    },
  });

  const ramos = data.ramos;
  const n = ramos.length;
  const angles =
    n === 0
      ? []
      : n === 1
        ? [-Math.PI / 2]
        : Array.from(
            { length: n },
            (_, i) => -Math.PI * 0.9 + (Math.PI * 1.8 * i) / Math.max(n - 1, 1)
          );

  for (let i = 0; i < n; i++) {
    const r = ramos[i]!;
    const ang = angles[i]!;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const rh = estimateRamoHeight(r.texto, r.notas);
    const rcx = CX + MAIN_R * cos;
    const rcy = CY + MAIN_R * sin;

    nodes.push({
      id: r.id,
      type: "mindMap",
      position: { x: rcx - RAMO_W / 2, y: rcy - rh / 2 },
      data: {
        kind: "ramo",
        label: r.texto,
        color: r.cor,
        subtitle: r.notas?.trim() || undefined,
        ramoId: r.id,
        selected: selectedRamoId === r.id,
      },
    });

    edges.push({
      id: `e-root-${r.id}`,
      source: MM_FLOW_ROOT_ID,
      target: r.id,
      type: "default",
      style: { stroke: r.cor, strokeWidth: 2.6 },
    });

    const subs = r.subramos ?? [];
    const ramoHalfAlong = RAMO_W / 2;
    const subHalfAlong = SUB_W / 2;
    /** Distância do centro global ao centro do próximo sub (ao longo do raio). */
    let distFromCenter =
      MAIN_R + ramoHalfAlong + CHAIN_GAP + subHalfAlong;

    for (let j = 0; j < subs.length; j++) {
      const s = subs[j]!;
      const sh = estimateSubHeight(s.texto, s.detalhes);
      const sx = CX + distFromCenter * cos;
      const sy = CY + distFromCenter * sin;
      const nid = `${r.id}__${s.id}`;
      nodes.push({
        id: nid,
        type: "mindMap",
        position: { x: sx - SUB_W / 2, y: sy - sh / 2 },
        data: {
          kind: "sub",
          label: s.texto,
          color: r.cor,
          subtitle: s.detalhes?.trim() || undefined,
          ramoId: r.id,
          selected: selectedRamoId === r.id,
        },
      });
      edges.push({
        id: `e-${r.id}-${nid}`,
        source: r.id,
        target: nid,
        type: "default",
        style: { stroke: r.cor, strokeWidth: 2.2 },
      });
      distFromCenter += subHalfAlong + CHAIN_GAP + subHalfAlong;
    }
  }

  return { nodes, edges };
}
