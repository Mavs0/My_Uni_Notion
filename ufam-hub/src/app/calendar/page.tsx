"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  GoogleCalendarIntegration,
  SyncDisciplinasWithCalendar,
} from "@/components/GoogleCalendarIntegration";
import { useGoogleCalendar, type CalendarEvent } from "@/hooks/useGoogleCalendar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  MoreVertical,
  CalendarDays,
  LayoutList,
} from "lucide-react";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function eventStart(ev: CalendarEvent): Date | null {
  if (ev.start.dateTime) return new Date(ev.start.dateTime);
  if (ev.start.date) return new Date(`${ev.start.date}T12:00:00`);
  return null;
}

function eventEnd(ev: CalendarEvent): Date | null {
  if (ev.end.dateTime) return new Date(ev.end.dateTime);
  if (ev.end.date) return new Date(`${ev.end.date}T12:00:00`);
  return null;
}

const MONTHS = [
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
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DAY_VIEW_START = 6;
const DAY_VIEW_END = 23;
const MINUTES_DAY =
  (DAY_VIEW_END - DAY_VIEW_START + 1) * 60;

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isLoading,
    events,
    fetchEvents,
    createEvent,
    deleteEvent,
  } = useGoogleCalendar();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [listDay, setListDay] = useState<Date>(() => startOfDay(new Date()));
  const [calendarView, setCalendarView] = useState<"month" | "day">("month");
  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  useEffect(() => {
    if (isAuthenticated) fetchEvents();
  }, [isAuthenticated, fetchEvents]);

  useEffect(() => {
    if (searchParams.get("action") === "new" && isAuthenticated) {
      setShowCreateForm(true);
      window.history.replaceState({}, "", "/calendar");
    }
  }, [searchParams, isAuthenticated]);

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [events, searchTerm],
  );

  const getEventsForDate = useCallback(
    (date: Date) => {
      return filteredEvents.filter((event) => {
        const s = eventStart(event);
        if (!s) return false;
        return isSameDay(s, date);
      });
    },
    [filteredEvents],
  );

  const agendaEvents = useMemo(() => {
    const list = getEventsForDate(listDay);
    return [...list].sort((a, b) => {
      const sa = eventStart(a)?.getTime() ?? 0;
      const sb = eventStart(b)?.getTime() ?? 0;
      return sa - sb;
    });
  }, [getEventsForDate, listDay]);

  const countToday = getEventsForDate(today).length;
  const countTomorrow = getEventsForDate(tomorrow).length;
  const countListDay = agendaEvents.length;

  const listTab = useMemo(() => {
    if (isSameDay(listDay, today)) return "today" as const;
    if (isSameDay(listDay, tomorrow)) return "tomorrow" as const;
    return "other" as const;
  }, [listDay, today, tomorrow]);

  const getEventColor = (colorId?: string) => {
    const map: Record<string, string> = {
      "1": "bg-primary/90 text-primary-foreground",
      "2": "bg-emerald-600 text-white",
      "3": "bg-violet-600 text-white",
      "4": "bg-red-500 text-white",
      "5": "bg-amber-500 text-white",
      "6": "bg-orange-600 text-white",
      "7": "bg-teal-600 text-white",
      "8": "bg-muted text-foreground",
      "9": "bg-primary/90 text-primary-foreground",
      "10": "bg-emerald-600 text-white",
      "11": "bg-red-500 text-white",
    };
    return map[colorId || "1"] || map["1"];
  };

  const getEventSoftColor = (colorId?: string) => {
    const map: Record<string, string> = {
      "1": "border-primary/40 bg-primary/10 text-primary",
      "2": "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      "3": "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      "4": "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
      "5": "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
      "6": "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
      "7": "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
      "8": "border-border bg-muted/50 text-foreground",
      "9": "border-primary/40 bg-primary/10 text-primary",
      "10": "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      "11": "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
    };
    return map[colorId || "1"] || map["1"];
  };

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
      if (isNaN(date.getTime())) throw new Error("Data inválida");
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
    } catch (error: unknown) {
      console.error("Erro ao criar evento:", error);
      const msg =
        error instanceof Error ? error.message : "Erro ao criar evento.";
      toast.error(msg);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };
  const goToToday = () => {
    const n = new Date();
    setCurrentDate(n);
    setListDay(startOfDay(n));
    setSelectedDate(startOfDay(n));
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const dayViewDate = selectedDate ?? listDay;
  const dayViewEvents = useMemo(() => {
    const list = getEventsForDate(dayViewDate);
    return [...list].sort((a, b) => {
      const sa = eventStart(a)?.getTime() ?? 0;
      const sb = eventStart(b)?.getTime() ?? 0;
      return sa - sb;
    });
  }, [getEventsForDate, dayViewDate]);

  const timelineLayout = useMemo(() => {
    const items: {
      event: CalendarEvent;
      topPct: number;
      heightPct: number;
    }[] = [];
    const windowStartMin = DAY_VIEW_START * 60;
    const windowEndMin = (DAY_VIEW_END + 1) * 60;

    for (const ev of dayViewEvents) {
      const s = eventStart(ev);
      const en = eventEnd(ev);
      if (!s) continue;
      let startMin = s.getHours() * 60 + s.getMinutes();
      let endMin = en
        ? en.getHours() * 60 + en.getMinutes()
        : startMin + 60;
      if (!isSameDay(s, dayViewDate) && ev.start.date) {
        startMin = windowStartMin;
        endMin = Math.min(windowEndMin, startMin + 24 * 60);
      }
      startMin = Math.max(startMin, windowStartMin);
      endMin = Math.min(Math.max(endMin, startMin + 30), windowEndMin);
      const topPct = ((startMin - windowStartMin) / MINUTES_DAY) * 100;
      const heightPct = Math.max(
        ((endMin - startMin) / MINUTES_DAY) * 100,
        2.5,
      );
      items.push({ event: ev, topPct, heightPct });
    }
    return items;
  }, [dayViewDate, dayViewEvents]);

  const openNewForDate = (d: Date) => {
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = new Date().toTimeString().slice(0, 5);
    setNewEvent({
      summary: "",
      description: "",
      start: `${dateStr}T${timeStr}`,
      end: `${dateStr}T${timeStr}`,
      location: "",
    });
    setShowCreateForm(true);
  };

  const shiftDayView = (delta: number) => {
    setSelectedDate((prev) => {
      const base = startOfDay(prev ?? listDay);
      const next = startOfDay(addDays(base, delta));
      setListDay(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:gap-6 lg:px-10 lg:py-8">
        {/* Cabeçalho */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Calendar className="h-5 w-5" />
              </span>
              Calendário
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
              Agenda e mês integrados ao Google Calendar — organize aulas e
              avaliações em um layout mais claro.
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => fetchEvents()}
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Atualizar
              </Button>
              <Button
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4" />
                Novo evento
              </Button>
            </div>
          )}
        </header>

        <GoogleCalendarIntegration variant="compact" />

        {isAuthenticated && (
          <div className="max-w-2xl">
            <SyncDisciplinasWithCalendar />
          </div>
        )}

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo evento</DialogTitle>
              <DialogDescription>
                Campos com * são obrigatórios. Fuso: America/Manaus.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="event-title" className="text-sm font-medium">
                    Título <span className="text-destructive">*</span>
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
                  <label
                    htmlFor="event-location"
                    className="text-sm font-medium"
                  >
                    Local
                  </label>
                  <Input
                    id="event-location"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    placeholder="Sala, link ou endereço"
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
                  placeholder="Detalhes opcionais"
                  className="border-input bg-background min-h-[5rem] w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="event-start" className="text-sm font-medium">
                    Início <span className="text-destructive">*</span>
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
                    Fim <span className="text-destructive">*</span>
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
              <DialogFooter className="gap-2 sm:gap-0">
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
                <Button type="submit">Criar evento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {!isAuthenticated ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-20 text-center">
            <CalendarDays className="mb-4 h-14 w-14 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">
              Conecte o Google Calendar acima
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Depois da conexão, você verá a agenda ao lado da visão mensal ou
              diária, no estilo dos painéis de referência.
            </p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Coluna esquerda — lista / resumo */}
            <aside className="flex min-h-[420px] flex-col rounded-2xl border border-border/80 bg-card/50 shadow-sm backdrop-blur-sm lg:col-span-4 xl:col-span-3">
              <div className="border-b border-border/60 p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {listDay.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {countListDay === 0
                    ? "Nenhum evento neste dia"
                    : countListDay === 1
                      ? "1 evento neste dia"
                      : `${countListDay} eventos neste dia`}
                </h2>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar eventos, locais…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-xl border-border/80 bg-background/80 pl-9"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setListDay(startOfDay(new Date()))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      listTab === "today"
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    Hoje ({countToday})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListDay(addDays(startOfDay(new Date()), 1))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      listTab === "tomorrow"
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    Amanhã ({countTomorrow})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDate) setListDay(startOfDay(selectedDate));
                    }}
                    disabled={!selectedDate}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      listTab === "other"
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted/70 disabled:opacity-40",
                    )}
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Dia no calendário"}
                    {selectedDate
                      ? ` (${getEventsForDate(startOfDay(selectedDate)).length})`
                      : ""}
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
                {agendaEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
                    <LayoutList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nada agendado. Crie um evento ou escolha outro dia.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-lg"
                      onClick={() => openNewForDate(listDay)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo evento
                    </Button>
                  </div>
                ) : (
                  agendaEvents.map((event) => {
                    const s = eventStart(event);
                    const en = eventEnd(event);
                    const timeLabel =
                      s && en
                        ? `${s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} – ${en.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                        : s
                          ? s.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Dia inteiro";
                    const attendee =
                      event.attendees?.[0]?.displayName ||
                      event.attendees?.[0]?.email;
                    return (
                      <div
                        key={event.id || event.summary}
                        className={cn(
                          "group relative rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm transition-shadow hover:shadow-md",
                          getEventSoftColor(event.colorId),
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 gap-2">
                            <span
                              className={cn(
                                "mt-1 h-2 w-2 shrink-0 rounded-full",
                                event.colorId === "2"
                                  ? "bg-emerald-500"
                                  : "bg-primary",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {timeLabel}
                              </p>
                              <p className="font-semibold leading-snug text-foreground">
                                {event.summary}
                              </p>
                              {attendee && (
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {attendee}
                                </p>
                              )}
                              {event.location && (
                                <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                                  <span className="line-clamp-2">
                                    {event.location}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  if (!event.id) return;
                                  try {
                                    await deleteEvent(event.id);
                                    toast.success("Evento excluído");
                                    await fetchEvents();
                                  } catch (err: unknown) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Erro ao excluir",
                                    );
                                  }
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Coluna direita — mês ou dia */}
            <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-sm backdrop-blur-sm lg:col-span-8 xl:col-span-9">
              <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg"
                    onClick={() =>
                      calendarView === "month"
                        ? goToPreviousMonth()
                        : shiftDayView(-1)
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg"
                    onClick={() =>
                      calendarView === "month"
                        ? goToNextMonth()
                        : shiftDayView(1)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-semibold sm:text-lg">
                      {calendarView === "month"
                        ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : dayViewDate.toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-1 rounded-lg text-xs"
                    onClick={goToToday}
                  >
                    Hoje
                  </Button>
                </div>
                <div className="flex rounded-xl border border-border/80 bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setCalendarView("month")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      calendarView === "month"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarView("day");
                      if (!selectedDate) setSelectedDate(startOfDay(new Date()));
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      calendarView === "day"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Dia
                  </button>
                </div>
              </div>

              {calendarView === "month" ? (
                <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-background/50">
                    <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40">
                      {WEEK_DAYS.map((day) => (
                        <div
                          key={day}
                          className="px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {getCalendarDays().map((date, index) => {
                        if (!date) {
                          return (
                            <div
                              key={`e-${index}`}
                              className="min-h-[100px] border-b border-r border-border/40 bg-muted/10 last:border-r-0 sm:min-h-[120px]"
                            />
                          );
                        }
                        const isTodayCell = isSameDay(date, today);
                        const isListDayCell = isSameDay(date, listDay);
                        const dayEvts = getEventsForDate(date);
                        const showEvts = dayEvts.slice(0, 3);
                        const more = dayEvts.length - showEvts.length;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const d = startOfDay(date);
                              setSelectedDate(d);
                              setListDay(d);
                            }}
                            className={cn(
                              "min-h-[100px] border-b border-r border-border/40 p-1.5 text-left transition-colors last:border-r-0 sm:min-h-[120px] sm:p-2",
                              isListDayCell
                                ? "bg-primary/10 ring-1 ring-inset ring-primary/25"
                                : "hover:bg-muted/40",
                            )}
                          >
                            <div
                              className={cn(
                                "mb-1 flex h-7 w-7 items-center justify-center text-sm font-semibold",
                                isTodayCell
                                  ? "rounded-full bg-primary text-primary-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-0.5">
                              {showEvts.map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "truncate rounded-md px-1 py-0.5 text-[10px] font-medium sm:text-xs",
                                    getEventColor(event.colorId),
                                  )}
                                  title={event.summary}
                                >
                                  {event.summary}
                                </div>
                              ))}
                              {more > 0 && (
                                <div className="px-1 text-[10px] font-semibold text-muted-foreground">
                                  +{more}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  <div className="relative min-h-[720px] rounded-xl border border-border/60 bg-background/40">
                    <div className="absolute inset-0 flex">
                      <div className="w-14 shrink-0 border-r border-border/50 bg-muted/20 pt-10">
                        {Array.from(
                          { length: DAY_VIEW_END - DAY_VIEW_START + 1 },
                          (_, i) => DAY_VIEW_START + i,
                        ).map((hour) => (
                          <div
                            key={hour}
                            className="h-16 border-b border-border/30 pr-2 text-right text-[11px] text-muted-foreground"
                          >
                            {hour.toString().padStart(2, "0")}:00
                          </div>
                        ))}
                      </div>
                      <div className="relative flex-1 pt-10">
                        {Array.from(
                          { length: DAY_VIEW_END - DAY_VIEW_START + 1 },
                          (_, i) => DAY_VIEW_START + i,
                        ).map((hour) => (
                          <div
                            key={hour}
                            className="h-16 border-b border-border/30"
                          />
                        ))}
                        <div className="absolute inset-0 top-10 px-2">
                          {timelineLayout.map(({ event, topPct, heightPct }, ti) => (
                            <div
                              key={event.id ?? `ev-${ti}-${event.summary}`}
                              className={cn(
                                "absolute left-2 right-2 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm",
                                getEventSoftColor(event.colorId),
                              )}
                              style={{
                                top: `${topPct}%`,
                                height: `${heightPct}%`,
                                minHeight: "2.25rem",
                              }}
                            >
                              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                                {event.start.dateTime
                                  ? new Date(
                                      event.start.dateTime,
                                    ).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Dia"}
                              </p>
                              <p className="truncate text-sm font-semibold">
                                {event.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => openNewForDate(dayViewDate)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Evento neste dia
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
