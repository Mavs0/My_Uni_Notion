import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

const MAX_CONTEUDO = 2000;

/** PostgREST / Postgres: tabela ausente ou não exposta no cache. */
function isRelationMissingError(err: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!err) return false;
  const c = err.code || "";
  const m = (err.message || "").toLowerCase();
  if (c === "42P01" || c === "PGRST205") return true;
  if (m.includes("nota_comentarios")) {
    if (
      m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find")
    ) {
      return true;
    }
  }
  return false;
}

/** BD: coluna `comentario`; front/API: `conteudo`. */
function rowToApiComentario(row: Record<string, unknown>): Record<string, unknown> {
  const { comentario, conteudo: _legacy, ...rest } = row;
  const text =
    typeof comentario === "string"
      ? comentario
      : typeof row.conteudo === "string"
        ? row.conteudo
        : "";
  return { ...rest, conteudo: text };
}

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
              return rowToApiComentario({
                ...comentario,
                usuario: {
                  id: comentario.user_id,
                  raw_user_meta_data: userData?.user?.user_metadata || null,
                },
              } as Record<string, unknown>);
            } catch {
              return rowToApiComentario({
                ...comentario,
                usuario: {
                  id: comentario.user_id,
                  raw_user_meta_data: null,
                },
              } as Record<string, unknown>);
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

      comentarios = (result.data || []).map((c) =>
        rowToApiComentario({
          ...c,
          usuario: { id: c.user_id, raw_user_meta_data: null },
        } as Record<string, unknown>),
      );
      comentariosError = result.error;
    }

    if (comentariosError) {
      if (isRelationMissingError(comentariosError)) {
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

    const insertResult = await supabase
      .from("nota_comentarios")
      .insert({
        nota_id: notaId,
        user_id: user.id,
        comentario: conteudo.trim(),
        nota_compartilhada_id: null,
      })
      .select()
      .single();

    const comentarioError = insertResult.error;
    let comentario = insertResult.data as Record<string, unknown> | null;

    if (comentarioError) {
      if (isRelationMissingError(comentarioError)) {
        return NextResponse.json(
          {
            error:
              "Tabela de comentários não existe. Execute o SQL em supabase/migrations/20260508150000_nota_comentarios.sql no Supabase (SQL Editor).",
          },
          { status: 503 },
        );
      }
      console.error("Erro ao criar comentário na nota:", comentarioError);
      return NextResponse.json(
        {
          error: "Erro ao criar comentário",
          details:
            process.env.NODE_ENV === "development"
              ? comentarioError.message
              : undefined,
        },
        { status: 500 },
      );
    }

    if (comentario) {
      let rawMeta = null;
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminClient = createSupabaseAdmin();
          const { data: userData } = await adminClient.auth.admin.getUserById(
            user.id,
          );
          rawMeta = userData?.user?.user_metadata ?? null;
        } catch {
          rawMeta = null;
        }
      }
      comentario = rowToApiComentario({
        ...comentario,
        usuario: {
          id: user.id,
          raw_user_meta_data: rawMeta,
        },
      } as Record<string, unknown>);
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
