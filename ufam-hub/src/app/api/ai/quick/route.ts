import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    console.log(
      "🍪 [Quick] Cookies recebidos:",
      cookieHeader ? "presente" : "ausente"
    );
    if (cookieHeader) {
      console.log(
        "🍪 [Quick] Primeiros 100 chars dos cookies:",
        cookieHeader.substring(0, 100)
      );
    }
    const { question } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Pergunta é obrigatória" },
        { status: 400 }
      );
    }
    let model;
    try {
      model = getAIModel();
      console.log("✅ [Quick] Modelo Gemini configurado");
    } catch (error) {
      console.error("❌ [Quick] Erro ao configurar modelo Gemini:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "API Gemini não configurada",
        },
        { status: 500 }
      );
    }
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("🔐 [Quick] Verificando autenticação...");
    console.log("User:", user ? `✅ ${user.email} (${user.id})` : "❌ null");
    console.log(
      "AuthError:",
      authError ? `❌ ${authError.message}` : "✅ null"
    );
    if (authError || !user) {
      console.error("❌ [Quick] Erro de autenticação:", authError);
      console.error("❌ [Quick] Detalhes:", {
        authError: authError?.message,
        hasUser: !!user,
        cookies: req.headers.get("cookie") ? "presente" : "ausente",
      });
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.log("✅ [Quick] Usuário autenticado:", user.email);
    const contextData: string[] = [];
    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select(
        `
        tipo,
        data_iso,
        descricao,
        disciplina_id,
        disciplinas (
          nome
        )
      `
      )
      .eq("user_id", user.id)
      .gte("data_iso", new Date().toISOString())
      .order("data_iso", { ascending: true })
      .limit(10);
    if (avaliacoes && avaliacoes.length > 0) {
      const avaliacoesText = avaliacoes
        .map((a) => {
          const data = new Date(a.data_iso);
          const dias = Math.ceil(
            (data.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          let disciplinaNome = "disciplina";
          if (Array.isArray(a.disciplinas) && a.disciplinas.length > 0) {
            disciplinaNome = (a.disciplinas[0] as unknown as { nome: string })
              .nome;
          } else if (
            a.disciplinas &&
            typeof a.disciplinas === "object" &&
            !Array.isArray(a.disciplinas)
          ) {
            disciplinaNome = (a.disciplinas as unknown as { nome: string })
              .nome;
          }
          return `- ${a.tipo} de ${disciplinaNome}: ${data.toLocaleDateString(
            "pt-BR"
          )} (${
            dias > 0 ? `em ${dias} dias` : dias === 0 ? "hoje" : "passou"
          })${a.descricao ? ` - ${a.descricao}` : ""}`;
        })
        .join("\n");
      contextData.push(`AVALIAÇÕES PRÓXIMAS:\n${avaliacoesText}`);
    }
    const { data: disciplinas } = await supabase
      .from("disciplinas")
      .select("nome, tipo")
      .eq("user_id", user.id)
      .order("nome", { ascending: true })
      .limit(20);
    if (disciplinas && disciplinas.length > 0) {
      const disciplinasList = disciplinas
        .map((d) => `${d.nome} (${d.tipo})`)
        .join(", ");
      contextData.push(`DISCIPLINAS DO USUÁRIO: ${disciplinasList}`);
    }
    const context = contextData.join("\n\n");
    const perguntaFinal = String(question || "").trim();

    const promptCompleto = `Você é um assistente virtual acadêmico do UFAM Hub. Responda de forma CONCISA e DIRETA (máximo 2-3 frases).

CONTEXTO DISPONÍVEL:
${context || "Nenhum contexto disponível"}

INSTRUÇÕES:
- Para perguntas sobre avaliações, você pode mencionar que o usuário pode verificar na página de Avaliações
- Seja breve e objetivo
- Use emojis quando apropriado para tornar a resposta mais amigável
- Se não souber algo específico, sugira onde o usuário pode encontrar a informação
- Use APENAS o contexto fornecido

PERGUNTA DO USUÁRIO:
${perguntaFinal}`;

    console.log("✅ [Quick] Iniciando quick question com Gemini");

    console.log("Tentando usar @google/generative-ai diretamente...");
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
            "✅ [Quick] Modelos disponíveis encontrados:",
            modelosDisponiveis
          );
        }
      } catch (listError) {
        console.log(
          "⚠️ [Quick] Não foi possível listar modelos, usando lista padrão"
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
            promptCompleto
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

          console.log(`✅ [Quick] Modelo ${nomeModelo} funcionou!`);
          modeloFuncionou = true;

          return new Response(stream, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (erroModelo: any) {
          console.log(
            `❌ [Quick] Modelo ${nomeModelo} falhou:`,
            erroModelo.message
          );
          ultimoErro = erroModelo;
          continue;
        }
      }

      if (!modeloFuncionou) {
        throw new Error(
          `Nenhum modelo disponível. Tentei: ${modelosParaTentar.join(
            ", "
          )}. Último erro: ${ultimoErro?.message || "Desconhecido"}`
        );
      }
    } catch (fallbackError: any) {
      console.error("❌ [Quick] Erro no fallback direto:", fallbackError);
      console.log(
        "⚠️ [Quick] Tentando usar @ai-sdk/google como último recurso..."
      );

      try {
        const result = await streamText({
          model: model,
          system: `Você é um assistente virtual acadêmico do UFAM Hub. Responda de forma CONCISA e DIRETA (máximo 2-3 frases).
CONTEXTO DISPONÍVEL:
${context || "Nenhum contexto disponível"}
INSTRUÇÕES:
- Para perguntas sobre avaliações, você pode mencionar que o usuário pode verificar na página de Avaliações
- Seja breve e objetivo
- Use emojis quando apropriado para tornar a resposta mais amigável
- Se não souber algo específico, sugira onde o usuário pode encontrar a informação
- Use APENAS o contexto fornecido`,
          prompt: perguntaFinal,
          temperature: 0.7,
        });

        if (result && typeof result.toTextStreamResponse === "function") {
          const response = result.toTextStreamResponse();
          response.headers.set("Content-Type", "text/plain; charset=utf-8");
          response.headers.set("Cache-Control", "no-cache");
          response.headers.set("Connection", "keep-alive");
          response.headers.set("X-Accel-Buffering", "no");
          return response;
        }
      } catch (streamTextError: any) {
        console.error(
          "❌ [Quick] Erro ao usar @ai-sdk/google:",
          streamTextError
        );
      }

      throw new Error(
        `Erro ao usar API direta do Google: ${fallbackError.message}. Verifique sua API key e modelos disponíveis no Google AI Studio.`
      );
    }
  } catch (error) {
    console.error("❌ Erro na API de IA rápida:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    let userMessage = "Erro ao processar pergunta";
    if (
      errorMessage.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
      errorMessage.includes("API key") ||
      errorMessage.includes("não configurada")
    ) {
      userMessage =
        "API do Gemini não configurada. Verifique as configurações.";
    } else if (
      errorMessage.includes("401") ||
      errorMessage.includes("Não autorizado")
    ) {
      userMessage = "Não autorizado. Faça login novamente.";
    } else if (
      errorMessage.includes("quota") ||
      errorMessage.includes("limit")
    ) {
      userMessage =
        "Limite de uso da API Gemini atingido. Verifique sua conta.";
    }
    return NextResponse.json(
      {
        error: userMessage,
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
