"use client";

import { useEffect } from "react";
import { useChamadaSidebar } from "./ChamadaSidebarContext";

/**
 * Dentro do ChamadaSidebarProvider: carrega dados do grupo e preenche groupInfo
 * para o modal de compartilhar (público vs privado) e o título da chamada.
 */
export function ChamadaGroupInfoLoader({ grupoId }: { grupoId: string }) {
  const { setGroupInfo } = useChamadaSidebar();

  useEffect(() => {
    if (!grupoId) return;
    let cancelled = false;
    fetch(`/api/colaboracao/grupos/${grupoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.grupo) return;
        const g = data.grupo;
        setGroupInfo({
          id: grupoId,
          nome: g.nome ?? "Chamada",
          visibilidade: g.visibilidade === "publico" ? "publico" : "privado",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [grupoId, setGroupInfo]);

  return null;
}
