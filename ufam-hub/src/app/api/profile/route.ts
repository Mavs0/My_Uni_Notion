import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  sanitizeAvatarUrlForJwt,
  isInlineDataAvatar,
  MAX_AVATAR_URL_LENGTH,
} from "@/lib/profile/avatar-metadata";

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
    const rawAvatar = user.user_metadata?.avatar_url || "";
    const profile = {
      id: user.id,
      email: user.email,
      nome: user.user_metadata?.nome || user.user_metadata?.full_name || "",
      /* Não devolver data URI gigante ao cliente; o JWT continua grande até limpeza no cliente/login */
      avatar_url: sanitizeAvatarUrlForJwt(
        typeof rawAvatar === "string" ? rawAvatar : "",
      ),
      bio: user.user_metadata?.bio || "",
      curso: user.user_metadata?.curso || "",
      periodo: user.user_metadata?.periodo || "",
      matricula: user.user_metadata?.matricula || "",
      telefone: user.user_metadata?.telefone || "",
      tema_preferencia: user.user_metadata?.tema_preferencia || "system",
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
    } = body;
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const updateData: Record<string, string> = {};
    if (nome !== undefined) updateData.nome = nome || "";
    if (bio !== undefined) updateData.bio = bio || "";
    if (curso !== undefined) updateData.curso = curso || "";
    if (periodo !== undefined) updateData.periodo = periodo || "";
    if (matricula !== undefined) updateData.matricula = matricula || "";
    if (telefone !== undefined) updateData.telefone = telefone || "";
    if (avatar_url !== undefined) {
      const a = typeof avatar_url === "string" ? avatar_url : "";
      if (isInlineDataAvatar(a)) {
        return NextResponse.json(
          {
            error:
              "Não é permitido guardar a foto em base64 no perfil (incha a sessão e causa erros 401/431). Usa o envio de ficheiro ou uma URL https.",
          },
          { status: 400 },
        );
      }
      if (a.length > MAX_AVATAR_URL_LENGTH) {
        return NextResponse.json(
          { error: `URL do avatar demasiado longa (máx. ${MAX_AVATAR_URL_LENGTH} caracteres).` },
          { status: 400 },
        );
      }
      updateData.avatar_url = sanitizeAvatarUrlForJwt(a);
    }
    if (tema_preferencia !== undefined)
      updateData.tema_preferencia = tema_preferencia;
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
