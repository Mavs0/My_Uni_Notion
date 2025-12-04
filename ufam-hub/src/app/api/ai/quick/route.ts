import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
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
    console.log("✅ Iniciando quick question com Gemini");
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
      prompt: String(question || ""),
      temperature: 0.7,
    });
    console.log("✅ Quick question processada com sucesso - usando API de IA");
    console.log("📝 Pergunta:", question.substring(0, 100));
    console.log(
      "📚 Contexto (primeiros 200 chars):",
      context.substring(0, 200)
    );
    const response = result.toTextStreamResponse();
    response.headers.set("Content-Type", "text/plain; charset=utf-8");
    response.headers.set("Cache-Control", "no-cache");
    response.headers.set("Connection", "keep-alive");
    response.headers.set("X-Accel-Buffering", "no");
    console.log("✅ Response criado, retornando stream...");
    return response;
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