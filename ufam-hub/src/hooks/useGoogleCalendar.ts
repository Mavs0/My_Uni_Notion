"use client";
import { useState, useEffect, useCallback } from "react";
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  colorId?: string;
  visibility?: "default" | "public" | "private";
}
export interface CalendarTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}
export interface UseGoogleCalendarReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  events: CalendarEvent[];
  error: string | null;
  authenticate: () => Promise<void>;
  disconnect: () => void;
  fetchEvents: (options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, "id">) => Promise<CalendarEvent>;
  updateEvent: (
    eventId: string,
    event: Partial<CalendarEvent>
  ) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  createClassEvent: (
    disciplina: string,
    professor: string,
    sala: string,
    diaSemana: number,
    horarioInicio: string,
    horarioFim: string,
    dataInicio: string,
    dataFim: string
  ) => Promise<CalendarEvent>;
  createAssessmentEvent: (
    disciplina: string,
    tipo: "prova" | "trabalho" | "seminario",
    data: string,
    horario: string,
    descricao?: string
  ) => Promise<CalendarEvent>;
}
export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<CalendarTokens | null>(null);
  useEffect(() => {
    const savedTokens = localStorage.getItem("google_calendar_tokens");
    if (savedTokens) {
      try {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erro ao carregar tokens salvos:", error);
        localStorage.removeItem("google_calendar_tokens");
      }
    }
  }, []);
  const saveTokens = useCallback((newTokens: CalendarTokens) => {
    setTokens(newTokens);
    setIsAuthenticated(true);
    localStorage.setItem("google_calendar_tokens", JSON.stringify(newTokens));
  }, []);
  const clearTokens = useCallback(() => {
    setTokens(null);
    setIsAuthenticated(false);
    setEvents([]);
    localStorage.removeItem("google_calendar_tokens");
  }, []);
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/auth");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao obter URL de autenticação");
      }
      const popup = window.open(
        data.authUrl,
        "google-calendar-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
        }
      }, 1000);
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === "GOOGLE_CALENDAR_AUTH_SUCCESS") {
          saveTokens(event.data.tokens);
          setIsLoading(false);
          popup?.close();
          window.removeEventListener("message", messageHandler);
        } else if (event.data.type === "GOOGLE_CALENDAR_AUTH_ERROR") {
          setError(event.data.error);
          setIsLoading(false);
          popup?.close();
          window.removeEventListener("message", messageHandler);
        }
      };
      window.addEventListener("message", messageHandler);
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      setIsLoading(false);
    }
  }, [saveTokens]);
  const disconnect = useCallback(() => {
    clearTokens();
  }, [clearTokens]);
  const fetchEvents = useCallback(
    async (options?: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    }) => {
      if (!tokens?.access_token) {
        setError("Não autenticado");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          access_token: tokens.access_token,
          ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
          ...(options?.timeMin && { timeMin: options.timeMin }),
          ...(options?.timeMax && { timeMax: options.timeMax }),
          ...(options?.maxResults && {
            maxResults: options.maxResults.toString(),
          }),
        });
        const response = await fetch(`/api/calendar/events?${params}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Falha ao buscar eventos");
        }
        setEvents(data.events || []);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setError(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    },
    [tokens]
  );
  const createEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> => {
      if (!tokens?.access_token) {
        throw new Error("Não autenticado");
      }
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      });
      const response = await fetch(`/api/calendar/events?${params}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar evento");
      }
      await fetchEvents();
      return data;
    },
    [tokens, fetchEvents]
  );
  const updateEvent = useCallback(
    async (
      eventId: string,
      event: Partial<CalendarEvent>
    ): Promise<CalendarEvent> => {
      if (!tokens?.access_token) {
        throw new Error("Não autenticado");
      }
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      });
      const response = await fetch(
        `/api/calendar/events/${eventId}?${params}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao atualizar evento");
      }
      await fetchEvents();
      return data;
    },
    [tokens, fetchEvents]
  );
  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (!tokens?.access_token) {
        throw new Error("Não autenticado");
      }
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      });
      const response = await fetch(
        `/api/calendar/events/${eventId}?${params}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao deletar evento");
      }
      await fetchEvents();
    },
    [tokens, fetchEvents]
  );
  const createClassEvent = useCallback(
    async (
      disciplina: string,
      professor: string,
      sala: string,
      diaSemana: number,
      horarioInicio: string,
      horarioFim: string,
      dataInicio: string,
      dataFim: string
    ): Promise<CalendarEvent> => {
      const event: Omit<CalendarEvent, "id"> = {
        summary: `${disciplina} - ${professor}`,
        description: `Aula de ${disciplina}\nProfessor: ${professor}\nSala: ${sala}`,
        location: sala,
        start: {
          dateTime: `${dataInicio}T${horarioInicio}:00`,
          timeZone: "America/Manaus",
        },
        end: {
          dateTime: `${dataInicio}T${horarioFim}:00`,
          timeZone: "America/Manaus",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 15 },
            { method: "email", minutes: 60 },
          ],
        },
        colorId: "1",
      };
      return createEvent(event);
    },
    [createEvent]
  );
  const createAssessmentEvent = useCallback(
    async (
      disciplina: string,
      tipo: "prova" | "trabalho" | "seminario",
      data: string,
      horario: string,
      descricao?: string
    ): Promise<CalendarEvent> => {
      const event: Omit<CalendarEvent, "id"> = {
        summary: `${
          tipo.charAt(0).toUpperCase() + tipo.slice(1)
        } - ${disciplina}`,
        description: descricao || `Avaliação de ${disciplina}`,
        start: {
          dateTime: `${data}T${horario}:00`,
          timeZone: "America/Manaus",
        },
        end: {
          dateTime: `${data}T${horario}:00`,
          timeZone: "America/Manaus",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 1440 },
          ],
        },
        colorId: tipo === "prova" ? "11" : tipo === "trabalho" ? "6" : "10",
      };
      return createEvent(event);
    },
    [createEvent]
  );
  return {
    isAuthenticated,
    isLoading,
    events,
    error,
    authenticate,
    disconnect,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    createClassEvent,
    createAssessmentEvent,
  };
}