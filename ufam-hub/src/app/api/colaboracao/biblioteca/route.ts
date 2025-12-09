import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      descricao,
      tipo,
      grupo_id,
      referencia_id,
      arquivo_url,
      arquivo_tipo,
      arquivo_tamanho,
      tags,
      categoria,
      visibilidade,
    } = body;
    if (!titulo || !tipo) {
      return NextResponse.json(
        { error: "titulo e tipo são obrigatórios" },
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
    if (grupo_id) {
      let membro = null;
      let membroError = null;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const adminClient = createSupabaseAdmin();
          const result = await adminClient
            .from("grupo_membros")
            .select("id")
            .eq("grupo_id", grupo_id)
            .eq("user_id", user.id)
            .eq("status", "ativo")
            .single();
          membro = result.data;
          membroError = result.error;
        } catch (err) {
          console.warn("Erro ao verificar membro com admin client:", err);
        }
      } else {
        const result = await supabase
          .from("grupo_membros")
          .select("id")
          .eq("grupo_id", grupo_id)
          .eq("user_id", user.id)
          .eq("status", "ativo")
          .single();
        membro = result.data;
        membroError = result.error;
      }

      if (membroError || !membro) {
        console.error("Erro ao verificar membro:", membroError);
        return NextResponse.json(
          { error: "Você não é membro deste grupo" },
          { status: 403 }
        );
      }
    }
    const insertData: any = {
      titulo,
      descricao: descricao || null,
      tipo,
      user_id: user.id,
      grupo_id: grupo_id || null,
      referencia_id: referencia_id || null,
      arquivo_url: arquivo_url || null,
      arquivo_tipo: arquivo_tipo || null,
      arquivo_tamanho: arquivo_tamanho || null,
      tags: tags || [],
      categoria: categoria || null,
      visibilidade: visibilidade || "publico",
      visualizacoes: 0,
      downloads: 0,
      curtidas: 0,
    };

    console.log("📝 Tentando inserir material:", {
      titulo,
      tipo,
      user_id: user.id,
      grupo_id: grupo_id || null,
      visibilidade: visibilidade || "publico",
    });

    let material, materialError;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = createSupabaseAdmin();
        const result = await adminClient
          .from("biblioteca_materiais")
          .insert(insertData)
          .select()
          .single();
        material = result.data;
        materialError = result.error;
      } catch (err: any) {
        console.error("Erro ao inserir com admin client:", err);
        materialError = err;
      }
    } else {
      const result = await supabase
        .from("biblioteca_materiais")
        .insert(insertData)
        .select()
        .single();
      material = result.data;
      materialError = result.error;
    }

    if (materialError) {
      console.error("❌ Erro ao adicionar material:", materialError);
      return NextResponse.json(
        {
          error: "Erro ao adicionar material",
          details: materialError.message || JSON.stringify(materialError),
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, material });
  } catch (error: any) {
    console.error("Erro na API de biblioteca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const categoria = searchParams.get("categoria");
    const grupo_id = searchParams.get("grupo_id");
    const busca = searchParams.get("busca");
    const tags = searchParams.get("tags");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let countQuery = supabase
      .from("biblioteca_materiais")
      .select("*", { count: "exact", head: true });

    let query = supabase
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
        grupo:grupos_estudo(id, nome)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (tipo) {
      query = query.eq("tipo", tipo);
      countQuery = countQuery.eq("tipo", tipo);
    }
    if (categoria) {
      query = query.eq("categoria", categoria);
      countQuery = countQuery.eq("categoria", categoria);
    }
    if (grupo_id) {
      query = query.eq("grupo_id", grupo_id);
      countQuery = countQuery.eq("grupo_id", grupo_id);
    }
    if (busca) {
      query = query.or(`titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`);
      countQuery = countQuery.or(
        `titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`
      );
    }
    if (tags) {
      const tagsArray = tags.split(",");
      query = query.contains("tags", tagsArray);
      countQuery = countQuery.contains("tags", tagsArray);
    }
    const { data, error, count } = await query;
    if (error) {
      console.error("Erro ao buscar materiais:", error);
      return NextResponse.json(
        {
          error: "Erro ao buscar materiais",
          details: error.message || JSON.stringify(error),
        },
        { status: 500 }
      );
    }

    const total = count || data?.length || 0;
    const hasMore = (data?.length || 0) === limit;

    let materiaisComUsuario = data || [];

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createSupabaseAdmin();
        materiaisComUsuario = await Promise.all(
          (data || []).map(async (material: any) => {
            try {
              const { data: userData } =
                await supabaseAdmin.auth.admin.getUserById(material.user_id);
              return {
                ...material,
                usuario: {
                  id: material.user_id,
                  raw_user_meta_data: userData?.user?.user_metadata || null,
                },
              };
            } catch (err) {
              console.warn("Erro ao buscar usuário:", material.user_id, err);
              return {
                ...material,
                usuario: {
                  id: material.user_id,
                  raw_user_meta_data: null,
                },
              };
            }
          })
        );
      } catch (err: any) {
        console.warn(
          "Erro ao usar admin client, retornando sem dados de usuário:",
          err
        );
        materiaisComUsuario = (data || []).map((material: any) => ({
          ...material,
          usuario: {
            id: material.user_id,
            raw_user_meta_data: null,
          },
        }));
      }
    } else {
      materiaisComUsuario = (data || []).map((material: any) => ({
        ...material,
        usuario: {
          id: material.user_id,
          raw_user_meta_data: null,
        },
      }));
    }

    return NextResponse.json({
      materiais: materiaisComUsuario,
      hasMore,
      total,
      offset,
      limit,
    });
  } catch (error: any) {
    console.error("Erro na API de biblioteca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
