"use client";
import { useState, useEffect } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
export function GoogleCalendarIntegration() {
  const {
    isAuthenticated,
    isLoading,
    events,
    error,
    authenticate,
    disconnect,
    fetchEvents,
    createClassEvent,
    createAssessmentEvent,
  } = useGoogleCalendar();
  const [showEvents, setShowEvents] = useState(false);
  useEffect(() => {
    if (isAuthenticated && !showEvents) {
      fetchEvents();
      setShowEvents(true);
    }
  }, [isAuthenticated, fetchEvents, showEvents]);
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getEventColor = (colorId?: string) => {
    const colors: { [key: string]: string } = {
      "1": "bg-blue-100 text-blue-800 border-blue-200",
      "2": "bg-green-100 text-green-800 border-green-200",
      "3": "bg-purple-100 text-purple-800 border-purple-200",
      "4": "bg-red-100 text-red-800 border-red-200",
      "5": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "6": "bg-orange-100 text-orange-800 border-orange-200",
      "7": "bg-turquoise-100 text-turquoise-800 border-turquoise-200",
      "8": "bg-gray-100 text-gray-800 border-gray-200",
      "9": "bg-blue-100 text-blue-800 border-blue-200",
      "10": "bg-green-100 text-green-800 border-green-200",
      "11": "bg-red-100 text-red-800 border-red-200",
    };
    return colors[colorId || "1"] || colors["1"];
  };
  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Conecte seu calendário para sincronizar aulas e avaliações
            </p>
          </div>
          <Button
            onClick={authenticate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isLoading ? "Conectando..." : "Conectar"}
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
            <CheckCircle className="h-4 w-4 text-green-500" />
          </h3>
          <p className="text-sm text-gray-600">
            Conectado • {events.length} eventos encontrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEvents()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="h-4 w-4" />
            Desconectar
          </Button>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {events.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Próximos Eventos</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventColor(
                  event.colorId
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{event.summary}</h5>
                    {event.description && (
                      <p className="text-xs mt-1 opacity-80">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {event.start.dateTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(event.start.dateTime)}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees.length} participantes
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {events.length > 10 && (
            <p className="text-xs text-gray-500 text-center">
              Mostrando 10 de {events.length} eventos
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum evento encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            Crie eventos no seu Google Calendar ou sincronize suas disciplinas
          </p>
        </div>
      )}
    </Card>
  );
}
export function SyncDisciplinasWithCalendar() {
  const { createClassEvent, isAuthenticated } = useGoogleCalendar();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: number;
    error: number;
  } | null>(null);
  const syncDisciplinas = async () => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch("/api/disciplinas");
      if (!response.ok) {
        throw new Error("Erro ao buscar disciplinas");
      }
      const { disciplinas } = await response.json();
      if (!disciplinas || disciplinas.length === 0) {
        setSyncResult({ success: 0, error: 0 });
        return;
      }
      let successCount = 0;
      let errorCount = 0;
      const hoje = new Date();
      const dataInicioSemestre = hoje.toISOString().split("T")[0];
      const dataFimSemestre = new Date(hoje);
      dataFimSemestre.setMonth(hoje.getMonth() + 4);
      const dataFimSemestreStr = dataFimSemestre.toISOString().split("T")[0];
      for (const disciplina of disciplinas) {
        if (!disciplina.horarios || disciplina.horarios.length === 0) {
          continue;
        }
        for (const horario of disciplina.horarios) {
          try {
            const inicio = new Date(dataInicioSemestre);
            const fim = new Date(dataFimSemestreStr);
            const diasParaProximo = (horario.dia - inicio.getDay() + 7) % 7;
            inicio.setDate(inicio.getDate() + diasParaProximo);
            let dataAtual = new Date(inicio);
            let eventosCriados = 0;
            const maxEventos = 20;
            while (dataAtual <= fim && eventosCriados < maxEventos) {
              const dataStr = dataAtual.toISOString().split("T")[0];
              await createClassEvent(
                disciplina.nome,
                disciplina.professor || "Professor não informado",
                disciplina.local || "Local não informado",
                horario.dia,
                horario.inicio,
                horario.fim,
                dataStr,
                dataStr
              );
              dataAtual.setDate(dataAtual.getDate() + 7);
              eventosCriados++;
              successCount++;
            }
          } catch (error) {
            console.error(
              `Erro ao criar evento para ${disciplina.nome}:`,
              error
            );
            errorCount++;
          }
        }
      }
      setSyncResult({ success: successCount, error: errorCount });
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncResult({ success: 0, error: 1 });
    } finally {
      setIsSyncing(false);
    }
  };
  if (!isAuthenticated) {
    return null;
  }
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sincronizar Disciplinas</h4>
            <p className="text-sm text-gray-600">
              Crie eventos no Google Calendar para suas aulas
            </p>
          </div>
          <Button onClick={syncDisciplinas} disabled={isSyncing} size="sm">
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
        {syncResult && (
          <div
            className={`p-3 rounded-lg border ${
              syncResult.error > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p className="text-sm">
              {syncResult.success > 0 && (
                <span className="text-green-700">
                  ✓ {syncResult.success} eventos criados com sucesso
                </span>
              )}
              {syncResult.error > 0 && (
                <span className="text-yellow-700 ml-2">
                  ⚠ {syncResult.error} erros
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
export function SyncAvaliacoesWithCalendar() {
  const { createAssessmentEvent, isAuthenticated } = useGoogleCalendar();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: number;
    error: number;
  } | null>(null);
  const syncAvaliacoes = async () => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch("/api/avaliacoes");
      if (!response.ok) {
        throw new Error("Erro ao buscar avaliações");
      }
      const { avaliacoes } = await response.json();
      if (!avaliacoes || avaliacoes.length === 0) {
        setSyncResult({ success: 0, error: 0 });
        return;
      }
      const disciplinasResponse = await fetch("/api/disciplinas");
      const disciplinasData = await disciplinasResponse.json();
      const disciplinasMap = new Map(
        (disciplinasData.disciplinas || []).map((d: any) => [d.id, d.nome])
      );
      let successCount = 0;
      let errorCount = 0;
      for (const avaliacao of avaliacoes) {
        try {
          const disciplinaNome =
            disciplinasMap.get(avaliacao.disciplinaId) || "Disciplina";
          const dataISO = new Date(avaliacao.dataISO);
          const dataStr = dataISO.toISOString().split("T")[0];
          const horarioStr = dataISO.toTimeString().slice(0, 5);
          await createAssessmentEvent(
            disciplinaNome,
            avaliacao.tipo,
            dataStr,
            horarioStr,
            avaliacao.descricao || avaliacao.resumo_assuntos
          );
          successCount++;
        } catch (error) {
          console.error("Erro ao criar evento de avaliação:", error);
          errorCount++;
        }
      }
      setSyncResult({ success: successCount, error: errorCount });
    } catch (error) {
      console.error("Erro ao sincronizar avaliações:", error);
      setSyncResult({ success: 0, error: 1 });
    } finally {
      setIsSyncing(false);
    }
  };
  if (!isAuthenticated) {
    return null;
  }
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sincronizar Avaliações</h4>
            <p className="text-sm text-gray-600">
              Crie eventos no Google Calendar para suas avaliações
            </p>
          </div>
          <Button onClick={syncAvaliacoes} disabled={isSyncing} size="sm">
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
        {syncResult && (
          <div
            className={`p-3 rounded-lg border ${
              syncResult.error > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p className="text-sm">
              {syncResult.success > 0 && (
                <span className="text-green-700">
                  ✓ {syncResult.success} eventos criados com sucesso
                </span>
              )}
              {syncResult.error > 0 && (
                <span className="text-yellow-700 ml-2">
                  ⚠ {syncResult.error} erros
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}