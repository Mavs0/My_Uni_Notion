import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: material_id } = await params;
    const body = await request.json();
    const { ativo } = body;

    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let material: any = null;
    let materialError: any = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();

      const { data, error } = await adminClient
        .from("biblioteca_materiais")
        .select("user_id")
        .eq("id", material_id)
        .single();

      material = data;
      materialError = error;

      if (materialError || !material) {
        return NextResponse.json(
          { error: "Material não encontrado" },
          { status: 404 }
        );
      }

      if (material.user_id !== user.id) {
        return NextResponse.json(
          { error: "Apenas o autor pode arquivar o material" },
          { status: 403 }
        );
      }

      const { data: updated, error: updateError } = await adminClient
        .from("biblioteca_materiais")
        .update({ ativo: ativo !== false })
        .eq("id", material_id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar status do material:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar status do material" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        material: updated,
      });
    } else {
      const { data, error } = await supabase
        .from("biblioteca_materiais")
        .select("user_id")
        .eq("id", material_id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Material não encontrado" },
          { status: 404 }
        );
      }

      if (data.user_id !== user.id) {
        return NextResponse.json(
          { error: "Apenas o autor pode arquivar o material" },
          { status: 403 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("biblioteca_materiais")
        .update({ ativo: ativo !== false })
        .eq("id", material_id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar status do material:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar status do material" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        material: updated,
      });
    }
  } catch (error: any) {
    console.error("Erro na API de toggle ativo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
