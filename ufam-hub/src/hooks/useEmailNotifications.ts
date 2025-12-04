"use client";
import { useEffect, useCallback } from "react";
interface Avaliacao {
  id: string;
  disciplinaId: string;
  tipo: "prova" | "trabalho" | "seminario";
  dataISO: string;
  descricao?: string;
  horario?: string;
}
interface Disciplina {
  id: string;
  nome: string;
}

export function useEmailNotifications() {
  const calcularDiasRestantes = useCallback((dataISO: string): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEvento = new Date(dataISO);
    dataEvento.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  }, []);
  const verificarEAvisarAvaliacoes = useCallback(
    async (avaliacoes: Avaliacao[], disciplinas: Disciplina[]) => {
      const notificacoesEmail =
        localStorage.getItem("config:notificacoes:email") === "true";
      const notificacoesAvaliacoes =
        localStorage.getItem("config:notificacoes:avaliacoes") === "true";
      const emailUsuario = localStorage.getItem("config:email:usuario");
      const diasAntecedencia = Number(
        localStorage.getItem("config:notificacoes:diasAntecedencia") || "1"
      );
      if (
        !notificacoesEmail ||
        !notificacoesAvaliacoes ||
        !emailUsuario ||
        !emailUsuario.includes("@")
      ) {
        return { enviadas: 0, erros: 0 };
      }
      const disciplinasMap = new Map(disciplinas.map((d) => [d.id, d.nome]));
      let enviadas = 0;
      let erros = 0;
      for (const avaliacao of avaliacoes) {
        const diasRestantes = calcularDiasRestantes(avaliacao.dataISO);
        if (diasRestantes >= 0 && diasRestantes <= diasAntecedencia) {
          const keyNotificacao = `notif:email:${
            avaliacao.id
          }:${new Date().toDateString()}`;
          const jaNotificado = localStorage.getItem(keyNotificacao);
          if (!jaNotificado) {
            try {
              const disciplinaNome =
                disciplinasMap.get(avaliacao.disciplinaId) || "Disciplina";
              const response = await fetch("/api/notifications/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "avaliacao",
                  data: {
                    to: emailUsuario,
                    disciplina: disciplinaNome,
                    tipo: avaliacao.tipo,
                    data: avaliacao.dataISO,
                    horario: avaliacao.horario,
                    descricao: avaliacao.descricao,
                    diasRestantes,
                  },
                }),
              });
              const contentType = response.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                console.error(
                  `Erro ao enviar notificação: resposta não é JSON (status ${response.status})`
                );
                erros++;
                return;
              }
              if (response.ok) {
                localStorage.setItem(keyNotificacao, "true");
                enviadas++;
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                  `Erro ao enviar notificação:`,
                  errorData.error || `Status ${response.status}`
                );
                erros++;
              }
            } catch (error) {
              console.error(
                `Erro ao enviar notificação para avaliação ${avaliacao.id}:`,
                error
              );
              erros++;
            }
          }
        }
      }
      return { enviadas, erros };
    },
    [calcularDiasRestantes]
  );
  return {
    verificarEAvisarAvaliacoes,
  };
}