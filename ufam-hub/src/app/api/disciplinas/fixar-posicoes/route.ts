import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar todas as disciplinas do usuário
    const { data: disciplinas, error: discError } = await supabase
      .from("disciplinas")
      .select("id, nome, favorito, ordem, ativo")
      .eq("user_id", user.id);

    if (discError) {
      console.error("Erro ao buscar disciplinas:", discError);
      return NextResponse.json(
        { error: "Erro ao buscar disciplinas" },
        { status: 500 }
      );
    }

    if (!disciplinas || disciplinas.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma disciplina encontrada",
      });
    }

    // Ordenar disciplinas da mesma forma que a página ordena:
    // 1. Favoritos primeiro
    // 2. Depois por ordem existente
    // 3. Por último, alfabética
    const disciplinasOrdenadas = [...disciplinas].sort((a, b) => {
      // Favoritos primeiro
      const aFavorito = a.favorito === true;
      const bFavorito = b.favorito === true;
      if (aFavorito && !bFavorito) return -1;
      if (!aFavorito && bFavorito) return 1;

      // Depois por ordem customizada
      const aOrdem = a.ordem ?? 999999;
      const bOrdem = b.ordem ?? 999999;
      if (aOrdem !== bOrdem) {
        return aOrdem - bOrdem;
      }

      // Por último, alfabética
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    // Atribuir ordem sequencial (0, 1, 2, ...)
    const updates = disciplinasOrdenadas.map((disc, index) => ({
      id: disc.id,
      ordem: index,
    }));

    // Atualizar ordem de cada disciplina
    const updatePromises = updates.map((d) =>
      supabase
        .from("disciplinas")
        .update({ ordem: d.ordem })
        .eq("id", d.id)
        .eq("user_id", user.id)
    );

    const results = await Promise.all(updatePromises);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error("Erros ao fixar posições:", errors);
      return NextResponse.json(
        { error: "Erro ao fixar posições de algumas disciplinas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Posições fixadas para ${updates.length} disciplina(s)`,
    });
  } catch (error: any) {
    console.error("Erro na API de fixar posições:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
