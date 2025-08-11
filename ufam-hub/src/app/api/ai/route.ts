import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { disciplinaId, question } = await req.json();
  const supabase = await createSupabaseServer(); // <-- AQUI: await

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: notas, error } = await supabase
    .from("notas")
    .select("content_md")
    .eq("user_id", user.id)
    .eq("disciplina_id", disciplinaId)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return new Response("Erro ao buscar notas", { status: 500 });
  }

  const context = (notas ?? [])
    .map((n) => n.content_md)
    .filter(Boolean)
    .join("\n---\n")
    .slice(0, 12000);

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: `Você é um tutor acadêmico. Use APENAS o contexto abaixo; se faltar algo, diga explicitamente.
CONTEXT:
${context || "[sem anotações disponíveis]"}
`,
    prompt: String(question || ""),
  });

  return result.toTextStreamResponse(); // (pode usar toTextStreamResponse se preferir)
}
