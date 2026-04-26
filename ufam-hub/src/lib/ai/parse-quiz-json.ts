/**
 * Extrai e faz parse do objeto quiz devolvido por modelos de IA (texto + markdown + ruído).
 */

export type QuizOpcoes = { a: string; b: string; c: string; d: string };

export type QuizPergunta = {
  numero: number;
  pergunta: string;
  opcoes: QuizOpcoes;
  resposta_correta: string;
  explicacao: string;
};

export type QuizPayload = {
  titulo: string;
  perguntas: QuizPergunta[];
};

function stripTrailingCommas(json: string): string {
  return json.replace(/,(\s*[}\]])/g, "$1");
}

/** Primeiro objeto `{...}` balanceado na string (ignora `{`/`}` dentro de strings JSON). */
function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function normalizeQuizShape(parsed: unknown): QuizPayload | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  let inner: Record<string, unknown> | null = null;
  if ("quiz" in o && o.quiz && typeof o.quiz === "object") {
    inner = o.quiz as Record<string, unknown>;
  } else if (Array.isArray(o.perguntas)) {
    inner = o;
  }

  if (!inner || !Array.isArray(inner.perguntas)) return null;

  const titulo =
    typeof inner.titulo === "string" ? inner.titulo : "Quiz gerado";
  const perguntasRaw = inner.perguntas as unknown[];

  const perguntas: QuizPergunta[] = [];
  for (let i = 0; i < perguntasRaw.length; i++) {
    const p = perguntasRaw[i];
    if (!p || typeof p !== "object") continue;
    const pr = p as Record<string, unknown>;
    const op = pr.opcoes as Record<string, unknown> | undefined;
    if (!op || typeof op !== "object") continue;

    const opcoes: QuizOpcoes = {
      a: String(op.a ?? ""),
      b: String(op.b ?? ""),
      c: String(op.c ?? ""),
      d: String(op.d ?? ""),
    };

    let resposta = String(pr.resposta_correta ?? "a").toLowerCase().trim();
    if (/^[1-4]$/.test(resposta)) {
      resposta = (["a", "b", "c", "d"] as const)[Number(resposta) - 1];
    }
    if (!["a", "b", "c", "d"].includes(resposta)) resposta = "a";

    perguntas.push({
      numero: typeof pr.numero === "number" ? pr.numero : i + 1,
      pergunta: String(pr.pergunta ?? ""),
      opcoes,
      resposta_correta: resposta,
      explicacao: String(pr.explicacao ?? ""),
    });
  }

  if (perguntas.length === 0) return null;

  return { titulo, perguntas };
}

/**
 * Tenta obter `{ quiz: { titulo, perguntas } }` a partir do texto bruto do modelo.
 */
export function parseQuizFromModelText(raw: string): {
  quiz: QuizPayload;
} | null {
  if (!raw || typeof raw !== "string") return null;

  let s = raw.trim();

  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    s = fenced[1].trim();
  } else {
    s = s.replace(/^```json\s*/i, "").replace(/```\s*$/m, "").trim();
  }

  const candidates: string[] = [];
  const extracted = extractFirstJsonObject(s);
  if (extracted) candidates.push(extracted);
  if (!extracted || extracted !== s.trim()) {
    candidates.push(s.trim());
  }

  for (const cand of candidates) {
    let jsonStr = stripTrailingCommas(cand);
    try {
      const parsed = JSON.parse(jsonStr);
      const normalized = normalizeQuizShape(parsed);
      if (normalized) {
        return { quiz: normalized };
      }
      // Às vezes o modelo devolve só o array em "perguntas" no root
      const parsed2 = parsed as Record<string, unknown>;
      if (Array.isArray(parsed2.perguntas)) {
        const n = normalizeQuizShape({ quiz: parsed2 });
        if (n) return { quiz: n };
      }
    } catch {
      // tenta remover texto antes do primeiro {
      const inner = extractFirstJsonObject(s);
      if (inner && inner !== jsonStr) {
        try {
          const parsed = JSON.parse(stripTrailingCommas(inner));
          const normalized = normalizeQuizShape(parsed);
          if (normalized) return { quiz: normalized };
        } catch {
          /* continua */
        }
      }
    }
  }

  return null;
}
