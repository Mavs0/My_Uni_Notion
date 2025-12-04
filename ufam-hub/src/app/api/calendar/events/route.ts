import { NextRequest, NextResponse } from "next/server";
import { GoogleCalendarService } from "@/lib/google-calendar/service";
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");
    const maxResults = searchParams.get("maxResults");
    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso não fornecido" },
        { status: 401 }
      );
    }
    const calendarService = new GoogleCalendarService(
      accessToken,
      refreshToken || undefined
    );
    const events = await calendarService.listEvents("primary", {
      timeMin: timeMin || undefined,
      timeMax: timeMax || undefined,
      maxResults: maxResults ? parseInt(maxResults) : undefined,
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json(
      { error: "Falha ao buscar eventos" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de acesso não fornecido" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const calendarService = new GoogleCalendarService(
      accessToken,
      refreshToken || undefined
    );
    const event = await calendarService.createEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar evento:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Falha ao criar evento";
    const statusCode =
      errorMessage.includes("expirado") || errorMessage.includes("401")
        ? 401
        : errorMessage.includes("permissão") || errorMessage.includes("403")
        ? 403
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}