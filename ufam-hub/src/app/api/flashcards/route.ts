import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplinaId = searchParams.get("disciplina_id");
    const paraRevisar = searchParams.get("para_revisar") === "true";
    const tag = searchParams.get("tag");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let query = supabase
      .from("flashcards")
      .select(
        `
        *,
        disciplinas (
          id,
          nome
        )
      `
      )
      .eq("user_id", user.id);
    if (disciplinaId) {
      query = query.eq("disciplina_id", disciplinaId);
    }
    if (tag) {
      query = query.contains("tags", [tag]);
    }
    const { data: flashcards, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) {
      console.error("Erro ao buscar flashcards:", error);
      return NextResponse.json(
        { error: "Erro ao buscar flashcards" },
        { status: 500 }
      );
    }
    if (paraRevisar) {
      const { data: revisoes, error: revisoesError } = await supabase
        .from("flashcard_revisoes")
        .select(
          "flashcard_id, proxima_revisao, qualidade, intervalo_dias, fator_ease, repeticoes"
        )
        .eq("user_id", user.id)
        .lte("proxima_revisao", new Date().toISOString());
      if (revisoesError) {
        console.error("Erro ao buscar revisões:", revisoesError);
      }
      const idsParaRevisar = new Set(
        (revisoes || []).map((r) => r.flashcard_id)
      );
      const flashcardsParaRevisar = (flashcards || []).filter((fc) =>
        idsParaRevisar.has(fc.id)
      );
      const flashcardsComRevisao = flashcardsParaRevisar.map((fc) => {
        const revisao = (revisoes || []).find((r) => r.flashcard_id === fc.id);
        return {
          ...fc,
          revisao: revisao || null,
        };
      });
      return NextResponse.json({ flashcards: flashcardsComRevisao });
    }
    const { data: todasRevisoes, error: todasRevisoesError } = await supabase
      .from("flashcard_revisoes")
      .select(
        "flashcard_id, proxima_revisao, qualidade, intervalo_dias, fator_ease, repeticoes"
      )
      .eq("user_id", user.id)
      .in(
        "flashcard_id",
        (flashcards || []).map((fc) => fc.id)
      );
    if (todasRevisoesError) {
      console.error("Erro ao buscar todas as revisões:", todasRevisoesError);
    }
    const flashcardsComRevisao = (flashcards || []).map((fc) => {
      const revisao = (todasRevisoes || []).find(
        (r) => r.flashcard_id === fc.id
      );
      return {
        ...fc,
        revisao: revisao || null,
      };
    });
    return NextResponse.json({ flashcards: flashcardsComRevisao });
  } catch (error: any) {
    console.error("Erro na API de flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frente, verso, disciplinaId, tags, dificuldade, geradoPorIA } =
      body;
    if (!frente || !verso) {
      return NextResponse.json(
        { error: "Frente e verso são obrigatórios" },
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
    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .insert({
        user_id: user.id,
        disciplina_id: disciplinaId || null,
        frente,
        verso,
        tags: tags || [],
        dificuldade: dificuldade || 0,
        gerado_por_ia: geradoPorIA || false,
      })
      .select(
        `
        *,
        disciplinas (
          id,
          nome
        )
      `
      )
      .single();
    if (error) {
      console.error("Erro ao criar flashcard:", error);
      return NextResponse.json(
        { error: "Erro ao criar flashcard" },
        { status: 500 }
      );
    }
    return NextResponse.json({ flashcard });
  } catch (error: any) {
    console.error("Erro na API de flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, frente, verso, tags, dificuldade } = body;
    if (!id) {
      return NextResponse.json(
        { error: "ID do flashcard é obrigatório" },
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
    const { data: existing, error: checkError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Flashcard não encontrado" },
        { status: 404 }
      );
    }
    const updateData: any = {};
    if (frente !== undefined) updateData.frente = frente;
    if (verso !== undefined) updateData.verso = verso;
    if (tags !== undefined) updateData.tags = tags;
    if (dificuldade !== undefined) updateData.dificuldade = dificuldade;
    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        disciplinas (
          id,
          nome
        )
      `
      )
      .single();
    if (error) {
      console.error("Erro ao atualizar flashcard:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar flashcard" },
        { status: 500 }
      );
    }
    return NextResponse.json({ flashcard });
  } catch (error: any) {
    console.error("Erro na API de flashcards:", error);
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
      return NextResponse.json(
        { error: "ID do flashcard é obrigatório" },
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
    const { data: existing, error: checkError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Flashcard não encontrado" },
        { status: 404 }
      );
    }
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (error) {
      console.error("Erro ao deletar flashcard:", error);
      return NextResponse.json(
        { error: "Erro ao deletar flashcard" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}