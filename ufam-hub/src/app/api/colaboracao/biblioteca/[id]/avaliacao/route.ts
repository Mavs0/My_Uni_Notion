import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const client = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseAdmin()
      : supabase;

    const { data: avaliacoes, error } = await client
      .from("biblioteca_avaliacoes")
      .select("nota, user_id")
      .eq("material_id", materialId);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({
          media: 0,
          total: 0,
          minhaNota: null,
        });
      }
      console.error("Erro ao buscar avaliações:", error);
      return NextResponse.json(
        { error: "Erro ao buscar avaliações" },
        { status: 500 }
      );
    }

    const lista = avaliacoes || [];
    const total = lista.length;
    const soma = lista.reduce((acc, a) => acc + (a.nota || 0), 0);
    const media = total > 0 ? Math.round((soma / total) * 10) / 10 : 0;
    const minhaNota = lista.find((a) => a.user_id === user.id)?.nota ?? null;

    return NextResponse.json({
      media,
      total,
      minhaNota,
    });
  } catch (err) {
    console.error("Erro na API de avaliação:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const body = await request.json();
    const { nota } = body;
    if (typeof nota !== "number" || nota < 1 || nota > 5) {
      return NextResponse.json(
        { error: "Nota deve ser um número entre 1 e 5" },
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

    const client = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseAdmin()
      : supabase;

    const { error: upsertError } = await client
      .from("biblioteca_avaliacoes")
      .upsert(
        {
          material_id: materialId,
          user_id: user.id,
          nota: Math.round(nota),
        },
        { onConflict: "material_id,user_id" }
      );

    if (upsertError) {
      if (upsertError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Tabela biblioteca_avaliacoes não existe. Execute o SQL em sql/biblioteca_avaliacoes.sql no Supabase.",
          },
          { status: 503 }
        );
      }
      console.error("Erro ao salvar avaliação:", upsertError);
      return NextResponse.json(
        { error: "Erro ao salvar avaliação" },
        { status: 500 }
      );
    }

    const { data: avaliacoes } = await client
      .from("biblioteca_avaliacoes")
      .select("nota, user_id")
      .eq("material_id", materialId);
    const lista = avaliacoes || [];
    const total = lista.length;
    const soma = lista.reduce((acc, a) => acc + (a.nota || 0), 0);
    const media = total > 0 ? Math.round((soma / total) * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      media,
      total,
      minhaNota: Math.round(nota),
    });
  } catch (err) {
    console.error("Erro na API de avaliação:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
