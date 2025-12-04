"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  GoogleCalendarIntegration,
  SyncDisciplinasWithCalendar,
} from "@/components/GoogleCalendarIntegration";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
export default function CalendarPage() {
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    events,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createClassEvent,
    createAssessmentEvent,
  } = useGoogleCalendar();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });
  const filteredEvents = events.filter(
    (event) =>
      event.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  useEffect(() => {
    if (searchParams.get("action") === "new" && isAuthenticated) {
      setShowCreateForm(true);
      window.history.replaceState({}, "", "/calendar");
    }
  }, [searchParams, isAuthenticated]);
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.summary.trim()) {
      toast.error("Por favor, preencha o título do evento");
      return;
    }
    if (!newEvent.start) {
      toast.error("Por favor, preencha a data e hora de início");
      return;
    }
    if (!newEvent.end) {
      toast.error("Por favor, preencha a data e hora de fim");
      return;
    }
    const formatDateTime = (localDateTime: string): string => {
      if (!localDateTime) return "";
      const date = new Date(localDateTime);
      if (isNaN(date.getTime())) {
        throw new Error("Data inválida");
      }
      return date.toISOString();
    };
    try {
      const startDateTime = formatDateTime(newEvent.start);
      const endDateTime = formatDateTime(newEvent.end);
      if (!startDateTime || !endDateTime) {
        toast.error("Erro ao processar datas. Verifique o formato.");
        return;
      }
      await createEvent({
        summary: newEvent.summary.trim(),
        description: newEvent.description?.trim() || undefined,
        start: {
          dateTime: startDateTime,
          timeZone: "America/Manaus",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "America/Manaus",
        },
        location: newEvent.location?.trim() || undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 15 },
            { method: "email", minutes: 60 },
          ],
        },
      });
      setNewEvent({
        summary: "",
        description: "",
        start: "",
        end: "",
        location: "",
      });
      setShowCreateForm(false);
      toast.success("Evento criado com sucesso!");
      await fetchEvents();
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      const errorMessage =
        error?.message || "Erro ao criar evento. Tente novamente.";
      toast.error(errorMessage);
    }
  };
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
      "1": "bg-blue-500 text-white",
      "2": "bg-green-500 text-white",
      "3": "bg-purple-500 text-white",
      "4": "bg-red-500 text-white",
      "5": "bg-yellow-500 text-white",
      "6": "bg-orange-500 text-white",
      "7": "bg-teal-500 text-white",
      "8": "bg-gray-500 text-white",
      "9": "bg-blue-500 text-white",
      "10": "bg-green-500 text-white",
      "11": "bg-red-500 text-white",
    };
    return colors[colorId || "1"] || colors["1"];
  };
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      if (!event.start.dateTime && !event.start.date) return false;
      const eventDate = new Date(
        event.start.dateTime || event.start.date || ""
      );
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Google Calendar
          </h1>
          <p className="text-zinc-500">
            Gerencie seus eventos e sincronize com suas disciplinas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchEvents()}
            disabled={!isAuthenticated}
          >
            <Download className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!isAuthenticated}
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </header>
      {}
      <GoogleCalendarIntegration />
      {}
      {isAuthenticated && <SyncDisciplinasWithCalendar />}
      {}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Evento</DialogTitle>
            <DialogDescription>
              Preencha os dados do evento. Campos marcados com * são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="event-title" className="text-sm font-medium">
                  Título <span className="text-red-500">*</span>
                </label>
                <Input
                  id="event-title"
                  value={newEvent.summary}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, summary: e.target.value })
                  }
                  placeholder="Nome do evento"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="event-location" className="text-sm font-medium">
                  Local
                </label>
                <Input
                  id="event-location"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  placeholder="Local do evento"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="event-description"
                className="text-sm font-medium"
              >
                Descrição
              </label>
              <textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                placeholder="Descrição do evento"
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="event-start" className="text-sm font-medium">
                  Início <span className="text-red-500">*</span>
                </label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="event-end" className="text-sm font-medium">
                  Fim <span className="text-red-500">*</span>
                </label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEvent({
                    summary: "",
                    description: "",
                    start: "",
                    end: "",
                    location: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Evento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {}
      {isAuthenticated && (
        <Card className="p-6">
          {}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
          {}
          <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
            {}
            <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800/50 border-b">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>
            {}
            <div className="grid grid-cols-7">
              {getCalendarDays().map((date, index) => {
                const isToday =
                  date &&
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const isSelected =
                  selectedDate &&
                  date &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();
                const isCurrentMonth =
                  date && date.getMonth() === currentDate.getMonth();
                const dayEvents = date ? getEventsForDate(date) : [];
                const filteredDayEvents = dayEvents.filter((event) =>
                  searchTerm
                    ? event.summary
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      event.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    : true
                );
                if (!date) {
                  return (
                    <div
                      key={index}
                      className="min-h-[120px] border-r border-b bg-zinc-50/30 dark:bg-zinc-900/30"
                    />
                  );
                }
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b p-2 cursor-pointer transition-colors ${
                      !isCurrentMonth
                        ? "bg-zinc-50/50 dark:bg-zinc-900/30 opacity-50"
                        : isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <div
                        className={`text-sm font-medium ${
                          isToday
                            ? "bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-semibold"
                            : isSelected
                            ? "text-blue-600 dark:text-blue-400 font-semibold"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {filteredDayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${getEventColor(
                            event.colorId
                          )}`}
                          title={`${event.summary}${
                            event.start.dateTime
                              ? ` - ${new Date(
                                  event.start.dateTime
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : ""
                          }`}
                        >
                          {event.summary}
                        </div>
                      ))}
                      {filteredDayEvents.length > 3 && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1.5 font-medium">
                          +{filteredDayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {}
          {selectedDate && (
            <div className="mt-6 border rounded-lg p-6 bg-white dark:bg-zinc-900 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const dateStr = selectedDate.toISOString().split("T")[0];
                    const timeStr = new Date().toTimeString().slice(0, 5);
                    setNewEvent({
                      summary: "",
                      description: "",
                      start: `${dateStr}T${timeStr}`,
                      end: `${dateStr}T${timeStr}`,
                      location: "",
                    });
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </div>
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-l-4 ${getEventColor(
                        event.colorId
                      )} bg-zinc-50 dark:bg-zinc-800/50`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {event.start.dateTime && (
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                {new Date(
                                  event.start.dateTime
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                            <h4 className="font-semibold">{event.summary}</h4>
                          </div>
                          {event.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <span>📍</span>
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (event.id) {
                              try {
                                await deleteEvent(event.id);
                                toast.success("Evento excluído com sucesso!");
                                await fetchEvents();
                              } catch (error: any) {
                                toast.error(
                                  error?.message || "Erro ao excluir evento"
                                );
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">
                    Nenhum evento neste dia
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      const dateStr = selectedDate.toISOString().split("T")[0];
                      const timeStr = new Date().toTimeString().slice(0, 5);
                      setNewEvent({
                        summary: "",
                        description: "",
                        start: `${dateStr}T${timeStr}`,
                        end: `${dateStr}T${timeStr}`,
                        location: "",
                      });
                      setShowCreateForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Evento
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </main>
  );
}