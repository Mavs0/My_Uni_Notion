import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const material_id = params.id;

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: material, error: materialError } = await supabase
      .from("biblioteca_materiais")
      .select("downloads")
      .eq("id", material_id)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    await supabase
      .from("biblioteca_materiais")
      .update({ downloads: (material.downloads || 0) + 1 })
      .eq("id", material_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de download:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
