import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const supabase = await createSupabaseServer(request);
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
- Retorne APENAS o JSON, sem texto adicional, sem markdown, sem código`;

    let resultText = "";

    try {
      try {
        const model = getAIModel();
        const result = await generateText({
          model,
          prompt,
          temperature: 0.7,
        });
        resultText = result.text;
      } catch (sdkError: any) {
        console.log(
          "⚠️ Erro com @ai-sdk/google, tentando fallback direto:",
          sdkError.message
        );

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        let modelosDisponiveis: string[] = [];
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
          );
          if (response.ok) {
            const data = await response.json();
            modelosDisponiveis = (data.models || [])
              .map((m: any) => m.name?.replace("models/", "") || "")
              .filter((n: string) => {
                const model = data.models.find(
                  (mod: any) => mod.name?.replace("models/", "") === n
                );
                return (
                  n &&
                  n.includes("gemini") &&
                  model?.supportedGenerationMethods?.includes("generateContent")
                );
              });
            console.log(
              "✅ Modelos disponíveis encontrados:",
              modelosDisponiveis
            );
          }
        } catch (listError) {
          console.log(
            "⚠️ Não foi possível listar modelos, usando lista padrão"
          );
        }

        const modelosParaTentar =
          modelosDisponiveis.length > 0
            ? modelosDisponiveis
            : [
                "gemini-1.5-flash-002",
                "gemini-1.5-pro-002",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-2.0-flash-exp",
              ];

        let modeloFuncionou = false;
        let ultimoErro: any = null;

        for (const nomeModelo of modelosParaTentar) {
          try {
            const modelo = genAI.getGenerativeModel({ model: nomeModelo });
            const resultado = await modelo.generateContent(prompt);
            resultText = resultado.response.text();
            console.log(`✅ Modelo ${nomeModelo} funcionou!`);
            modeloFuncionou = true;
            break;
          } catch (erroModelo: any) {
            console.log(`❌ Modelo ${nomeModelo} falhou:`, erroModelo.message);
            ultimoErro = erroModelo;
            continue;
          }
        }

        if (!modeloFuncionou) {
          const modelosTentados = modelosParaTentar.join(", ");
          throw new Error(
            `Nenhum modelo funcionou. Modelos tentados: ${modelosTentados}. Último erro: ${
              ultimoErro?.message || "Desconhecido"
            }. Verifique sua API key e modelos disponíveis no Google AI Studio.`
          );
        }
      }
      let flashcardsData;
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          flashcardsData = JSON.parse(resultText);
        }
      } catch (parseError: any) {
        console.error("Erro ao parsear resposta da IA:", parseError);
        console.error("Resposta recebida:", resultText.substring(0, 500));
        return NextResponse.json(
          {
            error:
              "Erro ao processar resposta da IA. A resposta pode não estar no formato JSON esperado.",
            details: parseError.message,
            rawResponse: resultText.substring(0, 200),
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
