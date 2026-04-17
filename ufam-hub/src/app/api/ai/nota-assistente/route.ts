import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAIModel } from "@/lib/ai/config";
import {
  GEMINI_MODEL_FALLBACK_CHAIN,
  listGeminiContentModelIds,
  mergeUniqueModelOrder,
} from "@/lib/ai/gemini-models";

const MAX_NOTE_CHARS = 28_000;
const MAX_QUESTION = 4_000;
const MAX_HISTORY_TURNS = 8;
const MAX_MSG = 2_500;

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      disciplinaId,
      notaId,
      question,
      history = [],
      draftTitulo,
      draftContent,
    } = body as {
      disciplinaId?: string;
      notaId?: string | null;
      question?: string;
      history?: HistoryItem[];
      draftTitulo?: string;
      draftContent?: string;
    };

    const q = String(question || "").trim();
    if (!q) {
      return new Response(JSON.stringify({ error: "Digite uma pergunta." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (q.length > MAX_QUESTION) {
      return new Response(JSON.stringify({ error: "Pergunta muito longa." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!disciplinaId || typeof disciplinaId !== "string") {
      return new Response(
        JSON.stringify({ error: "disciplinaId é obrigatório." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: disciplinaRow } = await supabase
      .from("disciplinas")
      .select("nome")
      .eq("id", disciplinaId)
      .eq("user_id", user.id)
      .single();

    const disciplinaNome = disciplinaRow?.nome || "Disciplina";

    let titulo = "Sem título";
    let contentMd = "";

    const isNova =
      !notaId ||
      notaId === "nova" ||
      notaId.trim() === "";

    if (!isNova) {
      const { data: notaRow, error: notaErr } = await supabase
        .from("notas")
        .select("titulo, content_md, disciplina_id")
        .eq("id", notaId)
        .eq("user_id", user.id)
        .single();

      if (notaErr || !notaRow) {
        return new Response(JSON.stringify({ error: "Nota não encontrada." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (notaRow.disciplina_id !== disciplinaId) {
        return new Response(JSON.stringify({ error: "Acesso negado." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      titulo = (notaRow.titulo || "Sem título").trim();
      contentMd = notaRow.content_md ?? "";
    } else {
      titulo = String(draftTitulo || "Sem título").trim() || "Sem título";
      contentMd = String(draftContent ?? "");
    }

    const notaTexto = contentMd.slice(0, MAX_NOTE_CHARS);
    const historico: HistoryItem[] = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .slice(-MAX_HISTORY_TURNS)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, MAX_MSG),
          }))
      : [];

    let historicoTexto = "";
    if (historico.length > 0) {
      historicoTexto = historico
        .map((m) => {
          const label = m.role === "user" ? "Estudante" : "Assistente";
          return `${label}: ${m.content}`;
        })
        .join("\n\n");
    }

    const promptCompleto = `Você é o assistente de estudos do UFAM Hub. O estudante está com uma anotação em Markdown aberta no editor.

DISCIPLINA: ${disciplinaNome}
TÍTULO DA ANOTAÇÃO: ${titulo}

TEXTO DA ANOTAÇÃO (Markdown — pode estar incompleto se ainda não salvou):
---
${notaTexto || "(nenhum texto ainda na nota)"}
---
${
  historicoTexto
    ? `\nCONVERSA ANTERIOR NESTE PAINEL:\n${historicoTexto}\n`
    : ""
}
PERGUNTA ATUAL DO ESTUDANTE:
${q}

INSTRUÇÕES:
- Responda em português do Brasil, com tom didático e direto.
- Priorize o que está escrito na anotação; cite trechos ou ideias dela quando fizer sentido.
- Se a nota estiver vazia ou a pergunta for geral, ajude mesmo assim e sugira como usar o espaço da anotação.
- Use Markdown leve quando ajudar (## títulos curtos, listas, **negrito**).
- Não invente que o texto citado existe na nota se não existir; diga quando não houver base na anotação.`;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API do Gemini não configurada no servidor.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const fromApi = await listGeminiContentModelIds(apiKey);
    const modelosParaTentar = mergeUniqueModelOrder(
      fromApi,
      GEMINI_MODEL_FALLBACK_CHAIN,
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    let ultimoErro: unknown = null;

    for (const nomeModelo of modelosParaTentar) {
      try {
        const modelo = genAI.getGenerativeModel({ model: nomeModelo });
        const resultadoStream = await modelo.generateContentStream(
          promptCompleto,
        );
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of resultadoStream.stream) {
                const texto = chunk.text();
                if (texto) controller.enqueue(encoder.encode(texto));
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      } catch (e) {
        ultimoErro = e;
        continue;
      }
    }

    try {
      const result = await streamText({
        model: getAIModel(),
        prompt: promptCompleto,
        temperature: 0.7,
      });
      const response = result.toTextStreamResponse();
      response.headers.set("Content-Type", "text/plain; charset=utf-8");
      response.headers.set("Cache-Control", "no-cache");
      response.headers.set("Connection", "keep-alive");
      response.headers.set("X-Accel-Buffering", "no");
      return response;
    } catch (sdkErr) {
      ultimoErro = sdkErr;
    }

    const msg =
      ultimoErro instanceof Error
        ? ultimoErro.message
        : "Nenhum modelo Gemini disponível.";
    console.error("nota-assistente: falha em todos os modelos", ultimoErro);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("nota-assistente:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Erro ao processar pedido.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
