import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: material_id } = await params;

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
        .select(
          `
          id,
          titulo,
          descricao,
          tipo,
          categoria,
          arquivo_url,
          arquivo_tipo,
          arquivo_tamanho,
          visualizacoes,
          downloads,
          curtidas,
          tags,
          created_at,
          user_id,
          grupo_id,
          visibilidade,
          ativo,
          grupo:grupos_estudo(id, nome)
        `
        )
        .eq("id", material_id)
        .single();

      material = data;
      materialError = error;

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

      if (material) {
        const { data: membrosData } = await adminClient
          .from("grupo_membros")
          .select("grupo_id")
          .eq("user_id", user.id)
          .eq("status", "ativo");

        const gruposDoUsuario = new Set(
          membrosData?.map((m) => m.grupo_id) || []
        );

        const vis = material.visibilidade ?? "publico";
        const temPermissao =
          vis === "publico" ||
          vis === "geral" ||
          material.user_id === user.id ||
          (vis === "privado" &&
            material.grupo_id &&
            gruposDoUsuario.has(material.grupo_id));

        if (!temPermissao) {
          return NextResponse.json(
            { error: "Você não tem permissão para acessar este material" },
            { status: 403 }
          );
        }
      }

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
          id,
          titulo,
          descricao,
          tipo,
          categoria,
          arquivo_url,
          arquivo_tipo,
          arquivo_tamanho,
          visualizacoes,
          downloads,
          curtidas,
          tags,
          created_at,
          user_id,
          grupo_id,
          visibilidade,
          ativo,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: material_id } = await params;
    const body = await request.json();
    const { titulo, descricao, tags, arquivo_url, arquivo_tipo } = body;

    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof titulo === "string") updates.titulo = titulo;
    if (typeof descricao === "string") updates.descricao = descricao;
    if (Array.isArray(tags)) updates.tags = tags;
    if (typeof arquivo_url === "string") updates.arquivo_url = arquivo_url;
    if (typeof arquivo_tipo === "string") updates.arquivo_tipo = arquivo_tipo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      );
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createSupabaseAdmin();
      const { data: row, error: selErr } = await adminClient
        .from("biblioteca_materiais")
        .select("user_id")
        .eq("id", material_id)
        .single();

      if (selErr || !row) {
        return NextResponse.json(
          { error: "Material não encontrado" },
          { status: 404 }
        );
      }
      if (row.user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }

      const { data: updated, error: upErr } = await adminClient
        .from("biblioteca_materiais")
        .update(updates)
        .eq("id", material_id)
        .select()
        .single();

      if (upErr) {
        console.error(upErr);
        return NextResponse.json(
          { error: "Erro ao atualizar material" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, material: updated });
    }

    const { data: owned, error: ownErr } = await supabase
      .from("biblioteca_materiais")
      .select("id")
      .eq("id", material_id)
      .eq("user_id", user.id)
      .single();

    if (ownErr || !owned) {
      return NextResponse.json(
        { error: "Material não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    const { data: updated, error: upErr } = await supabase
      .from("biblioteca_materiais")
      .update(updates)
      .eq("id", material_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (upErr) {
      console.error(upErr);
      return NextResponse.json(
        { error: "Erro ao atualizar material" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, material: updated });
  } catch (error: unknown) {
    console.error("Erro PATCH biblioteca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
