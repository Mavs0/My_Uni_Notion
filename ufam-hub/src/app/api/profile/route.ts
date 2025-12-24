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
    const profile = {
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      bio: user.user_metadata?.bio || "",
      curso: user.user_metadata?.curso || "",
      periodo: user.user_metadata?.periodo || "",
      matricula: user.user_metadata?.matricula || "",
      telefone: user.user_metadata?.telefone || "",
      tema_preferencia: user.user_metadata?.tema_preferencia || "system",
      perfil_publico: user.user_metadata?.perfil_publico || false,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      bio,
      curso,
      periodo,
      matricula,
      telefone,
      avatar_url,
      tema_preferencia,
      perfil_publico,
    } = body;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome || "";
    if (bio !== undefined) updateData.bio = bio || "";
    if (curso !== undefined) updateData.curso = curso || "";
    if (periodo !== undefined) updateData.periodo = periodo || "";
    if (matricula !== undefined) updateData.matricula = matricula || "";
    if (telefone !== undefined) updateData.telefone = telefone || "";
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || "";
    if (tema_preferencia !== undefined)
      updateData.tema_preferencia = tema_preferencia;
    if (perfil_publico !== undefined)
      updateData.perfil_publico = perfil_publico;
    console.log("📝 Atualizando perfil do usuário:", user.id);
    console.log("📋 Dados a atualizar:", updateData);
    const { data, error } = await supabase.auth.updateUser({
      data: updateData,
    });
    if (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      return NextResponse.json(
        {
          error: "Erro ao atualizar perfil",
          details: error.message,
        },
        { status: 500 }
      );
    }
    console.log("✅ Perfil atualizado com sucesso");
    console.log("📊 Dados atualizados:", data.user.user_metadata);
    return NextResponse.json({
      success: true,
      profile: {
        id: data.user.id,
        email: data.user.email,
        nome: data.user.user_metadata?.nome || "",
        avatar_url: data.user.user_metadata?.avatar_url || "",
        bio: data.user.user_metadata?.bio || "",
        curso: data.user.user_metadata?.curso || "",
        periodo: data.user.user_metadata?.periodo || "",
        matricula: data.user.user_metadata?.matricula || "",
        telefone: data.user.user_metadata?.telefone || "",
        tema_preferencia: data.user.user_metadata?.tema_preferencia || "system",
        perfil_publico: data.user.user_metadata?.perfil_publico || false,
      },
    });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
