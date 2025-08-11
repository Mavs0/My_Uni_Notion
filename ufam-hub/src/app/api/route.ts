import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  const { disciplinaId, question } = await req.json();

  // TODO: buscar notas dessa disciplina no Supabase e montar contexto.
  const context = `Disciplina: ${disciplinaId}. (Quando integrar, aqui entram suas anotações relevantes.)`;

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: `Você é um tutor acadêmico. Responda de forma objetiva.
Use APENAS o contexto fornecido quando possível e avise quando faltar informação.
Contexto:
${context}`,
    prompt: String(question || ""),
  });

  return result.toTextStreamResponse();
}
