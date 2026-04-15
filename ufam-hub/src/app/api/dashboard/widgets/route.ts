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

    const { data: widgets, error } = await supabase
      .from("dashboard_widgets")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (error) {
      console.error("Erro ao buscar widgets:", error);
      return NextResponse.json({ widgets: [] });
    }

    return NextResponse.json({ widgets: widgets || [] });
  } catch (error: any) {
    console.error("Erro na API de widgets:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { widgets } = body;

    if (!Array.isArray(widgets)) {
      return NextResponse.json(
        { error: "Widgets deve ser um array" },
        { status: 400 }
      );
    }

    await supabase
      .from("dashboard_widgets")
      .delete()
      .eq("user_id", user.id);

    if (widgets.length > 0) {
      const widgetsToInsert = widgets.map((widget: any, index: number) => ({
        user_id: user.id,
        widget_type: widget.type,
        widget_config: widget.config || {},
        position: index, // Garantir que position seja baseado no índice
        size: widget.size || "medium",
        visible: widget.visible !== false,
      }));

      const { error: insertError, data: insertedData } = await supabase
        .from("dashboard_widgets")
        .insert(widgetsToInsert)
        .select();

      if (insertError) {
        console.error("Erro ao inserir widgets:", insertError);
        console.error("Detalhes do erro:", JSON.stringify(insertError, null, 2));
        return NextResponse.json(
          { 
            error: "Erro ao salvar widgets",
            details: insertError.message || insertError
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de widgets:", error);
    console.error("Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

