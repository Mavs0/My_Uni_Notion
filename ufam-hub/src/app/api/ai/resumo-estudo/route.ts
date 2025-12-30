import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplinaId, tipoAvaliacao, descricao } = body;

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

    // Buscar disciplina
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

    // Buscar anotações da disciplina
    const { data: notas, error: notasError } = await supabase
      .from("notas")
      .select("titulo, content_md")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (notasError) {
      console.error("Erro ao buscar notas:", notasError);
    }

    // Buscar avaliações anteriores da disciplina
    const { data: avaliacoesAnteriores, error: avalError } = await supabase
      .from("avaliacoes")
      .select("tipo, descricao, resumo_assuntos")
      .eq("user_id", user.id)
      .eq("disciplina_id", disciplinaId)
      .order("data_iso", { ascending: false })
      .limit(5);

    const conteudoAnotacoes =
      notas
        ?.map((n) => `**${n.titulo}**:\n${n.content_md}`)
        .join("\n\n---\n\n")
        .slice(0, 6000) || "";

    const tipoTexto =
      tipoAvaliacao === "prova"
        ? "prova"
        : tipoAvaliacao === "trabalho"
        ? "trabalho"
        : tipoAvaliacao === "apresentacao"
        ? "apresentação"
        : "avaliação";

    const prompt = `Você é um assistente especializado em criar resumos de estudo eficazes para avaliações acadêmicas.

Com base nas informações abaixo da disciplina "${
      disciplina.nome
    }", crie um resumo de estudo para uma ${tipoTexto}${
      descricao ? ` sobre: ${descricao}` : ""
    }.

${conteudoAnotacoes ? `ANOTAÇÕES DO ALUNO:\n${conteudoAnotacoes}\n\n` : ""}

Crie um resumo estruturado e prático que inclua:
1. Objetivo da ${tipoTexto} (o que será avaliado)
2. Tópicos principais a revisar (lista organizada)
3. Conceitos-chave e definições importantes
4. Dicas de estudo específicas para esta ${tipoTexto}
5. Pontos de atenção (erros comuns, armadilhas)

Formate o resumo de forma clara e organizada, usando emojis quando apropriado para melhor visualização.
Seja específico e baseie-se nas anotações fornecidas quando disponíveis.

Retorne APENAS o texto do resumo, sem formatação adicional, sem markdown, sem código.`;

    let resultText = "";

    try {
      // Tentar primeiro com @ai-sdk/google
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

        // Fallback: usar @google/generative-ai diretamente
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Listar modelos disponíveis
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

        // Tentar modelos diferentes
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

      return NextResponse.json({
        resumo: resultText,
      });
    } catch (aiError: any) {
      console.error("Erro ao gerar resumo com IA:", aiError);
      return NextResponse.json(
        {
          error:
            aiError.message ||
            "Erro ao gerar resumo. Verifique se a API do Gemini está configurada.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro na API de resumo de estudo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
