import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
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
      .select(
        `
        *,
        usuario:auth.users!biblioteca_materiais_user_id_fkey(id, raw_user_meta_data),
        grupo:grupos_estudo(id, nome)
      `
      )
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
      .update({ visualizacoes: (material.visualizacoes || 0) + 1 })
      .eq("id", material_id);

    return NextResponse.json({ material });
  } catch (error: any) {
    console.error("Erro na API de material:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
