import type { MapaMentalData } from "@/types/mind-map";
import type { MindMapRefineAction } from "@/types/mind-map";
import { ensureMapShape } from "./map-helpers";

export async function generateMindMap(body: {
  texto: string;
  titulo?: string;
  disciplinaId?: string;
}): Promise<MapaMentalData> {
  const res = await fetch("/api/ai/mapa-mental", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Falha ao gerar mapa mental."
    );
  }
  if (!json?.mapaMental) {
    const err =
      typeof json?.error === "string"
        ? json.error
        : "Não foi possível gerar o mapa mental.";
    throw new Error(err);
  }
  return ensureMapShape(json.mapaMental as MapaMentalData);
}

export async function extractPdfText(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/ai/pdf-extract", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Não foi possível extrair o PDF."
    );
  }
  return String(json.texto ?? "");
}

export async function refineMindMapText(body: {
  action: MindMapRefineAction;
  disciplinaNome?: string;
  contextoTopico?: string;
  contextoMapa?: string;
  resumoAtual?: string;
}): Promise<string> {
  const res = await fetch("/api/ai/mapa-mental/refinar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Falha no refinamento com IA."
    );
  }
  return String(json.texto ?? "");
}

export type BibliotecaItem = {
  id: string;
  titulo: string;
  descricao?: string;
  tags?: string[];
  tipo?: string;
  arquivo_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function listSavedMindMaps(): Promise<BibliotecaItem[]> {
  const res = await fetch(
    "/api/colaboracao/biblioteca?tipo=mapa_mental&limit=50",
    { credentials: "include" }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Não foi possível listar mapas."
    );
  }
  return (json.materiais || []) as BibliotecaItem[];
}

export async function saveMindMapToBiblioteca(body: {
  titulo: string;
  descricao?: string;
  tags?: string[];
  conteudo: MapaMentalData;
}): Promise<{ id: string }> {
  const res = await fetch("/api/colaboracao/biblioteca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      titulo: body.titulo,
      descricao: body.descricao ?? body.conteudo.descricao ?? body.conteudo.resumo,
      tipo: "mapa_mental",
      categoria: "estudo",
      tags: body.tags?.length ? body.tags : ["mapa-mental", "ia"],
      visibilidade: "privado",
      arquivo_url: JSON.stringify(body.conteudo),
      arquivo_tipo: "application/json",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Falha ao salvar mapa."
    );
  }
  const id = json.material?.id;
  if (!id) {
    throw new Error("Resposta inválida ao salvar.");
  }
  return { id: String(id) };
}

export async function updateMindMapBiblioteca(
  id: string,
  body: {
    titulo?: string;
    descricao?: string;
    tags?: string[];
    conteudo?: MapaMentalData;
  }
): Promise<void> {
  const res = await fetch(`/api/colaboracao/biblioteca/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      titulo: body.titulo,
      descricao: body.descricao,
      tags: body.tags,
      arquivo_url: body.conteudo ? JSON.stringify(body.conteudo) : undefined,
      arquivo_tipo: body.conteudo ? "application/json" : undefined,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : "Falha ao atualizar mapa."
    );
  }
}

export async function deactivateBibliotecaItem(id: string): Promise<void> {
  const res = await fetch(`/api/colaboracao/biblioteca/${id}/toggle-ativo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ativo: false }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(
      typeof json?.error === "string" ? json.error : "Não foi possível excluir."
    );
  }
}
