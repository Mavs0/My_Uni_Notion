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

    const { data: progress, error: progressError } = await supabase
      .from("user_tutorial_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("tutorial_id", tutorialId)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
      console.error("Erro ao buscar progresso:", progressError);
      return NextResponse.json(
        { error: "Erro ao buscar progresso" },
        { status: 500 }
      );
    }

    const { data: steps } = await supabase
      .from("tutorial_steps")
      .select("id")
      .eq("tutorial_id", tutorialId);

    const totalSteps = steps?.length || 0;

    if (!progress) {
      return NextResponse.json({
        progresso: {
          passo_atual: 0,
          passos_completados: [],
          concluido: false,
          iniciado_em: null,
          tempo_total: 0,
          progresso_percentual: 0,
        },
      });
    }

    const progressoPercentual =
      totalSteps > 0
        ? Math.round((progress.passo_atual / totalSteps) * 100)
        : 0;

    return NextResponse.json({
      progresso: {
        passo_atual: progress.passo_atual,
        passos_completados: progress.passos_completados || [],
        concluido: progress.concluido,
        iniciado_em: progress.iniciado_em,
        tempo_total: progress.tempo_total,
        progresso_percentual: progressoPercentual,
      },
    });
  } catch (error: any) {
    console.error("Erro na API de progresso:", error);
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
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id: tutorialId } = await params;
    const body = await request.json();
    const { passo_atual, passo_completado_id, acao } = body;

    // Buscar progresso existente
    const { data: existingProgress } = await supabase
      .from("user_tutorial_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("tutorial_id", tutorialId)
      .single();

    let passosCompletados = existingProgress?.passos_completados || [];
    if (
      passo_completado_id &&
      !passosCompletados.includes(passo_completado_id)
    ) {
      passosCompletados = [...passosCompletados, passo_completado_id];
    }

    // Buscar total de passos
    const { data: steps } = await supabase
      .from("tutorial_steps")
      .select("id")
      .eq("tutorial_id", tutorialId);

    const totalSteps = steps?.length || 0;
    const concluido = passo_atual >= totalSteps;

    const progressData: any = {
      user_id: user.id,
      tutorial_id: tutorialId,
      passo_atual: passo_atual || 0,
      passos_completados: passosCompletados,
      concluido,
    };

    if (concluido && !existingProgress?.concluido) {
      progressData.concluido_em = new Date().toISOString();
    }

    // Salvar ou atualizar progresso
    let result;
    if (existingProgress) {
      result = await supabase
        .from("user_tutorial_progress")
        .update(progressData)
        .eq("id", existingProgress.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("user_tutorial_progress")
        .insert(progressData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Erro ao salvar progresso:", result.error);
      return NextResponse.json(
        { error: "Erro ao salvar progresso" },
        { status: 500 }
      );
    }

    // Registrar ação se fornecida
    if (acao && passo_completado_id) {
      await supabase.from("tutorial_actions").insert({
        user_id: user.id,
        tutorial_id: tutorialId,
        step_id: passo_completado_id,
        acao_tipo: acao.tipo || "complete",
        acao_dados: acao.dados || {},
        sucesso: acao.sucesso !== false,
      });
    }

    return NextResponse.json({
      success: true,
      progresso: result.data,
    });
  } catch (error: any) {
    console.error("Erro na API de progresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
