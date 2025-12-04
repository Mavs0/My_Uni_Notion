import { google } from "googleapis";
import { createOAuth2Client, GOOGLE_CALENDAR_CONFIG } from "./config";
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
export interface CalendarListResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
}
export class GoogleCalendarService {
  private calendar: any;
  private oauth2Client: any;
  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = createOAuth2Client();
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    this.oauth2Client.on("tokens", (tokens: any) => {
      if (tokens.refresh_token) {
        this.oauth2Client.setCredentials(tokens);
      }
    });
    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }
  async listEvents(
    calendarId: string = GOOGLE_CALENDAR_CONFIG.calendar.primaryCalendarId,
    options: {
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: "startTime" | "updated";
      q?: string;
    } = {}
  ): Promise<CalendarListResponse> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin:
          options.timeMin ||
          GOOGLE_CALENDAR_CONFIG.calendar.syncSettings.timeMin,
        timeMax:
          options.timeMax ||
          GOOGLE_CALENDAR_CONFIG.calendar.syncSettings.timeMax,
        maxResults:
          options.maxResults ||
          GOOGLE_CALENDAR_CONFIG.calendar.syncSettings.maxResults,
        singleEvents: options.singleEvents ?? true,
        orderBy: options.orderBy || "startTime",
        q: options.q,
      });
      return {
        events: response.data.items || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error("Erro ao listar eventos:", error);
      throw new Error("Falha ao buscar eventos do calendário");
    }
  }
  async createEvent(
    event: CalendarEvent,
    calendarId: string = GOOGLE_CALENDAR_CONFIG.calendar.primaryCalendarId
  ): Promise<CalendarEvent> {
    try {
      if (!event.summary) {
        throw new Error("O campo 'summary' (título) é obrigatório");
      }
      if (!event.start || (!event.start.dateTime && !event.start.date)) {
        throw new Error("O campo 'start' (data de início) é obrigatório");
      }
      if (!event.end || (!event.end.dateTime && !event.end.date)) {
        throw new Error("O campo 'end' (data de fim) é obrigatório");
      }
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
      });
      return response.data;
    } catch (error: any) {
      console.error("Erro ao criar evento:", error);
      if (error.code === 401) {
        throw new Error("Token de acesso expirado. Faça login novamente.");
      } else if (error.code === 403) {
        throw new Error("Sem permissão para criar eventos neste calendário.");
      } else if (error.message) {
        throw new Error(`Erro ao criar evento: ${error.message}`);
      } else if (error.response?.data?.error?.message) {
        throw new Error(
          `Erro do Google Calendar: ${error.response.data.error.message}`
        );
      }
      throw new Error("Falha ao criar evento no calendário");
    }
  }
  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = GOOGLE_CALENDAR_CONFIG.calendar.primaryCalendarId
  ): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event,
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      throw new Error("Falha ao atualizar evento no calendário");
    }
  }
  async deleteEvent(
    eventId: string,
    calendarId: string = GOOGLE_CALENDAR_CONFIG.calendar.primaryCalendarId
  ): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      throw new Error("Falha ao deletar evento do calendário");
    }
  }
  async getEvent(
    eventId: string,
    calendarId: string = GOOGLE_CALENDAR_CONFIG.calendar.primaryCalendarId
  ): Promise<CalendarEvent> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar evento:", error);
      throw new Error("Falha ao buscar evento do calendário");
    }
  }
  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error("Erro ao listar calendários:", error);
      throw new Error("Falha ao buscar calendários");
    }
  }
  async createClassEvent(
    disciplina: string,
    professor: string,
    sala: string,
    diaSemana: number,
    horarioInicio: string,
    horarioFim: string,
    dataInicio: string,
    dataFim: string
  ): Promise<CalendarEvent> {
    const diasSemana = [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado",
    ];
    const event: CalendarEvent = {
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
    return this.createEvent(event);
  }
  async createAssessmentEvent(
    disciplina: string,
    tipo: "prova" | "trabalho" | "seminario",
    data: string,
    horario: string,
    descricao?: string
  ): Promise<CalendarEvent> {
    const event: CalendarEvent = {
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
    return this.createEvent(event);
  }
}