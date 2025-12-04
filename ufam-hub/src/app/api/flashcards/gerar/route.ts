import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplinaId, quantidade = 5 } = body;
    if (!disciplinaId) {
      return NextResponse.json(
        { error: "ID da disciplina é obrigatório" },
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
    const { data: disciplina, error: discError } = await supabase
      .from("disciplinas")
      .select("id, nome")
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .single();
    if (discError || !disciplina) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 404 }
      );
    }
    const { data: notas, error: notasError } = await supabase
      .from("notas")
      .select("content_md")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .order("updated_at", { ascending: false })
      .limit(5);
    if (notasError) {
      console.error("Erro ao buscar notas:", notasError);
    }
    if (!notas || notas.length === 0) {
      return NextResponse.json(
        {
          error: "Nenhuma anotação encontrada para esta disciplina",
        },
        { status: 400 }
      );
    }
    const conteudoAnotacoes = notas
      .map((n) => n.content_md)
      .filter(Boolean)
      .join("\n\n---\n\n")
      .slice(0, 8000);
    const model = getAIModel();
    const prompt = `Você é um assistente especializado em criar flashcards educacionais eficazes.
Com base nas anotações abaixo da disciplina "${disciplina.nome}", crie exatamente ${quantidade} flashcards no formato JSON.
Cada flashcard deve ter:
- "frente": Uma pergunta clara e objetiva (máximo 100 caracteres)
- "verso": Uma resposta concisa e completa (máximo 200 caracteres)
- "dificuldade": 0 (fácil), 1 (médio) ou 2 (difícil)
ANOTAÇÕES:
${conteudoAnotacoes}
Retorne APENAS um JSON válido no formato:
{
  "flashcards": [
    {
      "frente": "Pergunta aqui",
      "verso": "Resposta aqui",
      "dificuldade": 1
    }
  ]
}
IMPORTANTE:
- Crie perguntas que testem compreensão, não apenas memorização
- As respostas devem ser precisas e baseadas nas anotações
- Varie a dificuldade dos flashcards
- Retorne APENAS o JSON, sem texto adicional`;
    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 0.7,
      });
      let flashcardsData;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          flashcardsData = JSON.parse(result.text);
        }
      } catch (parseError) {
        console.error("Erro ao parsear resposta da IA:", parseError);
        return NextResponse.json(
          {
            error: "Erro ao processar resposta da IA. Tente novamente.",
          },
          { status: 500 }
        );
      }
      if (
        !flashcardsData.flashcards ||
        !Array.isArray(flashcardsData.flashcards)
      ) {
        return NextResponse.json(
          { error: "Formato de resposta inválido da IA" },
          { status: 500 }
        );
      }
      const flashcardsParaCriar = flashcardsData.flashcards.map((fc: any) => ({
        user_id: user.id,
        disciplina_id: disciplinaId,
        frente: fc.frente || "",
        verso: fc.verso || "",
        dificuldade: fc.dificuldade || 1,
        gerado_por_ia: true,
        tags: [],
      }));
      const { data: flashcardsCriados, error: createError } = await supabase
        .from("flashcards")
        .insert(flashcardsParaCriar)
        .select(
          `
          *,
          disciplinas (
            id,
            nome
          )
        `
        );
      if (createError) {
        console.error("Erro ao criar flashcards:", createError);
        return NextResponse.json(
          { error: "Erro ao criar flashcards" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        flashcards: flashcardsCriados,
        quantidade: flashcardsCriados?.length || 0,
      });
    } catch (aiError: any) {
      console.error("Erro ao gerar flashcards com IA:", aiError);
      return NextResponse.json(
        {
          error:
            aiError.message ||
            "Erro ao gerar flashcards. Verifique se a API do Gemini está configurada.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro na API de geração de flashcards:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}