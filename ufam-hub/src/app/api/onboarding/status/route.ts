import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const metadata = user.user_metadata || {};

    return NextResponse.json({
      tourCompleted: metadata.tour_completed || false,
      tourSkipped: metadata.tour_skipped || false,
      tourCompletedAt: metadata.tour_completed_at || null,
      checklistCompleted: metadata.checklist_completed || false,
      checklistCompletedAt: metadata.checklist_completed_at || null,
      isNewUser: !metadata.tour_completed && !metadata.tour_skipped,
    });
  } catch (error: any) {
    console.error("Erro na API de status onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

