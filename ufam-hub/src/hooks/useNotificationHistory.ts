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
          `/api/notifications/history?${params.toString()}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setTotalNaoLidas(data.total_nao_lidas ?? 0);
        } else {
          setNotifications([]);
          setTotalNaoLidas(0);
          // 401 é esperado quando não há sessão (ex.: após logout); não poluir o console
          if (response.status !== 401) {
            console.error("Erro ao carregar histórico:", response.status, response.statusText);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        setNotifications([]);
        setTotalNaoLidas(0);
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
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            marcar_todas: !id,
          }),
        });

        if (response.ok) {
          if (id) {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
            );
            setTotalNaoLidas((prev) => Math.max(0, prev - 1));
            toast.success("Notificação marcada como lida");
          } else {
            setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
            setTotalNaoLidas(0);
            toast.success("Todas as notificações marcadas como lidas");
          }
          await loadNotifications();
          return true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Erro ao atualizar notificação");
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
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    totalNaoLidas,
    loading,
    loadNotifications,
    markAsRead,
  };
}
