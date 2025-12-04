import { NextRequest, NextResponse } from "next/server";
import {
  createOAuth2Client,
  generateAuthUrl,
} from "@/lib/google-calendar/config";
export async function GET(request: NextRequest) {
  try {
    const oauth2Client = createOAuth2Client();
    const authUrl = generateAuthUrl(oauth2Client);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error);
    return NextResponse.json(
      { error: "Falha ao gerar URL de autenticação" },
      { status: 500 }
    );
  }
}