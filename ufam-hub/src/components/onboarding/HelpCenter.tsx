"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  HelpCircle,
  MessageSquare,
  Video,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  href?: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "comecando",
    title: "Começando no UFAM Hub",
    category: "Básico",
    content:
      "Aprenda os primeiros passos para usar a plataforma: criar conta, adicionar disciplinas e começar a organizar seus estudos.",
    tags: ["início", "configuração", "básico"],
    href: "/ajuda/comecando",
  },
  {
    id: "disciplinas",
    title: "Gerenciando Disciplinas",
    category: "Básico",
    content:
      "Como adicionar, editar e organizar suas disciplinas. Configure horários, professores e cores personalizadas.",
    tags: ["disciplinas", "organização"],
    href: "/ajuda/disciplinas",
  },
  {
    id: "avaliacoes",
    title: "Gerenciando Avaliações",
    category: "Básico",
    content:
      "Como adicionar avaliações, calcular médias e acompanhar seu desempenho acadêmico.",
    tags: ["avaliações", "notas", "médias"],
    href: "/ajuda/avaliacoes",
  },
  {
    id: "anotacoes",
    title: "Criando e Organizando Anotações",
    category: "Básico",
    content:
      "Aprenda a criar anotações em Markdown, usar a busca avançada e organizar seu conteúdo de estudo.",
    tags: ["anotações", "markdown", "busca"],
    href: "/ajuda/anotacoes",
  },
  {
    id: "chat-ia",
    title: "Usando o Chat IA",
    category: "IA",
    content:
      "Descubra como usar a inteligência artificial para tirar dúvidas, gerar quizzes e mapas mentais.",
    tags: ["ia", "chat", "quizzes"],
    href: "/ajuda/chat-ia",
  },
  {
    id: "gamificacao",
    title: "Sistema de Gamificação",
    category: "Gamificação",
    content:
      "Entenda como ganhar XP, subir de nível, manter streaks e desbloquear conquistas.",
    tags: ["xp", "níveis", "conquistas"],
    href: "/ajuda/gamificacao",
  },
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    category: "Produtividade",
    content:
      "Use a técnica Pomodoro para manter o foco e registrar automaticamente suas horas de estudo.",
    tags: ["pomodoro", "foco", "produtividade"],
    href: "/ajuda/pomodoro",
  },
  {
    id: "lembretes",
    title: "Sistema de Lembretes",
    category: "Produtividade",
    content:
      "Configure lembretes automáticos para avaliações, tarefas e mantenha seu streak ativo.",
    tags: ["lembretes", "notificações", "avaliações"],
    href: "/ajuda/lembretes",
  },
  {
    id: "feed-social",
    title: "Feed Social e Interações",
    category: "Social",
    content:
      "Compartilhe atividades, comente, reaja e descubra outros estudantes na plataforma.",
    tags: ["social", "feed", "comentários", "reações"],
    href: "/ajuda/feed-social",
  },
  {
    id: "seguranca",
    title: "Segurança da Conta",
    category: "Segurança",
    content:
      "Configure autenticação de dois fatores (2FA) e mantenha sua conta segura.",
    tags: ["segurança", "2fa", "privacidade"],
    href: "/ajuda/seguranca",
  },
  {
    id: "configuracoes",
    title: "Configurações e Personalização",
    category: "Configurações",
    content:
      "Personalize a plataforma, configure notificações, temas e preferências de acessibilidade.",
    tags: ["configurações", "personalização", "temas"],
    href: "/ajuda/configuracoes",
  },
];

interface HelpCenterProps {
  trigger?: React.ReactNode;
}

export function HelpCenter({ trigger }: HelpCenterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(HELP_ARTICLES.map((article) => article.category))
  );

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === null || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Ajuda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Central de Ajuda
          </DialogTitle>
          <DialogDescription>
            Encontre respostas para suas dúvidas e aprenda a usar a plataforma
          </DialogDescription>
        </DialogHeader>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ajuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Lista de artigos */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum artigo encontrado</p>
              <p className="text-sm mt-2">
                Tente buscar com outros termos ou escolha outra categoria
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={article.href || "#"}
                onClick={() => setOpen(false)}
              >
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">
                          {article.category}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.content}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Não encontrou o que procura?
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Perguntar à IA
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
