import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAIModel } from "@/lib/ai/config";
import {
  getAiHttpError,
  shouldTryGeminiModelFallback,
} from "@/lib/ai/errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MindMapRefineAction } from "@/types/mind-map";

type Body = {
  action: MindMapRefineAction | string;
  disciplinaNome?: string;
  /** Contexto do tópico (título + subitens em texto) */
  contextoTopico?: string;
  /** JSON stringificado do mapa ou resumo para ações globais */
  contextoMapa?: string;
  resumoAtual?: string;
};

function buildPrompt(
  action: string,
  b: Body
): string {
  const disc = b.disciplinaNome ? `Disciplina: ${b.disciplinaNome}\n` : "";
  const base = `${disc}`;

  switch (action) {
    case "expandir_topico":
      return `${base}Expanda de forma didática o seguinte tópico de estudo (português, markdown simples com subtítulos curtos):\n\n${b.contextoTopico || ""}`;
    case "resumir_topico":
      return `${base}Resuma em 3 a 5 frases objetivas:\n\n${b.contextoTopico || ""}`;
    case "exemplos_topico":
      return `${base}Liste 3 exemplos práticos ou numéricos relacionados a:\n\n${b.contextoTopico || ""}`;
    case "checklist_estudo":
      return `${base}Transforme o conteúdo abaixo numa checklist de estudo (marcadores - ), máximo 12 itens:\n\n${b.contextoTopico || ""}`;
    case "expandir_mapa":
      return `${base}Com base neste mapa mental (texto/resumo), sugira 2 a 4 ideias adicionais de ramos ou ligações que faltem. Resposta em parágrafos curtos.\n\n${b.contextoMapa || ""}`;
    case "simplificar_mapa":
      return `${base}Simplifique e descomprima o conteúdo abaixo para estudo rápido (bullet points, sem perder conceitos-chave):\n\n${b.contextoMapa || ""}`;
    case "detalhar_mapa":
      return `${base}Detalhe mais profundamente os conceitos deste mapa (parágrafos curtos, português):\n\n${b.contextoMapa || ""}`;
    case "resumo_final":
      return `${base}Gere um resumo final académico (1 parágrafo introdutório + bullet points) a partir de:\n\n${b.contextoMapa || ""}`;
    case "revisao_topicos":
      return `${base}Liste tópicos essenciais para revisão antes de prova (numerados), com base em:\n\n${b.contextoMapa || ""}`;
    case "reorganizar_pontos":
      return `${base}Reorganize mentalmente os pontos abaixo numa ordem de estudo mais lógica (lista numerada):\n\n${b.contextoTopico || b.contextoMapa || ""}`;
    case "reorganizar_mapa":
      return `${base}Proponha uma reorganização mais clara da estrutura deste mapa mental (quais ramos fundir, dividir ou reordenar). Resposta em secções curtas com listas.\n\n${b.contextoMapa || ""}`;
    default:
      return `${base}Responda de forma útil e breve em português:\n\n${b.contextoTopico || b.contextoMapa || ""}`;
  }
}

async function runGeminiDirect(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada");
  const genAI = new GoogleGenerativeAI(apiKey);
  const fallbacks = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
  ];
  let last: Error | null = null;
  for (const name of fallbacks) {
    try {
      const m = genAI.getGenerativeModel({ model: name });
      const r = await m.generateContent(prompt);
      return r.response.text();
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw last || new Error("Falha ao gerar texto");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const action = String(body.action || "expandir_topico") as MindMapRefineAction;
    const prompt = buildPrompt(action, body);

    let texto = "";
    try {
      const model = getAIModel();
      const result = await generateText({ model, prompt });
      texto = result.text;
    } catch (e: unknown) {
      if (shouldTryGeminiModelFallback(e)) {
        texto = await runGeminiDirect(prompt);
      } else {
        throw e;
      }
    }

    return NextResponse.json({ texto: texto.trim() });
  } catch (error: unknown) {
    const { status, message } = getAiHttpError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
