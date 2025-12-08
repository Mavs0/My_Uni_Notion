import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;
    const body = await request.json();
    const { user_id } = body;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const target_user_id = user_id || user.id;
    const { data: grupo, error: grupoError } = await supabase
      .from("grupos_estudo")
      .select("id, max_membros, criador_id")
      .eq("id", grupo_id)
      .single();
    if (grupoError || !grupo) {
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    }
    const { data: membroExistente } = await supabase
      .from("grupo_membros")
      .select("id")
      .eq("grupo_id", grupo_id)
      .eq("user_id", target_user_id)
      .single();
    if (membroExistente) {
      return NextResponse.json(
        { error: "Usuário já é membro do grupo" },
        { status: 400 }
      );
    }
    const { count } = await supabase
      .from("grupo_membros")
      .select("*", { count: "exact", head: true })
      .eq("grupo_id", grupo_id)
      .eq("status", "ativo");
    if (count && count >= grupo.max_membros) {
      return NextResponse.json(
        { error: "Grupo atingiu o limite de membros" },
        { status: 400 }
      );
    }
    const { data: membro, error: membroError } = await supabase
      .from("grupo_membros")
      .insert({
        grupo_id,
        user_id: target_user_id,
        role: grupo.criador_id === target_user_id ? "admin" : "membro",
        status: "ativo",
      })
      .select(
        `
        *,
        usuario:auth.users!grupo_membros_user_id_fkey(id, raw_user_meta_data)
      `
      )
      .single();
    if (membroError) {
      console.error("Erro ao adicionar membro:", membroError);
      return NextResponse.json(
        { error: "Erro ao adicionar membro" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, membro });
  } catch (error: any) {
    console.error("Erro na API de membros:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
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
    let membro, membros, error;

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

      if (!membro) {
        return NextResponse.json(
          { error: "Você não é membro deste grupo" },
          { status: 403 }
        );
      }

      const membrosResult = await adminClient
        .from("grupo_membros")
        .select("*")
        .eq("grupo_id", grupo_id)
        .eq("status", "ativo")
        .order("entrou_em", { ascending: true });
      membros = membrosResult.data;
      error = membrosResult.error;

      if (membros && membros.length > 0) {
        const userIds = [...new Set(membros.map((m: any) => m.user_id))];
        const usuariosMap = new Map();

        try {
          const adminClient = createSupabaseAdmin();
          for (const userId of userIds) {
            try {
              const { data: userData, error: userError } =
                await adminClient.auth.admin.getUserById(userId);
              if (!userError && userData?.user) {
                usuariosMap.set(userId, {
                  id: userData.user.id,
                  raw_user_meta_data: userData.user.user_metadata || {},
                });
              }
            } catch (err) {
              console.warn("Erro ao buscar usuário:", userId, err);
            }
          }
        } catch (err) {
          console.warn("Erro ao usar admin client para buscar usuários:", err);
        }

        for (const m of membros) {
          (m as any).usuario = usuariosMap.get((m as any).user_id) || {
            id: (m as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    } else {
      const membroResult = await supabase
        .from("grupo_membros")
        .select("id")
        .eq("grupo_id", grupo_id)
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();
      membro = membroResult.data;

      if (!membro) {
        return NextResponse.json(
          { error: "Você não é membro deste grupo" },
          { status: 403 }
        );
      }

      const membrosResult = await supabase
        .from("grupo_membros")
        .select("*")
        .eq("grupo_id", grupo_id)
        .eq("status", "ativo")
        .order("entrou_em", { ascending: true });
      membros = membrosResult.data;
      error = membrosResult.error;
    }
    if (error) {
      console.error("Erro ao buscar membros:", error);
      return NextResponse.json(
        { error: "Erro ao buscar membros" },
        { status: 500 }
      );
    }
    return NextResponse.json({ membros: membros || [] });
  } catch (error: any) {
    console.error("Erro na API de membros:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const grupo_id = params.id;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const target_user_id = user_id || user.id;
    const { data: membro } = await supabase
      .from("grupo_membros")
      .select("role")
      .eq("grupo_id", grupo_id)
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .single();
    if (!membro || (target_user_id !== user.id && membro.role !== "admin")) {
      return NextResponse.json(
        { error: "Sem permissão para remover membro" },
        { status: 403 }
      );
    }
    const { error } = await supabase
      .from("grupo_membros")
      .delete()
      .eq("grupo_id", grupo_id)
      .eq("user_id", target_user_id);
    if (error) {
      console.error("Erro ao remover membro:", error);
      return NextResponse.json(
        { error: "Erro ao remover membro" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de membros:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
