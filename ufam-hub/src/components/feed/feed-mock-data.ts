import type { FeedPostCategory } from "@/components/feed/feed-types";

export type MockFeedPost = {
  id: string;
  userName: string;
  initials: string;
  avatarUrl?: string;
  category: FeedPostCategory;
  /** Primeira linha em destaque no card */
  headline: string;
  body?: string;
  imageUrl?: string;
  /** full = largura total, side = thumb à esquerda, compact = imagem pequena */
  imageLayout?: "full" | "side" | "compact";
  likes: number;
  comments: number;
  timeLabel: string;
};

export const MOCK_FEED_POSTS: MockFeedPost[] = [
  {
    id: "m1",
    userName: "Ana Costa",
    initials: "AC",
    category: "conquista",
    headline: "Concluí todas as tarefas da semana de Cálculo I 🎯",
    body: "Usei o método pomodoro e dividi o conteúdo em blocos pequenos. Valeu cada minuto!",
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    imageLayout: "full",
    likes: 24,
    comments: 5,
    timeLabel: "há 2 horas",
  },
  {
    id: "m2",
    userName: "Pedro Lima",
    initials: "PL",
    category: "dica",
    headline: "Sessão focada: 4 pomodoros seguidos",
    body: "Timer 25/5 + playlist lo-fi. Produtividade lá em cima.",
    imageUrl:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=600&q=80",
    imageLayout: "compact",
    likes: 18,
    comments: 4,
    timeLabel: "há 5 horas",
  },
  {
    id: "m3",
    userName: "Marina Souza",
    initials: "MS",
    category: "reflexao",
    headline: "Mapa mental salvou minha revisão de Física",
    body: "Organizei os tópicos em ramos e conectei fórmulas — ficou muito mais claro na prova.",
    imageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    imageLayout: "side",
    likes: 41,
    comments: 9,
    timeLabel: "ontem",
  },
  {
    id: "m4",
    userName: "Lucas Mendes",
    initials: "LM",
    category: "pergunta",
    headline: "Alguém tem material de Álgebra Linear resolvido passo a passo?",
    likes: 7,
    comments: 14,
    timeLabel: "há 3 dias",
  },
];
