/** Contrato alinhado à API `/api/ai/mapa-mental` e persistência na biblioteca. */

export type MindMapSubRamo = {
  id: string;
  texto: string;
  detalhes?: string;
};

export type MindMapRamo = {
  id: string;
  texto: string;
  cor: string;
  /** Notas livres do tópico (edição manual; opcional na API). */
  notas?: string;
  subramos?: MindMapSubRamo[];
};

export type MapaMentalData = {
  titulo: string;
  descricao: string;
  nocentral: { texto: string; cor: string };
  ramos: MindMapRamo[];
  resumo: string;
};

export type MindMapPhase =
  | "input"
  | "loading"
  | "result"
  | "error";

export type MindMapLoadingStep =
  | "analisando"
  | "estruturando"
  | "relacoes";

export type SavedMindMapListItem = {
  id: string;
  titulo: string;
  descricao?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  arquivo_url?: string;
};

/** Ações de IA suportadas pelo refinamento (extensível). */
export type MindMapRefineAction =
  | "expandir_topico"
  | "resumir_topico"
  | "exemplos_topico"
  | "checklist_estudo"
  | "expandir_mapa"
  | "simplificar_mapa"
  | "detalhar_mapa"
  | "resumo_final"
  | "revisao_topicos"
  | "reorganizar_pontos"
  | "reorganizar_mapa";
