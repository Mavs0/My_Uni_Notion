import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mensagemId: string }> }
) {
  try {
    const { id: grupo_id, mensagemId: mensagem_id } = await params;
    const body = await request.json();
    const { mensagem } = body;

    if (!mensagem || !mensagem.trim()) {
      return NextResponse.json(
        { error: "mensagem é obrigatória" },
        { status: 400 }
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

    let mensagemOriginal;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const { data, error } = await adminClient
        .from("grupo_mensagens")
        .select("*")
        .eq("id", mensagem_id)
        .eq("grupo_id", grupo_id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Mensagem não encontrada" },
          { status: 404 }
        );
      }

      mensagemOriginal = data;
    } else {
      const { data, error } = await supabase
        .from("grupo_mensagens")
        .select("*")
        .eq("id", mensagem_id)
        .eq("grupo_id", grupo_id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Mensagem não encontrada" },
          { status: 404 }
        );
      }

      mensagemOriginal = data;
    }

    if (mensagemOriginal.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você só pode editar suas próprias mensagens" },
        { status: 403 }
      );
    }

    const createdAt = new Date(mensagemOriginal.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 5) {
      return NextResponse.json(
        { error: "Você só pode editar mensagens dentro de 5 minutos após o envio" },
        { status: 403 }
      );
    }

    let mensagemAtualizada;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const { data, error } = await adminClient
        .from("grupo_mensagens")
        .update({
          mensagem: mensagem.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", mensagem_id)
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao atualizar mensagem:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar mensagem" },
          { status: 500 }
        );
      }

      mensagemAtualizada = data;

      try {
        const { data: userData } = await adminClient.auth.admin.getUserById(
          mensagemAtualizada.user_id
        );
        if (userData?.user) {
          (mensagemAtualizada as any).usuario = {
            id: userData.user.id,
            raw_user_meta_data: userData.user.user_metadata || {},
          };
        }
      } catch (err) {
        (mensagemAtualizada as any).usuario = {
          id: mensagemAtualizada.user_id,
          raw_user_meta_data: {},
        };
      }
    } else {
      const { data, error } = await supabase
        .from("grupo_mensagens")
        .update({
          mensagem: mensagem.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", mensagem_id)
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao atualizar mensagem:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar mensagem" },
          { status: 500 }
        );
      }

      mensagemAtualizada = data;
    }

    return NextResponse.json({
      success: true,
      mensagem: mensagemAtualizada,
    });
  } catch (error: any) {
    console.error("Erro na API de edição de mensagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mensagemId: string }> }
) {
  try {
    const { id: grupo_id, mensagemId: mensagem_id } = await params;

    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let mensagemOriginal;
    let grupoInfo;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const { data: msgData, error: msgError } = await adminClient
        .from("grupo_mensagens")
        .select("*")
        .eq("id", mensagem_id)
        .eq("grupo_id", grupo_id)
        .single();

      if (msgError || !msgData) {
        return NextResponse.json(
          { error: "Mensagem não encontrada" },
          { status: 404 }
        );
      }

      mensagemOriginal = msgData;

      const { data: grupoData } = await adminClient
        .from("grupos_estudo")
        .select("criador_id")
        .eq("id", grupo_id)
        .single();
      
      grupoInfo = grupoData;

      const isAuthor = mensagemOriginal.user_id === user.id;
      const isAdmin = grupoInfo?.criador_id === user.id;

      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: "Você não tem permissão para deletar esta mensagem" },
          { status: 403 }
        );
      }

      const { error: deleteError } = await adminClient
        .from("grupo_mensagens")
        .delete()
        .eq("id", mensagem_id);

      if (deleteError) {
        console.error("Erro ao deletar mensagem:", deleteError);
        return NextResponse.json(
          { error: "Erro ao deletar mensagem" },
          { status: 500 }
        );
      }
    } else {
      const { data: msgData, error: msgError } = await supabase
        .from("grupo_mensagens")
        .select("*")
        .eq("id", mensagem_id)
        .eq("grupo_id", grupo_id)
        .single();

      if (msgError || !msgData) {
        return NextResponse.json(
          { error: "Mensagem não encontrada" },
          { status: 404 }
        );
      }

      mensagemOriginal = msgData;

      if (mensagemOriginal.user_id !== user.id) {
        return NextResponse.json(
          { error: "Você só pode deletar suas próprias mensagens" },
          { status: 403 }
        );
      }

      const { error: deleteError } = await supabase
        .from("grupo_mensagens")
        .delete()
        .eq("id", mensagem_id);

      if (deleteError) {
        console.error("Erro ao deletar mensagem:", deleteError);
        return NextResponse.json(
          { error: "Erro ao deletar mensagem" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de deleção de mensagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
