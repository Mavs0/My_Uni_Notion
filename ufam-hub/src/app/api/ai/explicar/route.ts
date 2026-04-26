import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { streamText } from "ai";
import { getAIModel } from "@/lib/ai/config";
import {
  getAiHttpError,
  shouldTryGeminiModelFallback,
} from "@/lib/ai/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { conceito, disciplinaId, nivel = "intermediario" } = body;

    if (!conceito) {
      return NextResponse.json(
        { error: "Conceito é obrigatório" },
        { status: 400 }
      );
    }

    let disciplinaNome = "";
    if (disciplinaId) {
      const { data: disciplina } = await supabase
        .from("disciplinas")
        .select("nome")
        .eq("id", disciplinaId)
        .single();
      disciplinaNome = disciplina?.nome || "";
    }

    const nivelTexto =
      nivel === "basico"
        ? "iniciante (use linguagem simples e analogias do dia a dia)"
        : nivel === "avancado"
        ? "avançado (pode usar termos técnicos e ir mais fundo)"
        : "intermediário (balance teoria e prática)";

    const prompt = `Você é um professor experiente e didático explicando um conceito.

CONCEITO A EXPLICAR: ${conceito}
${disciplinaNome ? `DISCIPLINA: ${disciplinaNome}` : ""}
NÍVEL DO ALUNO: ${nivelTexto}

Sua explicação deve ser RICA em exemplos práticos e seguir esta estrutura:

## 📚 O que é ${conceito}?
[Definição clara e acessível]

## 🎯 Para que serve?
[Aplicações práticas e por que isso é importante]

## 💡 Exemplos Práticos

### Exemplo 1: [Título do exemplo]
[Exemplo detalhado do mundo real]

### Exemplo 2: [Título do exemplo]
[Outro exemplo prático, diferente do primeiro]

### Exemplo 3: [Título do exemplo]
[Terceiro exemplo, preferencialmente de uma área diferente]

## 🔗 Conectando com outros conceitos
[Como isso se relaciona com outras ideias que o aluno pode conhecer]

## ⚠️ Erros comuns a evitar
[O que as pessoas costumam confundir ou errar]

## 🎓 Resumo
[Pontos-chave para lembrar]

## 🧪 Teste seu entendimento
[Uma pergunta simples para o aluno refletir]

REGRAS:
- Use linguagem clara e acessível
- Inclua pelo menos 3 exemplos práticos variados
- Use analogias quando possível
- Seja didático e encorajador
- Use emojis para organizar as seções`;

    let model;
    let result;

    try {
      model = getAIModel();
      result = await streamText({
        model,
        prompt,
      });
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

          let modeloFuncionou = false;
          let ultimoErro: any = null;

          for (const nomeModelo of modelosParaTentar) {
            try {
              const modelo = genAI.getGenerativeModel({ model: nomeModelo });
              const resultadoStream = await modelo.generateContentStream(
                prompt
              );

              const encoder = new TextEncoder();
              const stream = new ReadableStream({
                async start(controller) {
                  try {
                    for await (const chunk of resultadoStream.stream) {
                      const texto = chunk.text();
                      if (texto) {
                        controller.enqueue(encoder.encode(texto));
                      }
                    }
                    controller.close();
                  } catch (error) {
                    controller.error(error);
                  }
                },
              });

              console.log(`✅ Modelo ${nomeModelo} funcionou!`);
              modeloFuncionou = true;

              return new Response(stream, {
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "Cache-Control": "no-cache",
                  Connection: "keep-alive",
                },
              });
            } catch (erroModelo: any) {
              console.log(
                `❌ Modelo ${nomeModelo} falhou:`,
                erroModelo.message
              );
              ultimoErro = erroModelo;
              continue;
            }
          }

          if (!modeloFuncionou) {
            return NextResponse.json(
              {
                error: `Nenhum modelo disponível. Tentei: ${modelosParaTentar.join(
                  ", "
                )}. Último erro: ${ultimoErro?.message || "Desconhecido"}`,
              },
              { status: 500 }
            );
          }
        } catch (fallbackError: any) {
          return NextResponse.json(
            {
              error: `Erro ao usar API direta do Google: ${fallbackError.message}. Verifique sua API key e modelos disponíveis no Google AI Studio.`,
            },
            { status: 500 }
          );
        }
      } else {
        throw modelError;
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Erro ao gerar resposta da IA" },
        { status: 500 }
      );
    }

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Erro ao explicar conceito:", error);
    const { status, message } = getAiHttpError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
