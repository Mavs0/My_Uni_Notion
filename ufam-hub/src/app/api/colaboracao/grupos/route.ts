import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServer,
  createSupabaseAdmin,
} from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      descricao,
      foto_url,
      visibilidade,
      max_membros,
      tags,
      requer_aprovacao,
    } = body;
    if (!nome) {
      return NextResponse.json(
        { error: "nome é obrigatório" },
        { status: 400 },
      );
    }
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.log("📝 Criando grupo:", nome);
    console.log("👤 Usuário:", user.id, user.email);

    const { data: grupo, error: grupoError } = await supabase.rpc(
      "criar_grupo_com_membro",
      {
        p_nome: nome,
        p_criador_id: user.id,
        p_descricao: descricao || null,
        p_foto_url: foto_url || null,
        p_visibilidade: visibilidade || "publico",
        p_max_membros: max_membros || 50,
        p_tags: tags || [],
      },
    );

    if (grupoError) {
      console.error("❌ Erro ao criar grupo:", grupoError);
      return NextResponse.json(
        {
          error: "Erro ao criar grupo",
          details: grupoError.message,
        },
        { status: 500 },
      );
    }

    if (!grupo) {
      return NextResponse.json(
        {
          error: "Erro ao criar grupo",
          details: "Grupo não foi criado",
        },
        { status: 500 },
      );
    }

    console.log("✅ Grupo criado com sucesso, ID:", grupo.id);

    if (grupo.id && visibilidade === "privado" && requer_aprovacao === true) {
      try {
        const updateClient = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdmin()
          : supabase;
        await updateClient
          .from("grupos_estudo")
          .update({ requer_aprovacao: true })
          .eq("id", grupo.id);
      } catch (updateErr) {
        console.warn("Aviso: não foi possível definir requer_aprovacao:", updateErr);
      }
    }

    return NextResponse.json({
      success: true,
      grupo,
      link_convite: `${
        process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app"
      }/grupos/convite/${grupo.link_convite}`,
    });
  } catch (error: any) {
    console.error("Erro na API de grupos:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error?.message || "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibilidade = searchParams.get("visibilidade");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const meus_grupos = searchParams.get("meus_grupos") === "true";
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let data, error;
    if (meus_grupos) {
      console.log("🔍 Buscando grupos do usuário:", user.id);
      let membros: any[] | null = null;
      let membrosError: any = null;

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("✅ Usando Service Role Key para buscar membros");
        try {
          const adminClient = createSupabaseAdmin();
          const result = await adminClient
            .from("grupo_membros")
            .select("grupo_id")
            .eq("user_id", user.id)
            .eq("status", "ativo");
          membros = result.data;
          membrosError = result.error;
        } catch (adminError: any) {
          console.error("❌ Erro ao usar Service Role Key:", adminError);
          membrosError = adminError;
        }
      } else {
        console.log(
          "⚠️ Service Role Key não configurada, usando cliente normal",
        );
        const result = await supabase
          .from("grupo_membros")
          .select("grupo_id")
          .eq("user_id", user.id)
          .eq("status", "ativo");
        membros = result.data;
        membrosError = result.error;
      }

      if (membrosError) {
        console.error("❌ Erro ao buscar membros:", membrosError);
        return NextResponse.json(
          { error: "Erro ao buscar grupos", details: membrosError.message },
          { status: 500 },
        );
      }
      console.log("👥 Membros encontrados:", membros?.length || 0);
      const grupoIds = membros?.map((m) => m.grupo_id) || [];
      console.log("📋 IDs dos grupos:", grupoIds);
      if (grupoIds.length === 0) {
        console.log("⚠️ Nenhum grupo encontrado para o usuário");
        return NextResponse.json({ grupos: [] });
      }

      let queryResult;
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("✅ Usando Service Role Key para buscar grupos");
        try {
          const adminClient = createSupabaseAdmin();
          queryResult = await adminClient
            .from("grupos_estudo")
            .select("*")
            .in("id", grupoIds)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        } catch (adminError: any) {
          console.error(
            "❌ Erro ao usar Service Role Key para grupos:",
            adminError,
          );
          queryResult = { data: null, error: adminError };
        }
      } else {
        console.log("⚠️ Usando cliente normal para buscar grupos");
        queryResult = await supabase
          .from("grupos_estudo")
          .select("*")
          .in("id", grupoIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
      }

      data = queryResult.data;
      error = queryResult.error;

      if (error) {
        console.error("❌ Erro ao buscar grupos:", error);
      } else {
        console.log("📊 Grupos encontrados:", data?.length || 0);
      }

      if (!error && data && data.length > 0) {
        const criadorIds = [...new Set(data.map((g: any) => g.criador_id))];
        const criadoresMap = new Map();

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const adminClient = createSupabaseAdmin();
            for (const criadorId of criadorIds) {
              try {
                const { data: criadorData, error: criadorError } =
                  await adminClient.auth.admin.getUserById(criadorId);
                if (!criadorError && criadorData?.user) {
                  criadoresMap.set(criadorId, {
                    id: criadorData.user.id,
                    raw_user_meta_data: criadorData.user.user_metadata || {},
                  });
                }
              } catch (err) {
                console.warn("Erro ao buscar criador:", criadorId, err);
              }
            }
          } catch (err) {
            console.warn(
              "Erro ao usar admin client para buscar criadores:",
              err,
            );
          }
        }

        for (const grupo of data) {
          (grupo as any).criador = criadoresMap.get(
            (grupo as any).criador_id,
          ) || {
            id: (grupo as any).criador_id,
            raw_user_meta_data: {},
          };
        }

        const ids = (data as any[]).map((g) => g.id as string);
        const countClient = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdmin()
          : supabase;
        const { data: membrosRows } = await countClient
          .from("grupo_membros")
          .select("grupo_id")
          .in("grupo_id", ids)
          .eq("status", "ativo");
        const membrosCountMap = new Map<string, number>();
        for (const row of membrosRows || []) {
          const gid = (row as { grupo_id: string }).grupo_id;
          membrosCountMap.set(gid, (membrosCountMap.get(gid) || 0) + 1);
        }
        for (const grupo of data as any[]) {
          grupo.membros_count = membrosCountMap.get(grupo.id) ?? 0;
        }
      }
    } else {
      let query = supabase
        .from("grupos_estudo")
        .select(
          `
          criador:auth.users!grupos_estudo_criador_id_fkey(id, raw_user_meta_data)
        `,
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (visibilidade) {
        query = query.eq("visibilidade", visibilidade);
      }
      const result = await query;
      data = result.data;
      error = result.error;
    }
    if (error) {
      console.error("Erro ao buscar grupos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar grupos" },
        { status: 500 },
      );
    }
    return NextResponse.json({ grupos: data || [] });
  } catch (error: any) {
    console.error("Erro na API de grupos:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error?.message || "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
