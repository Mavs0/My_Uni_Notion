import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query de busca é obrigatória" },
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
    const searchTerm = `%${query.trim()}%`;
    const { data: notas, error } = await supabase
      .from("notas")
      .select(
        `
        id,
        disciplina_id,
        titulo,
        content_md,
        created_at,
        updated_at,
        disciplinas!inner(nome)
      `
      )
      .eq("user_id", user.id)
      .or(`content_md.ilike.${searchTerm},titulo.ilike.${searchTerm}`)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Erro ao buscar notas:", error);
      return NextResponse.json(
        { error: "Erro ao buscar notas" },
        { status: 500 }
      );
    }
    const notasComDisciplinas = (notas || []).map((nota) => {
      const disciplina = Array.isArray(nota.disciplinas)
        ? nota.disciplinas[0]
        : nota.disciplinas;
      return {
        id: nota.id,
        disciplinaId: nota.disciplina_id,
        disciplinaNome: (disciplina as any)?.nome || "Disciplina",
        titulo: nota.titulo || "Sem título",
        content_md: nota.content_md,
        created_at: nota.created_at,
        updated_at: nota.updated_at,
        snippet: extractSnippet(nota.content_md || "", query),
      };
    });
    return NextResponse.json({
      results: notasComDisciplinas,
      count: notasComDisciplinas.length,
    });
  } catch (error: any) {
    console.error("Erro na API de busca de notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
function extractSnippet(text: string, query: string, maxLength: number = 200) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) {
    return (
      text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
    );
  }
  let start = Math.max(0, index - 50);
  while (start > 0 && text[start] !== " " && text[start] !== "\n") {
    start--;
  }
  let end = Math.min(text.length, index + query.length + 150);
  while (end < text.length && text[end] !== " " && text[end] !== "\n") {
    end++;
  }
  let snippet = text.substring(start, end).trim();
  const regex = new RegExp(`(${query})`, "gi");
  snippet = snippet.replace(regex, "**$1**");
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}