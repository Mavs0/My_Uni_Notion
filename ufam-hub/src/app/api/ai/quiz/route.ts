import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateText } from "ai";
import { getAIModel } from "@/lib/ai/config";
import {
  getAiHttpError,
  shouldTryGeminiModelFallback,
} from "@/lib/ai/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseQuizFromModelText } from "@/lib/ai/parse-quiz-json";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { disciplinaId, tema, quantidade = 5, dificuldade = "medio" } = body;

    if (!disciplinaId) {
      return NextResponse.json(
        { error: "Disciplina é obrigatória" },
        { status: 400 }
      );
    }

    const { data: notasCtx } = await supabase
      .from("notas")
      .select("titulo, content_md")
      .eq("disciplina_id", disciplinaId)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    const contexto = notasCtx
      ?.map((a) => `${a.titulo || "Nota"}:\n${a.content_md || ""}`)
      .join("\n\n");

    const { data: disciplina } = await supabase
      .from("disciplinas")
      .select("nome")
      .eq("id", disciplinaId)
      .single();

    const dificuldadeTexto =
      dificuldade === "facil"
        ? "fácil (conceitos básicos)"
        : dificuldade === "dificil"
        ? "difícil (aplicação e análise)"
        : "médio (compreensão)";

    const prompt = `Você é um professor criando um quiz para testar o conhecimento de um aluno.

DISCIPLINA: ${disciplina?.nome || "Desconhecida"}
${tema ? `TEMA ESPECÍFICO: ${tema}` : ""}
DIFICULDADE: ${dificuldadeTexto}
QUANTIDADE DE PERGUNTAS: ${quantidade}

${
  contexto
    ? `MATERIAL DE ESTUDO DO ALUNO:
${contexto}`
    : ""
}

Gere ${quantidade} perguntas de múltipla escolha seguindo este formato JSON:

{
  "quiz": {
    "titulo": "Quiz sobre [tema]",
    "perguntas": [
      {
        "numero": 1,
        "pergunta": "Texto da pergunta?",
        "opcoes": {
          "a": "Opção A",
          "b": "Opção B",
          "c": "Opção C",
          "d": "Opção D"
        },
        "resposta_correta": "a",
        "explicacao": "Explicação de porque esta é a resposta correta."
      }
    ]
  }
}

REGRAS:
- Perguntas claras e objetivas
- 4 opções por pergunta (a, b, c, d)
- Apenas UMA resposta correta
- Explicação educativa para cada resposta
- Baseie-se no material do aluno quando disponível
- CRÍTICO: responda somente UM objeto JSON válido, sem markdown, sem \`\`\`, sem texto antes ou depois
- O JSON deve começar com { e terminar com }
- Use aspas duplas para todas as chaves e strings
- Não inclua comentários dentro do JSON`;

    let model;
    let result;
    let text;

    try {
      model = getAIModel();
      result = await generateText({
        model,
        prompt,
      });
      text = result.text;
    } catch (modelError: any) {
      console.error("Erro ao usar modelo padrão:", modelError);
      if (shouldTryGeminiModelFallback(modelError)) {
        console.log(
          "Tentando fallback com outros modelos Gemini (@google/generative-ai)…",
        );
        try {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          if (!apiKey) {
            throw new Error("API key não configurada");
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
                .filter((n: string) => n && n.includes("gemini"));
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
                  "gemini-pro",
                ];

          let ultimoErro: any = null;
          for (const nomeModelo of modelosParaTentar) {
            try {
              const modelo = genAI.getGenerativeModel({ model: nomeModelo });
              const resultado = await modelo.generateContent(prompt);
              text = resultado.response.text();
              console.log(`✅ Modelo ${nomeModelo} funcionou!`);
              break;
            } catch (erroModelo: any) {
              console.log(
                `❌ Modelo ${nomeModelo} falhou:`,
                erroModelo.message
              );
              ultimoErro = erroModelo;
              continue;
            }
          }

          if (!text) {
            throw new Error(
              `Nenhum modelo disponível. Tentei: ${modelosParaTentar.join(
                ", "
              )}. Último erro: ${ultimoErro?.message || "Desconhecido"}`
            );
          }
        } catch (fallbackError: any) {
          throw new Error(
            `Erro ao usar API direta do Google: ${fallbackError.message}. Verifique sua API key e modelos disponíveis no Google AI Studio.`
          );
        }
      } else {
        throw modelError;
      }
    }

    const parsed = parseQuizFromModelText(text);
    if (!parsed?.quiz?.perguntas?.length) {
      console.warn(
        "[quiz] Parse falhou ou quiz vazio. Primeiros 400 chars:",
        text?.slice(0, 400),
      );
      return NextResponse.json(
        {
          error:
            "A IA devolveu um formato que não conseguimos ler. Tente de novo, reduza o número de perguntas ou encurte o tema/material.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Erro ao gerar quiz:", error);
    const { status, message } = getAiHttpError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
