import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

function gerarLinkUnico(): string {
  return `share_${randomBytes(16).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nota_id,
      disciplina_id,
      titulo,
      descricao,
      visibilidade,
      permite_comentarios,
      permite_download,
      email_permitido,
    } = body;
    if (!nota_id || !titulo) {
      return NextResponse.json(
        { error: "nota_id e titulo são obrigatórios" },
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
    const { data: nota, error: notaError } = await supabase
      .from("notas")
      .select("id, user_id")
      .eq("id", nota_id)
      .eq("user_id", user.id)
      .single();
    if (notaError || !nota) {
      return NextResponse.json(
        { error: "Anotação não encontrada ou não autorizada" },
        { status: 404 },
      );
    }

    const client =
      process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createSupabaseAdmin()
        : supabase;

    const { data: existente } = await client
      .from("notas_compartilhadas")
      .select("id, link_compartilhamento, user_id")
      .eq("nota_id", nota_id)
      .maybeSingle();

    if (existente) {
      if (existente.user_id !== user.id) {
        return NextResponse.json(
          { error: "Não autorizado a alterar este compartilhamento" },
          { status: 403 },
        );
      }
      const patch: Record<string, unknown> = {};
      const visOk =
        visibilidade === "publico" ||
        visibilidade === "geral" ||
        visibilidade === "privado";
      if (visOk) {
        if (visibilidade === "publico") {
          patch.visibilidade = "publico";
          patch.email_permitido = null;
          patch.codigo_acesso = null;
        } else if (visibilidade === "geral") {
          const em =
            email_permitido && String(email_permitido).trim()
              ? String(email_permitido).toLowerCase().trim()
              : null;
          if (!em) {
            return NextResponse.json(
              {
                error:
                  "Para acesso apenas a convidados, informe o e-mail permitido.",
              },
              { status: 400 },
            );
          }
          patch.visibilidade = "geral";
          patch.email_permitido = em;
          patch.codigo_acesso = null;
        } else if (visibilidade === "privado") {
          patch.visibilidade = "privado";
          patch.email_permitido = null;
          const { data: cur } = await client
            .from("notas_compartilhadas")
            .select("codigo_acesso")
            .eq("id", existente.id)
            .single();
          if (!cur?.codigo_acesso) {
            patch.codigo_acesso = Math.floor(
              100000 + Math.random() * 900000,
            ).toString();
          }
        }
      }
      if (typeof permite_comentarios === "boolean") {
        patch.permite_comentarios = permite_comentarios;
      }
      if (typeof permite_download === "boolean") {
        patch.permite_download = permite_download;
      }
      if (Object.keys(patch).length > 0) {
        const { error: upErr } = await client
          .from("notas_compartilhadas")
          .update(patch)
          .eq("id", existente.id);
        if (upErr) {
          console.error("Erro ao atualizar compartilhamento existente:", upErr);
          return NextResponse.json(
            { error: upErr.message || "Erro ao atualizar compartilhamento" },
            { status: 500 },
          );
        }
      }
      const { data: full, error: selErr } = await client
        .from("notas_compartilhadas")
        .select("*")
        .eq("id", existente.id)
        .single();
      if (selErr || !full) {
        return NextResponse.json(
          { error: "Erro ao ler compartilhamento atualizado" },
          { status: 500 },
        );
      }
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app";
      return NextResponse.json({
        success: true,
        compartilhada: full,
        link: `${baseUrl}/compartilhado/${full.link_compartilhamento}`,
        codigo_acesso: full.codigo_acesso || null,
      });
    }

    const link_compartilhamento = gerarLinkUnico();

    let codigo_acesso = null;
    if (visibilidade === "privado") {
      codigo_acesso = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const insertData: any = {
      nota_id,
      disciplina_id: disciplina_id || null,
      user_id: user.id,
      titulo,
      descricao: descricao || null,
      visibilidade: visibilidade || "publico",
      link_compartilhamento,
      permite_comentarios: permite_comentarios !== false,
      permite_download: permite_download !== false,
    };

    if (email_permitido && visibilidade === "geral") {
      insertData.email_permitido = email_permitido.toLowerCase().trim();
    }

    if (codigo_acesso) {
      insertData.codigo_acesso = codigo_acesso;
    }

    const { data: compartilhada, error: shareError } = await client
      .from("notas_compartilhadas")
      .insert(insertData)
      .select()
      .single();
    if (shareError) {
      console.error("Erro ao compartilhar anotação:", shareError);
      const message =
        shareError.code === "42P01"
          ? "Tabela de compartilhamento não existe. Crie a tabela notas_compartilhadas no Supabase."
          : shareError.message || "Erro ao compartilhar anotação";
      return NextResponse.json(
        { error: message, details: process.env.NODE_ENV === "development" ? shareError : undefined },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      compartilhada,
      link: `${
        process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app"
      }/compartilhado/${link_compartilhamento}`,
      codigo_acesso: codigo_acesso,
    });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 },
    );
  }
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get("link");
    const disciplina_id = searchParams.get("disciplina_id");
    const visibilidade = searchParams.get("visibilidade");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const supabase = await createSupabaseServer(request);
    if (link) {
      const codigo = searchParams.get("codigo");
      const { data: compartilhada, error: compartilhadaError } = await supabase
        .from("notas_compartilhadas")
        .select("*")
        .eq("link_compartilhamento", link)
        .single();
      if (compartilhadaError || !compartilhada) {
        return NextResponse.json(
          { error: "Anotação não encontrada" },
          { status: 404 },
        );
      }

      if (compartilhada.visibilidade === "privado") {
        if (!codigo || codigo !== compartilhada.codigo_acesso) {
          return NextResponse.json(
            {
              error: "Código de acesso necessário",
              requer_codigo: true,
              visibilidade: "privado",
            },
            { status: 403 },
          );
        }
      }

      if (
        compartilhada.visibilidade === "geral" &&
        compartilhada.email_permitido
      ) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (
          !user ||
          user.email?.toLowerCase() !== compartilhada.email_permitido
        ) {
          return NextResponse.json(
            {
              error: "Acesso restrito a email específico",
              requer_email: true,
              email_permitido: compartilhada.email_permitido,
            },
            { status: 403 },
          );
        }
      }
      const { data: nota, error: notaError } = await supabase
        .from("notas")
        .select("content_md")
        .eq("id", compartilhada.nota_id)
        .single();
      const { data: usuario } = await supabase.auth.admin.getUserById(
        compartilhada.user_id,
      );
      await supabase
        .from("notas_compartilhadas")
        .update({ visualizacoes: (compartilhada.visualizacoes || 0) + 1 })
        .eq("id", compartilhada.id);
      return NextResponse.json({
        ...compartilhada,
        content_md: nota?.content_md || "",
        usuario: usuario?.user
          ? {
              id: usuario.user.id,
              raw_user_meta_data: usuario.user.user_metadata,
            }
          : null,
      });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const nota_id_param = searchParams.get("nota_id");
    if (nota_id_param) {
      const { data: notaOk, error: notaCheckErr } = await supabase
        .from("notas")
        .select("id")
        .eq("id", nota_id_param)
        .eq("user_id", user.id)
        .maybeSingle();
      if (notaCheckErr || !notaOk) {
        return NextResponse.json(
          { error: "Anotação não encontrada ou não autorizada" },
          { status: 404 },
        );
      }
      const shareClient =
        process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdmin()
          : supabase;
      const { data: row, error: oneErr } = await shareClient
        .from("notas_compartilhadas")
        .select("*")
        .eq("nota_id", nota_id_param)
        .eq("user_id", user.id)
        .maybeSingle();
      if (oneErr) {
        console.error("Erro ao buscar compartilhamento da nota:", oneErr);
        return NextResponse.json(
          { error: "Erro ao buscar compartilhamento" },
          { status: 500 },
        );
      }
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app";
      return NextResponse.json({
        compartilhada: row,
        link: row
          ? `${baseUrl}/compartilhado/${row.link_compartilhamento}`
          : null,
      });
    }
    let query = supabase
      .from("notas_compartilhadas")
      .select(
        `
        disciplina:disciplinas(id, nome),
        usuario:auth.users!notas_compartilhadas_user_id_fkey(id, raw_user_meta_data)
      `,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (disciplina_id) {
      query = query.eq("disciplina_id", disciplina_id);
    }
    if (visibilidade) {
      query = query.eq("visibilidade", visibilidade);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar anotações compartilhadas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar anotações compartilhadas" },
        { status: 500 },
      );
    }
    return NextResponse.json({ compartilhadas: data || [] });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nota_id,
      visibilidade,
      email_permitido,
      permite_comentarios,
      permite_download,
    } = body;
    if (!nota_id) {
      return NextResponse.json(
        { error: "nota_id é obrigatório" },
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
    const { data: notaDono, error: notaDonoErr } = await supabase
      .from("notas")
      .select("id")
      .eq("id", nota_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (notaDonoErr || !notaDono) {
      return NextResponse.json(
        { error: "Anotação não encontrada ou não autorizada" },
        { status: 404 },
      );
    }
    const client =
      process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createSupabaseAdmin()
        : supabase;

    const { data: row, error: findErr } = await client
      .from("notas_compartilhadas")
      .select("id, codigo_acesso, email_permitido, user_id")
      .eq("nota_id", nota_id)
      .maybeSingle();
    if (findErr) {
      console.error("PATCH compartilhar find:", findErr);
      return NextResponse.json(
        { error: "Erro ao buscar compartilhamento" },
        { status: 500 },
      );
    }
    if (!row || row.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Compartilhamento não encontrado. Use «Criar link com este acesso» primeiro.",
        },
        { status: 404 },
      );
    }

    const patch: Record<string, unknown> = {};
    if (visibilidade === "publico" || visibilidade === "geral" || visibilidade === "privado") {
      patch.visibilidade = visibilidade;
      if (visibilidade === "publico") {
        patch.email_permitido = null;
        patch.codigo_acesso = null;
      }
      if (visibilidade === "geral") {
        patch.codigo_acesso = null;
        const fromBody =
          email_permitido !== undefined && String(email_permitido).trim()
            ? String(email_permitido).toLowerCase().trim()
            : null;
        const nextEmail = fromBody || row.email_permitido || null;
        if (!nextEmail) {
          return NextResponse.json(
            {
              error:
                "Informe um e-mail para o modo apenas convidados, ou use Convidar antes.",
            },
            { status: 400 },
          );
        }
        patch.email_permitido = nextEmail;
      }
      if (visibilidade === "privado") {
        patch.email_permitido = null;
        if (!row.codigo_acesso) {
          patch.codigo_acesso = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
        }
      }
    }
    if (typeof permite_comentarios === "boolean") {
      patch.permite_comentarios = permite_comentarios;
    }
    if (typeof permite_download === "boolean") {
      patch.permite_download = permite_download;
    }
    if (email_permitido !== undefined && visibilidade === undefined) {
      patch.email_permitido = email_permitido
        ? String(email_permitido).toLowerCase().trim()
        : null;
    }

    const { data: updated, error: upErr } = await client
      .from("notas_compartilhadas")
      .update(patch)
      .eq("id", row.id)
      .select()
      .single();
    if (upErr) {
      console.error("Erro ao atualizar compartilhamento:", upErr);
      return NextResponse.json(
        { error: upErr.message || "Erro ao atualizar" },
        { status: 500 },
      );
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://my-uni-notion.vercel.app";
    return NextResponse.json({
      success: true,
      compartilhada: updated,
      link: `${baseUrl}/compartilhado/${updated.link_compartilhamento}`,
      codigo_acesso: updated.codigo_acesso || null,
    });
  } catch (error: any) {
    console.error("PATCH compartilhar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { error } = await supabase
      .from("notas_compartilhadas")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      console.error("Erro ao descompartilhar:", error);
      return NextResponse.json(
        { error: "Erro ao descompartilhar anotação" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
