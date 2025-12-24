import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: tutorialId } = await params;

    // Buscar tutorial
    const { data: tutorial, error: tutorialError } = await supabase
      .from("tutorials")
      .select("*")
      .eq("id", tutorialId)
      .eq("ativo", true)
      .single();

    if (tutorialError || !tutorial) {
      return NextResponse.json(
        { error: "Tutorial não encontrado" },
        { status: 404 }
      );
    }

    // Buscar passos do tutorial
    const { data: steps, error: stepsError } = await supabase
      .from("tutorial_steps")
      .select("*")
      .eq("tutorial_id", tutorialId)
      .order("ordem", { ascending: true });

    if (stepsError) {
      console.error("Erro ao buscar passos:", stepsError);
      return NextResponse.json(
        { error: "Erro ao buscar passos do tutorial" },
        { status: 500 }
      );
    }

    // Buscar progresso do usuário
    const { data: progress } = await supabase
      .from("user_tutorial_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("tutorial_id", tutorialId)
      .single();

    const passosCompletados = new Set(progress?.passos_completados || []);

    const stepsWithProgress = steps?.map((step) => ({
      id: step.id,
      ordem: step.ordem,
      titulo: step.titulo,
      descricao: step.descricao,
      tipo: step.tipo,
      acao_esperada: step.acao_esperada,
      validacao: step.validacao,
      elemento_alvo: step.elemento_alvo,
      posicao_popover: step.posicao_popover,
      dica: step.dica,
      opcional: step.opcional,
      completado: passosCompletados.has(step.id),
    }));

    return NextResponse.json({
      tutorial: {
        id: tutorial.id,
        funcionalidade: tutorial.funcionalidade,
        titulo: tutorial.titulo,
        descricao: tutorial.descricao,
        icone: tutorial.icone,
        duracao_estimada: tutorial.duracao_estimada,
        dificuldade: tutorial.dificuldade,
        steps: stepsWithProgress || [],
        progresso: progress
          ? {
              passo_atual: progress.passo_atual,
              concluido: progress.concluido,
            }
          : undefined,
      },
    });
  } catch (error: any) {
    console.error("Erro na API de tutorial:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
