import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    console.log("🍪 Cookies recebidos:", cookieHeader ? "presente" : "ausente");
    if (cookieHeader) {
      console.log(
        "🍪 Primeiros 100 chars dos cookies:",
        cookieHeader.substring(0, 100)
      );
    }
    const { disciplinaId, question } = await req.json();
    if (!question || !question.trim()) {
      return new Response(JSON.stringify({ error: "Pergunta é obrigatória" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (disciplinaId && typeof disciplinaId !== "string") {
      return new Response(
        JSON.stringify({ error: "disciplinaId deve ser uma string (UUID)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    let model;
    try {
      model = getAIModel();
      console.log("✅ Modelo Gemini configurado");
    } catch (error) {
      console.error("❌ Erro ao configurar modelo Gemini:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Configuração da API Gemini não encontrada",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("🔐 Verificando autenticação...");
    console.log("User:", user ? `✅ ${user.email} (${user.id})` : "❌ null");
    console.log(
      "AuthError:",
      authError ? `❌ ${authError.message}` : "✅ null"
    );
    if (authError || !user) {
      console.error("❌ Erro de autenticação:", authError);
      console.error("❌ Detalhes:", {
        authError: authError?.message,
        hasUser: !!user,
        cookies: req.headers.get("cookie") ? "presente" : "ausente",
      });
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("✅ Usuário autenticado:", user.email);
    let context = "";
    let useRPC = process.env.USE_SQL_RPC !== "false";
    if (useRPC && disciplinaId) {
      try {
        console.log("🔍 Tentando obter contexto via função SQL RPC...");
        const { data: contextoSQL, error: rpcError } = await supabase.rpc(
          "get_contexto_ia",
          {
            p_user_id: user.id,
            p_disciplina_id: disciplinaId,
          }
        );
        if (rpcError) {
          console.error("❌ Erro ao chamar função RPC:", rpcError);
          console.error("❌ Detalhes do erro:", {
            message: rpcError.message,
            code: rpcError.code,
            details: rpcError.details,
            hint: rpcError.hint,
          });
          console.log("⚠️ Fallback para método de queries diretas");
          useRPC = false;
        } else {
          context = contextoSQL || "";
          if (context && context.trim().length > 0) {
            console.log("✅ Contexto obtido via função SQL RPC");
            console.log(
              "📝 Tamanho do contexto:",
              context.length,
              "caracteres"
            );
          } else {
            console.log(
              "⚠️ Função RPC retornou contexto vazio ou null, usando fallback"
            );
            console.log("📝 Tipo do retorno:", typeof contextoSQL);
            console.log("📝 Valor do retorno:", contextoSQL);
            useRPC = false;
            context = "";
          }
        }
      } catch (rpcErr) {
        console.error("❌ Erro ao executar RPC:", rpcErr);
        if (rpcErr instanceof Error) {
          console.error("❌ Stack trace:", rpcErr.stack);
        }
        useRPC = false;
      }
    } else if (!disciplinaId) {
      console.log(
        "ℹ️ disciplinaId não fornecido, usando método de queries diretas"
      );
      useRPC = false;
    }
    if (!useRPC || !context) {
      if (!disciplinaId) {
        context = "[sem contexto específico de disciplina]";
        console.log("ℹ️ Sem disciplinaId, usando contexto genérico");
      } else {
        const { data: notas, error: notasError } = await supabase
          .from("notas")
          .select("content_md")
          .eq("user_id", user.id)
          .eq("disciplina_id", disciplinaId)
          .order("updated_at", { ascending: false })
          .limit(10);
        if (notasError) {
          console.error("❌ Erro ao buscar notas:", notasError);
        }
        const { data: avaliacoes } = await supabase
          .from("avaliacoes")
          .select(
            `
          tipo,
          data_iso,
          descricao,
          resumo_assuntos,
          disciplina_id,
          disciplinas (
            nome
          )
        `
          )
          .eq("user_id", user.id)
          .eq("disciplina_id", disciplinaId)
          .gte("data_iso", new Date().toISOString())
          .order("data_iso", { ascending: true })
          .limit(5);

        // Buscar materiais da biblioteca do usuário
        const { data: materiais } = await supabase
          .from("biblioteca_materiais")
          .select("titulo, descricao, tipo, categoria, tags")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        const { data: disciplina } = await supabase
          .from("disciplinas")
          .select("nome, tipo, horas_semana, professor, local")
          .eq("id", disciplinaId)
          .eq("user_id", user.id)
          .single();
        const contextParts: string[] = [];
        if (notas && notas.length > 0) {
          const notasText = notas
            .map((n) => n.content_md)
            .filter(Boolean)
            .join("\n---\n");
          contextParts.push(`ANOTAÇÕES DA DISCIPLINA:\n${notasText}`);
        }
        if (disciplina) {
          contextParts.push(
            `INFORMAÇÕES DA DISCIPLINA:\nNome: ${disciplina.nome}\nTipo: ${
              disciplina.tipo
            }\nCarga horária: ${disciplina.horas_semana}h/semana${
              disciplina.professor ? `\nProfessor: ${disciplina.professor}` : ""
            }${disciplina.local ? `\nLocal: ${disciplina.local}` : ""}`
          );
        }
        if (avaliacoes && avaliacoes.length > 0) {
          const avaliacoesText = avaliacoes
            .map((a) => {
              const data = new Date(a.data_iso);
              const dias = Math.ceil(
                (data.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              let disciplinaNome = disciplina?.nome || "disciplina";
              if (Array.isArray(a.disciplinas) && a.disciplinas.length > 0) {
                disciplinaNome = (
                  a.disciplinas[0] as unknown as { nome: string }
                ).nome;
              } else if (
                a.disciplinas &&
                typeof a.disciplinas === "object" &&
                !Array.isArray(a.disciplinas)
              ) {
                disciplinaNome = (a.disciplinas as unknown as { nome: string })
                  .nome;
              }
              return `- ${a.tipo} em ${data.toLocaleDateString("pt-BR")} (${
                dias > 0 ? `em ${dias} dias` : dias === 0 ? "hoje" : "passou"
              })${a.descricao ? ` - ${a.descricao}` : ""}${
                a.resumo_assuntos
                  ? `\n  Resumo: ${a.resumo_assuntos.substring(0, 200)}...`
                  : ""
              }`;
            })
            .join("\n");
          contextParts.push(`AVALIAÇÕES PRÓXIMAS:\n${avaliacoesText}`);
        }

        // Adicionar materiais da biblioteca ao contexto
        if (materiais && materiais.length > 0) {
          const materiaisText = materiais
            .map((m: any) => {
              const tagsStr =
                m.tags?.length > 0 ? ` [${m.tags.join(", ")}]` : "";
              return `- ${m.titulo} (${m.tipo}${
                m.categoria ? `, ${m.categoria}` : ""
              })${tagsStr}${
                m.descricao ? `\n  ${m.descricao.substring(0, 100)}...` : ""
              }`;
            })
            .join("\n");
          contextParts.push(`MATERIAIS NA BIBLIOTECA:\n${materiaisText}`);
        }

        context = contextParts.join("\n\n").slice(0, 12000);
        console.log("✅ Contexto montado via queries diretas");
        console.log("📝 Tamanho do contexto:", context.length, "caracteres");
      }
    }
    if (!context || context.trim().length === 0) {
      context = "[sem contexto específico disponível]";
      console.log("ℹ️ Usando contexto genérico (sem dados específicos)");
    }
    console.log("✅ Iniciando streamText com Gemini...");
    console.log("📝 Contexto final:", context.substring(0, 200) + "...");
    console.log("📝 Tamanho do contexto final:", context.length, "caracteres");
    const perguntaFinal = String(question || "").trim();
    if (!perguntaFinal) {
      return new Response(
        JSON.stringify({ error: "Pergunta não pode estar vazia" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    console.log("🤖 Chamando Gemini com:", {
      pergunta: perguntaFinal.substring(0, 100),
      contextoLength: context.length,
      hasContext: context.length > 0,
    });
    let result;
    try {
      result = await streamText({
        model: model,
        system: `Você é um tutor acadêmico especializado em ajudar estudantes universitários.
${
  context && context.trim().length > 0 && !context.includes("[sem contexto")
    ? `CONTEXTO DISPONÍVEL:\n${context}\n\nUse este contexto para responder quando relevante.`
    : "Você não tem contexto específico disponível, mas pode ajudar com informações gerais."
}
INSTRUÇÕES:
- Responda de forma clara e didática
- Use exemplos quando apropriado
- Se não souber algo, seja honesto e sugira onde o estudante pode encontrar a informação
- Mantenha um tom acolhedor e encorajador
- SEMPRE forneça uma resposta útil, mesmo sem contexto específico`,
        prompt: perguntaFinal,
        temperature: 0.7,
      });
      console.log("✅ streamText executado com sucesso");
    } catch (streamTextError) {
      console.error("❌ Erro ao executar streamText:", streamTextError);
      if (streamTextError instanceof Error) {
        console.error("❌ Mensagem:", streamTextError.message);
        console.error("❌ Stack:", streamTextError.stack);
      }
      throw streamTextError;
    }
    console.log("✅ StreamText criado com sucesso - usando API de IA");
    console.log("📝 Pergunta:", question.substring(0, 100));
    console.log(
      "📚 Contexto (primeiros 200 chars):",
      context.substring(0, 200)
    );
    try {
      console.log("🔄 Criando stream response...");
      console.log(
        "📊 Métodos disponíveis no result:",
        Object.keys(result || {})
      );
      if (!result || typeof result.toTextStreamResponse !== "function") {
        console.error("❌ result não tem método toTextStreamResponse");
        console.error("❌ Tipo de result:", typeof result);
        console.error("❌ Result keys:", result ? Object.keys(result) : "null");
        throw new Error(
          "Erro ao criar stream: método toTextStreamResponse não encontrado"
        );
      }
      console.log("📡 Chamando toTextStreamResponse()...");
      const response = result.toTextStreamResponse();
      if (!response) {
        console.error("❌ Stream response retornou null/undefined");
        throw new Error("Erro ao criar stream: resposta vazia");
      }
      console.log("✅ Response criado");
      console.log("📊 Response status:", response.status);
      console.log("📊 Response ok:", response.ok);
      console.log("📊 Response body:", response.body ? "presente" : "ausente");
      if (!response.body) {
        console.error("❌ Response não tem body!");
        throw new Error(
          "Stream não contém dados - verifique a configuração da API Gemini"
        );
      }
      console.log(
        "📊 Response headers:",
        Object.fromEntries(response.headers.entries())
      );
      response.headers.set("Content-Type", "text/plain; charset=utf-8");
      response.headers.set("Cache-Control", "no-cache");
      response.headers.set("Connection", "keep-alive");
      response.headers.set("X-Accel-Buffering", "no");
      console.log("✅ Retornando stream response...");
      return response;
    } catch (streamError) {
      console.error("❌ Erro ao criar stream response:", streamError);
      if (streamError instanceof Error) {
        console.error("❌ Erro message:", streamError.message);
        console.error("❌ Erro stack:", streamError.stack);
      }
      throw streamError;
    }
  } catch (error) {
    console.error("❌ Erro na API de IA:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno do servidor";
    const errorStack = error instanceof Error ? error.stack : undefined;
    let userMessage = "Erro ao processar solicitação";
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
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch")
    ) {
      userMessage = "Erro de conexão. Verifique sua internet.";
    }
    return new Response(
      JSON.stringify({
        error: userMessage,
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
