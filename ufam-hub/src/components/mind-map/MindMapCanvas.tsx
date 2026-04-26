"use client";

import type { MapaMentalData } from "@/types/mind-map";
import { MindMapFlowCanvas } from "./MindMapFlowCanvas";
import { cn } from "@/lib/utils";

type Props = {
  data: MapaMentalData;
  selectedRamoId: string | null;
  onSelectRamo: (id: string) => void;
  onOpenRamoPanel: (id: string) => void;
  className?: string;
};

/** Canvas em fluxograma (nós + curvas), alinhado ao estilo “Mind Mandala” / diagrama. */
export function MindMapCanvas(props: Props) {
  return (
    <div className={cn("w-full", props.className)}>
      <MindMapFlowCanvas {...props} />
      <p className="mt-2 text-center text-xs text-[#737373]">
        Arrasta o fundo para mover · scroll para zoom · clique num tópico para editar
      </p>
    </div>
  );
}
