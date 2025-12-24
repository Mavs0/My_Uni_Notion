"use client";
import { useState } from "react";
import { Search, BookOpen, HelpCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen as BookOpenIcon,
  GraduationCap,
  FileText,
  Brain,
  Trophy,
  Clock,
  Shield,
  Users,
  MessageSquare,
  Settings,
  Bell,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tags: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "comecando",
    title: "Começando no UFAM Hub",
    description:
      "Aprenda os primeiros passos para usar a plataforma: criar conta, adicionar disciplinas e começar a organizar seus estudos.",
    category: "Básico",
    icon: LayoutDashboard,
    href: "/ajuda/comecando",
    tags: ["início", "configuração", "básico", "primeiros passos"],
  },
  {
    id: "disciplinas",
    title: "Gerenciando Disciplinas",
    description:
      "Como adicionar, editar e organizar suas disciplinas. Configure horários, professores e cores personalizadas.",
    category: "Básico",
    icon: BookOpenIcon,
    href: "/ajuda/disciplinas",
    tags: ["disciplinas", "organização", "horários", "professores"],
  },
  {
    id: "avaliacoes",
    title: "Gerenciando Avaliações",
    description:
      "Como adicionar avaliações, calcular médias e acompanhar seu desempenho acadêmico.",
    category: "Básico",
    icon: GraduationCap,
    href: "/ajuda/avaliacoes",
    tags: ["avaliações", "notas", "médias", "desempenho"],
  },
  {
    id: "anotacoes",
    title: "Criando e Organizando Anotações",
    description:
      "Aprenda a criar anotações em Markdown, usar a busca avançada e organizar seu conteúdo de estudo.",
    category: "Básico",
    icon: FileText,
    href: "/ajuda/anotacoes",
    tags: ["anotações", "markdown", "busca", "organização"],
  },
  {
    id: "chat-ia",
    title: "Usando o Chat IA",
    description:
      "Descubra como usar a inteligência artificial para tirar dúvidas, gerar quizzes e mapas mentais.",
    category: "IA",
    icon: Brain,
    href: "/ajuda/chat-ia",
    tags: ["ia", "chat", "quizzes", "mapas mentais", "dúvidas"],
  },
  {
    id: "gamificacao",
    title: "Sistema de Gamificação",
    description:
      "Entenda como ganhar XP, subir de nível, manter streaks e desbloquear conquistas.",
    category: "Gamificação",
    icon: Trophy,
    href: "/ajuda/gamificacao",
    tags: ["xp", "níveis", "conquistas", "streaks", "badges"],
  },
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    description:
      "Use a técnica Pomodoro para manter o foco e registrar automaticamente suas horas de estudo.",
    category: "Produtividade",
    icon: Clock,
    href: "/ajuda/pomodoro",
    tags: ["pomodoro", "foco", "produtividade", "técnica"],
  },
  {
    id: "lembretes",
    title: "Sistema de Lembretes",
    description:
      "Configure lembretes automáticos para avaliações, tarefas e mantenha seu streak ativo.",
    category: "Produtividade",
    icon: Bell,
    href: "/ajuda/lembretes",
    tags: ["lembretes", "notificações", "avaliações", "tarefas"],
  },
  {
    id: "feed-social",
    title: "Feed Social e Interações",
    description:
      "Compartilhe atividades, comente, reaja e descubra outros estudantes na plataforma.",
    category: "Social",
    icon: Users,
    href: "/ajuda/feed-social",
    tags: ["feed", "social", "comentários", "reações", "compartilhamento"],
  },
  {
    id: "seguranca",
    title: "Segurança da Conta",
    description:
      "Proteja sua conta com autenticação de dois fatores, gerencie sessões e configure privacidade.",
    category: "Segurança",
    icon: Shield,
    href: "/ajuda/seguranca",
    tags: ["segurança", "2fa", "privacidade", "sessões"],
  },
  {
    id: "configuracoes",
    title: "Configurações e Personalização",
    description:
      "Personalize a plataforma, configure notificações, temas e preferências de acessibilidade.",
    category: "Configurações",
    icon: Settings,
    href: "/ajuda/configuracoes",
    tags: ["configurações", "personalização", "temas", "acessibilidade"],
  },
];

const categories = Array.from(
  new Set(HELP_ARTICLES.map((article) => article.category))
);

export default function AjudaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === null || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
        </div>
        <p className="text-muted-foreground">
          Encontre respostas para suas dúvidas e aprenda a usar todas as
          funcionalidades da plataforma
        </p>
      </header>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar ajuda... (ex: criar disciplina, adicionar nota, configurar 2FA)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todas as Categorias
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

      {/* Resultados */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">Nenhum artigo encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Tente usar outros termos de busca ou selecione uma categoria
              diferente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const Icon = article.icon;
            return (
              <Link key={article.id} href={article.href}>
                <Card className="h-full hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        <div className="mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            {article.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {article.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-4 text-sm text-primary group-hover:gap-3 transition-all">
                      <span className="font-medium">Ler mais</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Ajuda Adicional */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Precisa de mais ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Se você não encontrou o que procurava, tente:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>Usar termos diferentes na busca</li>
            <li>Verificar todas as categorias</li>
            <li>Usar o Chat IA para fazer perguntas específicas</li>
            <li>Verificar a documentação completa de cada funcionalidade</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
