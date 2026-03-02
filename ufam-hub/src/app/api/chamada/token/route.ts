import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

/**
 * GET /api/chamada/token?room=<grupo_id>
 * Gera um token LiveKit para entrar na sala de chamada do grupo.
 * Valida: usuário autenticado e membro ativo do grupo.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const room = searchParams.get("room");

    if (!room) {
      return NextResponse.json(
        { error: "Parâmetro room (id do grupo) é obrigatório" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

    if (!apiKey || !apiSecret) {
      const missing = [];
      if (!apiKey) missing.push("LIVEKIT_API_KEY");
      if (!apiSecret) missing.push("LIVEKIT_API_SECRET");
      console.error(
        "LiveKit: variáveis não configuradas no servidor:",
        missing.join(", "),
      );
      return NextResponse.json(
        {
          error: `Configure no .env.local: ${missing.join(", ")}. Depois reinicie o servidor (Ctrl+C e npm run dev).`,
        },
        { status: 503 },
      );
    }

    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const grupoId = room;

    let grupo: { ativo?: boolean } | null = null;
    let grupoError: unknown = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupos_estudo")
        .select("ativo")
        .eq("id", grupoId)
        .single();
      grupo = result.data;
      grupoError = result.error;
    } else {
      const result = await supabase
        .from("grupos_estudo")
        .select("ativo")
        .eq("id", grupoId)
        .single();
      grupo = result.data;
      grupoError = result.error;
    }

    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 },
      );
    }

    if (grupo.ativo === false) {
      return NextResponse.json(
        { error: "Grupo arquivado. Desarquive para acessar a chamada." },
        { status: 403 },
      );
    }

    let membro: { id: string } | null = null;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const membroResult = await adminClient
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupoId)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    } else {
      const membroResult = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupoId)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    }

    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo." },
        { status: 403 },
      );
    }

    const participantName =
      (user.user_metadata?.nome as string) || user.email || user.id;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: participantName,
      ttl: "2h",
    });

    at.addGrant({
      roomJoin: true,
      room: grupoId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    const livekitUrl = (process.env.LIVEKIT_URL || "").trim();

    if (!livekitUrl) {
      console.error("LiveKit: LIVEKIT_URL não configurada no servidor.");
      return NextResponse.json(
        {
          error:
            "Configure LIVEKIT_URL no .env.local (ex: wss://seu-projeto.livekit.cloud). Depois reinicie o servidor (Ctrl+C e npm run dev).",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ token, url: livekitUrl });
  } catch (error) {
    console.error("Erro ao gerar token LiveKit:", error);
    return NextResponse.json(
      { error: "Erro ao preparar chamada. Tente novamente." },
      { status: 500 },
    );
  }
}
