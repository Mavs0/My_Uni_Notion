import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

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

    let material: any = null;
    let materialError: any = null;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();

      const { data, error } = await adminClient
        .from("biblioteca_materiais")
        .select(
          `
          *,
          grupo:grupos_estudo(id, nome)
        `
        )
        .eq("id", material_id)
        .single();

      material = data;
      materialError = error;

      // Buscar dados do usuário
      if (material && material.user_id) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            material.user_id
          );
          material.usuario = {
            id: material.user_id,
            raw_user_meta_data: userData?.user?.user_metadata || null,
          };
        } catch (err) {
          material.usuario = {
            id: material.user_id,
            raw_user_meta_data: null,
          };
        }
      }

      // Verificar permissão de acesso
      if (material) {
        const { data: membrosData } = await adminClient
          .from("grupo_membros")
          .select("grupo_id")
          .eq("user_id", user.id)
          .eq("status", "ativo");

        const gruposDoUsuario = new Set(
          membrosData?.map((m) => m.grupo_id) || []
        );

        const temPermissao =
          material.visibilidade === "publico" ||
          material.visibilidade === "geral" ||
          material.user_id === user.id ||
          (material.visibilidade === "privado" &&
            material.grupo_id &&
            gruposDoUsuario.has(material.grupo_id));

        if (!temPermissao) {
          return NextResponse.json(
            { error: "Você não tem permissão para acessar este material" },
            { status: 403 }
          );
        }
      }

      // Incrementar visualizações
      if (material) {
        await adminClient
          .from("biblioteca_materiais")
          .update({ visualizacoes: (material.visualizacoes || 0) + 1 })
          .eq("id", material_id);
      }
    } else {
      const { data, error } = await supabase
        .from("biblioteca_materiais")
        .select(
          `
          *,
          grupo:grupos_estudo(id, nome)
        `
        )
        .eq("id", material_id)
        .single();

      material = data;
      materialError = error;

      if (material) {
        material.usuario = {
          id: material.user_id,
          raw_user_meta_data: null,
        };

        await supabase
          .from("biblioteca_materiais")
          .update({ visualizacoes: (material.visualizacoes || 0) + 1 })
          .eq("id", material_id);
      }
    }

    if (materialError || !material) {
      console.error("Erro ao buscar material:", materialError);
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ material });
  } catch (error: any) {
    console.error("Erro na API de material:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
