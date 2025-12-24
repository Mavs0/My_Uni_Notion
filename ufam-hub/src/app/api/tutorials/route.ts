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

    const { searchParams } = new URL(request.url);
    const funcionalidade = searchParams.get("funcionalidade");
    const concluido = searchParams.get("concluido");

    // Buscar tutoriais
    let query = supabase
      .from("tutorials")
      .select("*")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (funcionalidade) {
      query = query.eq("funcionalidade", funcionalidade);
    }

    const { data: tutorials, error: tutorialsError } = await query;

    if (tutorialsError) {
      console.error("Erro ao buscar tutoriais:", tutorialsError);
      return NextResponse.json(
        { error: "Erro ao buscar tutoriais" },
        { status: 500 }
      );
    }

    // Buscar progresso do usuário
    const { data: progressData } = await supabase
      .from("user_tutorial_progress")
      .select("*")
      .eq("user_id", user.id);

    const progressMap = new Map(
      progressData?.map((p) => [p.tutorial_id, p]) || []
    );

    // Buscar número de passos para cada tutorial
    const tutorialIds = tutorials?.map((t) => t.id) || [];
    const { data: stepsData } = await supabase
      .from("tutorial_steps")
      .select("tutorial_id")
      .in("tutorial_id", tutorialIds);

    const stepsCountMap = new Map<string, number>();
    stepsData?.forEach((step) => {
      stepsCountMap.set(
        step.tutorial_id,
        (stepsCountMap.get(step.tutorial_id) || 0) + 1
      );
    });

    // Combinar dados
    const tutorialsWithProgress = tutorials?.map((tutorial) => {
      const progress = progressMap.get(tutorial.id);
      const totalSteps = stepsCountMap.get(tutorial.id) || 0;

      return {
        id: tutorial.id,
        funcionalidade: tutorial.funcionalidade,
        titulo: tutorial.titulo,
        descricao: tutorial.descricao,
        icone: tutorial.icone,
        duracao_estimada: tutorial.duracao_estimada,
        dificuldade: tutorial.dificuldade,
        progresso: progress
          ? {
              passo_atual: progress.passo_atual,
              total_passos: totalSteps,
              concluido: progress.concluido,
              progresso_percentual:
                totalSteps > 0
                  ? Math.round((progress.passo_atual / totalSteps) * 100)
                  : 0,
            }
          : undefined,
      };
    });

    // Filtrar por status de conclusão se solicitado
    let filteredTutorials = tutorialsWithProgress;
    if (concluido === "true") {
      filteredTutorials = tutorialsWithProgress?.filter(
        (t) => t.progresso?.concluido
      );
    } else if (concluido === "false") {
      filteredTutorials = tutorialsWithProgress?.filter(
        (t) => !t.progresso?.concluido
      );
    }

    return NextResponse.json({ tutorials: filteredTutorials || [] });
  } catch (error: any) {
    console.error("Erro na API de tutoriais:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
