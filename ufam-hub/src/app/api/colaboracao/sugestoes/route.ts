import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateText } from "ai";
import { getAIModel } from "@/lib/ai/config";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplina_id = searchParams.get("disciplina_id");
    const limit = parseInt(searchParams.get("limit") || "5");
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let contexto: any = {
      disciplinas: [],
      avaliacoes_proximas: [],
      tarefas_pendentes: [],
      ultimo_estudo: null,
    };
    const { data: disciplinas } = await supabase
      .from("disciplinas")
      .select("id, nome, tipo")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (disciplinas) {
      contexto.disciplinas = disciplinas;
    }
    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select("id, disciplina_id, tipo, data_iso, descricao")
      .eq("user_id", user.id)
      .gte("data_iso", hoje.toISOString())
      .lte("data_iso", proximos7Dias.toISOString())
      .order("data_iso", { ascending: true })
      .limit(5);
    if (avaliacoes) {
      contexto.avaliacoes_proximas = avaliacoes;
    }
    const { data: tarefas } = await supabase
      .from("tarefas")
      .select("id, disciplina_id, titulo, prazo, prioridade")
      .eq("user_id", user.id)
      .eq("concluida", false)
      .order("prazo", { ascending: true })
      .limit(10);
    if (tarefas) {
      contexto.tarefas_pendentes = tarefas;
    }
    const { data: ultimoEstudo } = await supabase
      .from("progresso_horas")
      .select("disciplina_id, data_registro")
      .eq("user_id", user.id)
      .order("data_registro", { ascending: false })
      .limit(1)
      .single();
    if (ultimoEstudo) {
      contexto.ultimo_estudo = ultimoEstudo;
    }
    if (disciplina_id) {
      contexto.disciplinas = contexto.disciplinas.filter(
        (d: any) => d.id === disciplina_id
      );
      contexto.avaliacoes_proximas = contexto.avaliacoes_proximas.filter(
        (a: any) => a.disciplina_id === disciplina_id
      );
      contexto.tarefas_pendentes = contexto.tarefas_pendentes.filter(
        (t: any) => t.disciplina_id === disciplina_id
      );
    }
    const prompt = `Você é um assistente de estudos inteligente. Com base no contexto do estudante, gere ${limit} sugestões de estudo personalizadas e acionáveis.
Contexto do estudante:
- Disciplinas: ${JSON.stringify(contexto.disciplinas.map((d: any) => d.nome))}
- Avaliações próximas: ${JSON.stringify(contexto.avaliacoes_proximas)}
- Tarefas pendentes: ${JSON.stringify(contexto.tarefas_pendentes)}
- Último estudo: ${
      contexto.ultimo_estudo
        ? contexto.ultimo_estudo.data_registro
        : "Nenhum registro recente"
    }
Para cada sugestão, forneça:
1. Tipo: "revisao", "exercicio", "leitura", "pratica", "organizacao"
2. Título: Título curto e claro
3. Descrição: Descrição detalhada e acionável
4. Prioridade: 0-5 (0=baixa, 5=alta)
5. Baseado em: O que motivou esta sugestão
Retorne APENAS um JSON válido no formato:
{
  "sugestoes": [
    {
      "tipo_sugestao": "revisao",
      "titulo": "Revisar conceitos de...",
      "descricao": "Detalhes da sugestão...",
      "prioridade": 4,
      "baseado_em": "avaliacao_proxima"
    }
  ]
}`;
    try {
      const model = getAIModel();
      const { text } = await generateText({
        model,
        prompt,
        temperature: 0.7,
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Resposta da IA não contém JSON válido");
      }
      const respostaIA = JSON.parse(jsonMatch[0]);
      const sugestoes = respostaIA.sugestoes || [];
      const sugestoesParaSalvar = sugestoes.map((s: any) => ({
        user_id: user.id,
        disciplina_id: disciplina_id || null,
        tipo_sugestao: s.tipo_sugestao,
        titulo: s.titulo,
        descricao: s.descricao,
        prioridade: s.prioridade || 0,
        baseado_em: s.baseado_em || "historico",
        contexto: JSON.stringify(contexto),
        aceita: null,
        concluida: false,
      }));
      const { data: sugestoesSalvas, error: saveError } = await supabase
        .from("sugestoes_estudo")
        .insert(sugestoesParaSalvar)
        .select();
      if (saveError) {
        console.error("Erro ao salvar sugestões:", saveError);
        return NextResponse.json({ sugestoes });
      }
      return NextResponse.json({ sugestoes: sugestoesSalvas || sugestoes });
    } catch (aiError: any) {
      console.error("Erro ao gerar sugestões com IA:", aiError);
      const sugestoesBasicas = [
        {
          tipo_sugestao: "revisao",
          titulo: "Revisar matérias pendentes",
          descricao:
            "Revise os conteúdos das disciplinas que você não estudou recentemente.",
          prioridade: 3,
          baseado_em: "historico",
        },
      ];
      return NextResponse.json({ sugestoes: sugestoesBasicas });
    }
  } catch (error: any) {
    console.error("Erro na API de sugestões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplina_id = searchParams.get("disciplina_id");
    const concluida = searchParams.get("concluida") === "true";
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    let query = supabase
      .from("sugestoes_estudo")
      .select("*")
      .eq("user_id", user.id)
      .eq("concluida", concluida)
      .order("prioridade", { ascending: false })
      .order("created_at", { ascending: false });
    if (disciplina_id) {
      query = query.eq("disciplina_id", disciplina_id);
    }
    const { data: sugestoes, error } = await query;
    if (error) {
      console.error("Erro ao buscar sugestões:", error);
      return NextResponse.json(
        { error: "Erro ao buscar sugestões" },
        { status: 500 }
      );
    }
    return NextResponse.json({ sugestoes: sugestoes || [] });
  } catch (error: any) {
    console.error("Erro na API de sugestões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, aceita, concluida } = body;
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
    const updateData: any = {};
    if (aceita !== undefined) updateData.aceita = aceita;
    if (concluida !== undefined) updateData.concluida = concluida;
    const { data: sugestao, error } = await supabase
      .from("sugestoes_estudo")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) {
      console.error("Erro ao atualizar sugestão:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar sugestão" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, sugestao });
  } catch (error: any) {
    console.error("Erro na API de sugestões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}