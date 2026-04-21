import type { MapaMentalData } from "@/types/mind-map";

/** Dados mock para desenvolvimento quando `NEXT_PUBLIC_MIND_MAP_MOCK=1`. */
export const MOCK_MAPA_MENTAL: MapaMentalData = {
  titulo: "Álgebra Linear — revisão (mock)",
  descricao: "Espaços vetoriais, transformações e autovalores.",
  nocentral: { texto: "Álgebra Linear", cor: "#7C3AED" },
  ramos: [
    {
      id: "r1",
      texto: "Espaços vetoriais",
      cor: "#05865E",
      subramos: [
        { id: "r1s1", texto: "Base e dimensão", detalhes: "Conjunto gerador mínimo." },
        { id: "r1s2", texto: "Subespaços" },
      ],
    },
    {
      id: "r2",
      texto: "Transformações lineares",
      cor: "#6366F1",
      subramos: [
        { id: "r2s1", texto: "Matriz associada", detalhes: "T(v) = Av em base canónica." },
      ],
    },
    {
      id: "r3",
      texto: "Autovalores",
      cor: "#F59E0B",
      subramos: [{ id: "r3s1", texto: "Polinómio característico" }],
    },
  ],
  resumo:
    "Mapa de revisão: estrutura algébrica dos espaços lineares, representação matricial das transformações e espectro (autovalores/autovetores).",
};
