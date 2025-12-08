import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let grupo;
    let grupoError;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupos_estudo")
        .select("*")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    } else {
      const result = await supabase
        .from("grupos_estudo")
        .select("*")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    }

    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }

    let membro;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const membroResult = await adminClient
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    } else {
      const membroResult = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;
    }

    if (!membro) {
      return NextResponse.json(
        { error: "Você não é membro deste grupo" },
        { status: 403 }
      );
    }

    return NextResponse.json({ grupo });
  } catch (error: any) {
    console.error("Erro na API de grupo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
