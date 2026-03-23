import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

const MAX_CONTEUDO = 2000;

async function isNotaOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  userId: string,
  notaId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notas")
    .select("id")
    .eq("id", notaId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notaId } = await params;
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!(await isNotaOwner(supabase, user.id, notaId))) {
      return NextResponse.json(
        { error: "Nota não encontrada ou não autorizada" },
        { status: 404 },
      );
    }

    let comentarios: unknown[] = [];
    let comentariosError: { code?: string; message?: string } | null = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("nota_comentarios")
        .select("*")
        .eq("nota_id", notaId)
        .order("created_at", { ascending: true });

      comentarios = result.data || [];
      comentariosError = result.error;

      if (comentarios.length > 0) {
        const comentariosComUsuario = await Promise.all(
          (comentarios as { user_id: string }[]).map(async (comentario) => {
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
            } catch {
              return {
                ...comentario,
                usuario: {
                  id: comentario.user_id,
                  raw_user_meta_data: null,
                },
              };
            }
          }),
        );
        comentarios = comentariosComUsuario;
      }
    } else {
      const result = await supabase
        .from("nota_comentarios")
        .select("*")
        .eq("nota_id", notaId)
        .order("created_at", { ascending: true });

      comentarios = (result.data || []).map((c) => ({
        ...c,
        usuario: { id: c.user_id, raw_user_meta_data: null },
      }));
      comentariosError = result.error;
    }

    if (comentariosError) {
      if (comentariosError.code === "42P01") {
        return NextResponse.json({ comentarios: [] });
      }
      console.error("Erro ao buscar comentários da nota:", comentariosError);
      return NextResponse.json(
        { error: "Erro ao buscar comentários" },
        { status: 500 },
      );
    }

    return NextResponse.json({ comentarios });
  } catch (error: unknown) {
    console.error("GET nota comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notaId } = await params;
    const body = await request.json();
    const conteudo = typeof body.conteudo === "string" ? body.conteudo : "";

    if (!conteudo.trim()) {
      return NextResponse.json(
        { error: "Conteúdo do comentário é obrigatório" },
        { status: 400 },
      );
    }

    if (conteudo.length > MAX_CONTEUDO) {
      return NextResponse.json(
        { error: `Comentário deve ter no máximo ${MAX_CONTEUDO} caracteres` },
        { status: 400 },
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

    if (!(await isNotaOwner(supabase, user.id, notaId))) {
      return NextResponse.json(
        { error: "Nota não encontrada ou não autorizada" },
        { status: 404 },
      );
    }

    let comentario: Record<string, unknown> | null = null;
    let comentarioError: { code?: string } | null = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const result = await adminClient
        .from("nota_comentarios")
        .insert({
          nota_id: notaId,
          user_id: user.id,
          conteudo: conteudo.trim(),
        })
        .select()
        .single();

      comentario = result.data as Record<string, unknown> | null;
      comentarioError = result.error;

      if (comentario) {
        const { data: userData } = await adminClient.auth.admin.getUserById(
          user.id,
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
        .from("nota_comentarios")
        .insert({
          nota_id: notaId,
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
      if (comentarioError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Tabela de comentários não existe. Execute o SQL em supabase/migrations/20260307120000_nota_comentarios.sql no Supabase.",
          },
          { status: 503 },
        );
      }
      console.error("Erro ao criar comentário na nota:", comentarioError);
      return NextResponse.json(
        { error: "Erro ao criar comentário" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, comentario });
  } catch (error: unknown) {
    console.error("POST nota comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params;
    const { searchParams } = new URL(request.url);
    const comentarioId = searchParams.get("comentario_id");

    if (!comentarioId) {
      return NextResponse.json(
        { error: "ID do comentário é obrigatório" },
        { status: 400 },
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

    let deleteError: { code?: string } | null = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();

      const { data: row } = await adminClient
        .from("nota_comentarios")
        .select("user_id, nota_id")
        .eq("id", comentarioId)
        .single();

      if (!row) {
        return NextResponse.json(
          { error: "Comentário não encontrado" },
          { status: 404 },
        );
      }

      if (row.user_id !== user.id) {
        return NextResponse.json(
          { error: "Você não pode deletar este comentário" },
          { status: 403 },
        );
      }

      const result = await adminClient
        .from("nota_comentarios")
        .delete()
        .eq("id", comentarioId);

      deleteError = result.error;
    } else {
      const result = await supabase
        .from("nota_comentarios")
        .delete()
        .eq("id", comentarioId)
        .eq("user_id", user.id);

      deleteError = result.error;
    }

    if (deleteError) {
      console.error("Erro ao deletar comentário da nota:", deleteError);
      return NextResponse.json(
        { error: "Erro ao deletar comentário" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE nota comentários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
