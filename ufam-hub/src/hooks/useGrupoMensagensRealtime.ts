"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function useGrupoMensagensRealtime(
  grupoId: string | undefined,
  onMessage: () => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!grupoId) return;

    const supabase = createSupabaseBrowser();
    const channelName = `grupo-mensagens:${grupoId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "grupo_mensagens",
          filter: `grupo_id=eq.${grupoId}`,
        },
        () => {
          onMessageRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "grupo_mensagens",
          filter: `grupo_id=eq.${grupoId}`,
        },
        () => {
          onMessageRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "grupo_mensagens",
          filter: `grupo_id=eq.${grupoId}`,
        },
        () => {
          onMessageRef.current();
        }
      )
      .subscribe(() => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [grupoId]);
}
