import { NextRequest, NextResponse } from "next/server";
import { GoogleCalendarService } from "@/lib/google-calendar/service";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
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
    const event = await calendarService.getEvent(eventId);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    return NextResponse.json(
      { error: "Falha ao buscar evento" },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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
    const event = await calendarService.updateEvent(eventId, body);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar evento" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
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
    await calendarService.deleteEvent(eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    return NextResponse.json(
      { error: "Falha ao deletar evento" },
      { status: 500 }
    );
  }
}