import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { tourCompleted, skipped, checklistCompleted } = body;

    // Atualizar metadata do usuário
    const updates: Record<string, any> = {};

    if (tourCompleted !== undefined) {
      updates.tour_completed = tourCompleted;
      updates.tour_completed_at = tourCompleted
        ? new Date().toISOString()
        : null;
    }

    if (skipped !== undefined) {
      updates.tour_skipped = skipped;
    }

    if (checklistCompleted !== undefined) {
      updates.checklist_completed = checklistCompleted;
      updates.checklist_completed_at = checklistCompleted
        ? new Date().toISOString()
        : null;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        ...updates,
      },
    });

    if (updateError) {
      console.error("Erro ao atualizar onboarding:", updateError);
      return NextResponse.json(
        { error: "Erro ao salvar progresso" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
