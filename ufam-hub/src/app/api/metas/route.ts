import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: metas, error } = await supabase
      .from("metas_estudo")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar metas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar metas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ metas: metas || [] });
  } catch (error: any) {
    console.error("Erro na API de metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplina_id, tipo, valor_alvo, periodo, descricao } = body;

    if (!tipo || !valor_alvo) {
      return NextResponse.json(
        { error: "tipo e valor_alvo são obrigatórios" },
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

    const { data: meta, error } = await supabase
      .from("metas_estudo")
      .insert({
        user_id: user.id,
        disciplina_id: disciplina_id || null,
        tipo,
        valor_alvo,
        periodo,
        descricao: descricao || null,
        valor_atual: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar meta:", error);
      return NextResponse.json(
        { error: "Erro ao criar meta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meta });
  } catch (error: any) {
    console.error("Erro na API de metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, valor_alvo, periodo, descricao, valor_atual } = body;

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const updateData: any = {};
    if (valor_alvo !== undefined) updateData.valor_alvo = valor_alvo;
    if (periodo !== undefined) updateData.periodo = periodo;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (valor_atual !== undefined) updateData.valor_atual = valor_atual;

    const { data: meta, error } = await supabase
      .from("metas_estudo")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar meta:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar meta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ meta });
  } catch (error: any) {
    console.error("Erro na API de metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { error } = await supabase
      .from("metas_estudo")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao deletar meta:", error);
      return NextResponse.json(
        { error: "Erro ao deletar meta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
