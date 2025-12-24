"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Reminder {
  id: string;
  tipo:
    | "avaliacao"
    | "tarefa"
    | "streak"
    | "revisao"
    | "sugestao"
    | "personalizado";
  titulo: string;
  descricao?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  agendado_para: string;
  enviado: boolean;
  enviado_em?: string;
  metadata?: any;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = useCallback(
    async (enviado?: boolean, tipo?: string) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (enviado !== undefined) {
          params.append("enviado", enviado.toString());
        }
        if (tipo) {
          params.append("tipo", tipo);
        }

        const response = await fetch(`/api/reminders?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setReminders(data.reminders || []);
        }
      } catch (error) {
        console.error("Erro ao carregar lembretes:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createReminder = useCallback(
    async (reminder: Partial<Reminder>) => {
      try {
        const response = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reminder),
        });

        if (response.ok) {
          const data = await response.json();
          await loadReminders();
          toast.success("Lembrete criado!");
          return data.reminder;
        } else {
          const error = await response.json();
          toast.error(error.error || "Erro ao criar lembrete");
          return null;
        }
      } catch (error) {
        console.error("Erro ao criar lembrete:", error);
        toast.error("Erro ao criar lembrete");
        return null;
      }
    },
    [loadReminders]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/reminders?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await loadReminders();
          toast.success("Lembrete deletado");
          return true;
        } else {
          toast.error("Erro ao deletar lembrete");
          return false;
        }
      } catch (error) {
        console.error("Erro ao deletar lembrete:", error);
        toast.error("Erro ao deletar lembrete");
        return false;
      }
    },
    [loadReminders]
  );

  const createAutoReminders = useCallback(
    async (tipo: "avaliacao" | "tarefa", referencia_id: string) => {
      try {
        const response = await fetch("/api/reminders/auto-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, referencia_id }),
        });

        if (response.ok) {
          const data = await response.json();
          await loadReminders();
          toast.success(
            `Lembretes automáticos criados para ${
              tipo === "avaliacao" ? "avaliação" : "tarefa"
            }!`
          );
          return data;
        } else {
          const error = await response.json();
          toast.error(error.error || "Erro ao criar lembretes");
          return null;
        }
      } catch (error) {
        console.error("Erro ao criar lembretes automáticos:", error);
        toast.error("Erro ao criar lembretes automáticos");
        return null;
      }
    },
    [loadReminders]
  );

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    loading,
    loadReminders,
    createReminder,
    deleteReminder,
    createAutoReminders,
  };
}
