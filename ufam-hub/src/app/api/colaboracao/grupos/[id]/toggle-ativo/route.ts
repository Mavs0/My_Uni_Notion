import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;
    const body = await request.json();
    const { ativo } = body;

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
        .select("criador_id")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    } else {
      const result = await supabase
        .from("grupos_estudo")
        .select("criador_id")
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

    if (grupo.criador_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o criador pode alterar o status do grupo" },
        { status: 403 }
      );
    }

    let updateResult;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      updateResult = await adminClient
        .from("grupos_estudo")
        .update({ ativo: ativo !== false })
        .eq("id", grupo_id)
        .select()
        .single();
    } else {
      updateResult = await supabase
        .from("grupos_estudo")
        .update({ ativo: ativo !== false })
        .eq("id", grupo_id)
        .eq("criador_id", user.id)
        .select()
        .single();
    }

    if (updateResult.error) {
      console.error("Erro ao atualizar status do grupo:", updateResult.error);
      return NextResponse.json(
        { error: "Erro ao atualizar status do grupo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      grupo: updateResult.data,
    });
  } catch (error: any) {
    console.error("Erro na API de toggle ativo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
