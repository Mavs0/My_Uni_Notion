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
    const materialId = params.id;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let comentarios: any[] = [];
    let comentariosError: any = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("biblioteca_comentarios")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });

      comentarios = result.data || [];
      comentariosError = result.error;

      // Buscar dados dos usuários
      if (comentarios.length > 0) {
        const comentariosComUsuario = await Promise.all(
          comentarios.map(async (comentario) => {
            try {
              const { data: userData } =
                await adminClient.auth.admin.getUserById(comentario.user_id);
              return {
                ...comentario,
                usuario: {
                  id: comentario.user_id,
                  raw_user_meta_data: userData?.user?.user_metadata || null,
                },
              };
            } catch (err) {
              return {
                ...comentario,
                usuario: {
                  id: comentario.user_id,
                  raw_user_meta_data: null,
                },
              };
            }
          })
        );
        comentarios = comentariosComUsuario;
      }
    } else {
      const result = await supabase
        .from("biblioteca_comentarios")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });

      comentarios = (result.data || []).map((c) => ({
        ...c,
        usuario: { id: c.user_id, raw_user_meta_data: null },
      }));
      comentariosError = result.error;
    }

    if (comentariosError) {
      console.error("Erro ao buscar comentários:", comentariosError);
      return NextResponse.json(
        { error: "Erro ao buscar comentários" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comentarios });
  } catch (error: any) {
    console.error("Erro na API de comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = params.id;
    const body = await request.json();
    const { conteudo } = body;

    if (!conteudo || !conteudo.trim()) {
      return NextResponse.json(
        { error: "Conteúdo do comentário é obrigatório" },
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

    let comentario: any = null;
    let comentarioError: any = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("biblioteca_comentarios")
        .insert({
          material_id: materialId,
          user_id: user.id,
          conteudo: conteudo.trim(),
        })
        .select()
        .single();

      comentario = result.data;
      comentarioError = result.error;

      // Adicionar dados do usuário
      if (comentario) {
        const { data: userData } = await adminClient.auth.admin.getUserById(
          user.id
        );
        comentario = {
          ...comentario,
          usuario: {
            id: user.id,
            raw_user_meta_data: userData?.user?.user_metadata || null,
          },
        };
      }
    } else {
      const result = await supabase
        .from("biblioteca_comentarios")
        .insert({
          material_id: materialId,
          user_id: user.id,
          conteudo: conteudo.trim(),
        })
        .select()
        .single();

      comentario = result.data
        ? {
            ...result.data,
            usuario: { id: user.id, raw_user_meta_data: null },
          }
        : null;
      comentarioError = result.error;
    }

    if (comentarioError) {
      console.error("Erro ao criar comentário:", comentarioError);
      return NextResponse.json(
        { error: "Erro ao criar comentário" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comentario });
  } catch (error: any) {
    console.error("Erro na API de comentários:", error);
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
    const { searchParams } = new URL(request.url);
    const comentarioId = searchParams.get("comentario_id");

    if (!comentarioId) {
      return NextResponse.json(
        { error: "ID do comentário é obrigatório" },
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

    let deleteError: any = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();

      // Verificar se o comentário pertence ao usuário
      const { data: comentario } = await adminClient
        .from("biblioteca_comentarios")
        .select("user_id")
        .eq("id", comentarioId)
        .single();

      if (comentario?.user_id !== user.id) {
        return NextResponse.json(
          { error: "Você não pode deletar este comentário" },
          { status: 403 }
        );
      }

      const result = await adminClient
        .from("biblioteca_comentarios")
        .delete()
        .eq("id", comentarioId);

      deleteError = result.error;
    } else {
      const result = await supabase
        .from("biblioteca_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("user_id", user.id);

      deleteError = result.error;
    }

    if (deleteError) {
      console.error("Erro ao deletar comentário:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar comentário" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
