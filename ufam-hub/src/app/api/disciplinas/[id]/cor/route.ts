import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disciplinaId = params.id;
    const body = await request.json();
    const { cor } = body;

    if (!cor || !/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      return NextResponse.json(
        { error: "Cor inválida. Use formato hexadecimal (#RRGGBB)" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("disciplinas")
      .update({ cor })
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cor:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar cor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ disciplina: data });
  } catch (error: any) {
    console.error("Erro na API de cor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
