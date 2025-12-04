
import {
  sendAvaliacaoNotification,
  sendEventoNotification,
} from "@/lib/email/service";
export interface Avaliacao {
  id: string;
  disciplinaId: string;
  disciplina?: string;
  tipo: "prova" | "trabalho" | "seminario";
  dataISO: string;
  descricao?: string;
  horario?: string;
}
export interface Evento {
  id: string;
  titulo: string;
  tipo: "aula" | "evento";
  dataISO: string;
  horario?: string;
  local?: string;
}
export interface UserConfig {
  email: string;
  notificacoesEmail: boolean;
  notificacoesAvaliacoes: boolean;
  notificacoesEventos: boolean;
  diasAntecedencia?: number;
}
function calcularDiasRestantes(dataISO: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataEvento = new Date(dataISO);
  dataEvento.setHours(0, 0, 0, 0);
  const diff = Math.ceil(
    (dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}
export async function verificarEAvisarAvaliacoes(
  avaliacoes: Avaliacao[],
  userConfig: UserConfig
): Promise<{ enviadas: number; erros: number }> {
  if (!userConfig.notificacoesEmail || !userConfig.notificacoesAvaliacoes) {
    return { enviadas: 0, erros: 0 };
  }
  const diasAntecedencia = userConfig.diasAntecedencia || 1;
  let enviadas = 0;
  let erros = 0;
  for (const avaliacao of avaliacoes) {
    const diasRestantes = calcularDiasRestantes(avaliacao.dataISO);
    if (diasRestantes >= 0 && diasRestantes <= diasAntecedencia) {
      try {
        const result = await sendAvaliacaoNotification({
          to: userConfig.email,
          disciplina: avaliacao.disciplina || "Disciplina",
          tipo: avaliacao.tipo,
          data: avaliacao.dataISO,
          horario: avaliacao.horario,
          descricao: avaliacao.descricao,
          diasRestantes,
        });
        if (result.success) {
          enviadas++;
        } else {
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
  return { enviadas, erros };
}
export async function verificarEAvisarEventos(
  eventos: Evento[],
  userConfig: UserConfig
): Promise<{ enviadas: number; erros: number }> {
  if (!userConfig.notificacoesEmail || !userConfig.notificacoesEventos) {
    return { enviadas: 0, erros: 0 };
  }
  const diasAntecedencia = userConfig.diasAntecedencia || 1;
  let enviadas = 0;
  let erros = 0;
  for (const evento of eventos) {
    const diasRestantes = calcularDiasRestantes(evento.dataISO);
    if (diasRestantes >= 0 && diasRestantes <= diasAntecedencia) {
      try {
        const result = await sendEventoNotification({
          to: userConfig.email,
          titulo: evento.titulo,
          tipo: evento.tipo,
          data: evento.dataISO,
          horario: evento.horario,
          local: evento.local,
          diasRestantes,
        });
        if (result.success) {
          enviadas++;
        } else {
          erros++;
        }
      } catch (error) {
        console.error(
          `Erro ao enviar notificação para evento ${evento.id}:`,
          error
        );
        erros++;
      }
    }
  }
  return { enviadas, erros };
}