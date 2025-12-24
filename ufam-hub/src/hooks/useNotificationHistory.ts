"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  lida: boolean;
  lida_em?: string;
  created_at: string;
  metadata?: any;
}

export function useNotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(
    async (lida?: boolean, tipo?: string, limit = 50) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (lida !== undefined) {
          params.append("lida", lida.toString());
        }
        if (tipo) {
          params.append("tipo", tipo);
        }
        params.append("limit", limit.toString());

        const response = await fetch(
          `/api/notifications/history?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setTotalNaoLidas(data.total_nao_lidas || 0);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(
    async (id?: string) => {
      try {
        const response = await fetch("/api/notifications/history", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            marcar_todas: !id,
          }),
        });

        if (response.ok) {
          await loadNotifications();
          if (id) {
            toast.success("Notificação marcada como lida");
          } else {
            toast.success("Todas as notificações marcadas como lidas");
          }
          return true;
        } else {
          toast.error("Erro ao atualizar notificação");
          return false;
        }
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
        toast.error("Erro ao atualizar notificação");
        return false;
      }
    },
    [loadNotifications]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    totalNaoLidas,
    loading,
    loadNotifications,
    markAsRead,
  };
}
