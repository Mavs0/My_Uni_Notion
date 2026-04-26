export type FeedPostCategory =
  | "conquista"
  | "dica"
  | "reflexao"
  | "pergunta";

export const POST_CATEGORY_META: Record<
  FeedPostCategory,
  { label: string; icon: "trophy" | "book" | "lightbulb" | "help" }
> = {
  conquista: { label: "Conquista", icon: "trophy" },
  dica: { label: "Dica", icon: "book" },
  reflexao: { label: "Reflexão", icon: "lightbulb" },
  pergunta: { label: "Pergunta", icon: "help" },
};

/** Divide o texto do composer em titulo (API) e descrição, respeitando limites. */
export function splitComposerToTituloDescricao(raw: string): {
  titulo: string;
  descricao: string | null;
} {
  const text = raw.trim();
  if (!text) return { titulo: "", descricao: null };
  const i = text.indexOf("\n");
  let first = i === -1 ? text : text.slice(0, i);
  let rest = i === -1 ? "" : text.slice(i + 1).trim();
  if (first.length > 200) {
    rest = (first.slice(200) + (rest ? `\n${rest}` : "")).trim();
    first = first.slice(0, 200);
  }
  const descricao = rest ? rest.slice(0, 1000) : null;
  return { titulo: first.trim(), descricao };
}
