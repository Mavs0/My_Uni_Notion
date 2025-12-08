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
        .select("criador_id, visibilidade, requer_aprovacao")
        .eq("id", grupo_id)
        .single();
      grupo = result.data;
      grupoError = result.error;
    } else {
      const result = await supabase
        .from("grupos_estudo")
        .select("criador_id, visibilidade, requer_aprovacao")
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
        { error: "Apenas o criador pode ver solicitações" },
        { status: 403 }
      );
    }

    if (!grupo.requer_aprovacao || grupo.visibilidade !== "privado") {
      return NextResponse.json({ solicitacoes: [] });
    }

    const adminClient = createSupabaseAdmin();
    const userIds: string[] = [];
    const solicitacoesMap = new Map();

    const { data: solicitacoesData, error: solicitacoesError } =
      await adminClient
        .from("grupo_membros")
        .select("*")
        .eq("grupo_id", grupo_id)
        .eq("status", "pendente");

    if (solicitacoesError) {
      console.error("Erro ao buscar solicitações:", solicitacoesError);
      return NextResponse.json({ solicitacoes: [] });
    }

    if (solicitacoesData && solicitacoesData.length > 0) {
      for (const solicitacao of solicitacoesData) {
        userIds.push(solicitacao.user_id);
      }

      for (const userId of userIds) {
        try {
          const { data: userData, error: userError } =
            await adminClient.auth.admin.getUserById(userId);
          if (!userError && userData?.user) {
            solicitacoesMap.set(userId, {
              id: userData.user.id,
              raw_user_meta_data: userData.user.user_metadata || {},
            });
          }
        } catch (err) {
          console.warn("Erro ao buscar usuário:", userId, err);
        }
      }

      const solicitacoes = solicitacoesData.map((solicitacao: any) => ({
        ...solicitacao,
        usuario: solicitacoesMap.get(solicitacao.user_id) || {
          id: solicitacao.user_id,
          raw_user_meta_data: {},
        },
      }));

      return NextResponse.json({ solicitacoes });
    }

    return NextResponse.json({ solicitacoes: [] });
  } catch (error: any) {
    console.error("Erro na API de solicitações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
