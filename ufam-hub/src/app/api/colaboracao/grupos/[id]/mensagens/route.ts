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
    const { mensagem, tipo, referencia_id } = body;
    if (!mensagem) {
      return NextResponse.json(
        { error: "mensagem é obrigatória" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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

    let mensagemData, mensagemError;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupo_mensagens")
        .insert({
          grupo_id,
          user_id: user.id,
          mensagem,
          tipo: tipo || "texto",
          referencia_id: referencia_id || null,
        })
        .select("*")
        .single();
      mensagemData = result.data;
      mensagemError = result.error;

      if (mensagemData) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            (mensagemData as any).user_id
          );
          if (userData?.user) {
            (mensagemData as any).usuario = {
              id: userData.user.id,
              raw_user_meta_data: userData.user.user_metadata || {},
            };
          } else {
            (mensagemData as any).usuario = {
              id: (mensagemData as any).user_id,
              raw_user_meta_data: {},
            };
          }
        } catch (err) {
          (mensagemData as any).usuario = {
            id: (mensagemData as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    } else {
      const result = await supabase
        .from("grupo_mensagens")
        .insert({
          grupo_id,
          user_id: user.id,
          mensagem,
          tipo: tipo || "texto",
          referencia_id: referencia_id || null,
        })
        .select("*")
        .single();
      mensagemData = result.data;
      mensagemError = result.error;
    }
    if (mensagemError) {
      console.error("Erro ao enviar mensagem:", mensagemError);
      return NextResponse.json(
        { error: "Erro ao enviar mensagem" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, mensagem: mensagemData });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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

    let mensagens, error;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("grupo_mensagens")
        .select("*")
        .eq("grupo_id", grupo_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      mensagens = result.data;
      error = result.error;

      if (mensagens && mensagens.length > 0) {
        const userIds = [...new Set(mensagens.map((msg: any) => msg.user_id))];
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

        for (const msg of mensagens) {
          (msg as any).usuario = usuariosMap.get((msg as any).user_id) || {
            id: (msg as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    } else {
      const result = await supabase
        .from("grupo_mensagens")
        .select("*")
        .eq("grupo_id", grupo_id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      mensagens = result.data;
      error = result.error;

      if (
        mensagens &&
        mensagens.length > 0 &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        const userIds = [...new Set(mensagens.map((msg: any) => msg.user_id))];
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

        for (const msg of mensagens) {
          (msg as any).usuario = usuariosMap.get((msg as any).user_id) || {
            id: (msg as any).user_id,
            raw_user_meta_data: {},
          };
        }
      }
    }
    if (error) {
      console.error("Erro ao buscar mensagens:", error);
      return NextResponse.json(
        { error: "Erro ao buscar mensagens" },
        { status: 500 }
      );
    }
    return NextResponse.json({ mensagens: mensagens || [] });
  } catch (error: any) {
    console.error("Erro na API de mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
