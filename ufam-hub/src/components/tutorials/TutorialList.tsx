"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { InteractiveTutorial } from "./InteractiveTutorial";

interface Tutorial {
  id: string;
  funcionalidade: string;
  titulo: string;
  descricao: string;
  icone: string;
  duracao_estimada: number;
  dificuldade: string;
  progresso?: {
    passo_atual: number;
    total_passos: number;
    concluido: boolean;
    progresso_percentual: number;
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
  Clock,
};

export function TutorialList() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tutorials");
      if (response.ok) {
        const data = await response.json();
        setTutorials(data.tutorials || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tutoriais:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTutorial = (tutorialId: string) => {
    setActiveTutorial(tutorialId);
  };

  const handleTutorialComplete = () => {
    setActiveTutorial(null);
    loadTutorials(); // Recarregar para atualizar progresso
  };

  const handleTutorialSkip = () => {
    setActiveTutorial(null);
  };

  const getDifficultyColor = (dificuldade: string) => {
    switch (dificuldade) {
      case "facil":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "medio":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "avancado":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tutorials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nenhum tutorial disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {activeTutorial && (
        <InteractiveTutorial
          tutorialId={activeTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tutorials.map((tutorial) => {
          const Icon = iconMap[tutorial.icone] || BookOpen;
          const progresso = tutorial.progresso;

          return (
            <Card key={tutorial.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {tutorial.titulo}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tutorial.descricao}
                      </CardDescription>
                    </div>
                  </div>
                  {progresso?.concluido && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getDifficultyColor(tutorial.dificuldade)}
                    >
                      {tutorial.dificuldade}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ~{tutorial.duracao_estimada} min
                    </span>
                  </div>

                  {progresso && progresso.progresso_percentual > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {progresso.progresso_percentual}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${progresso.progresso_percentual}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleStartTutorial(tutorial.id)}
                    variant={progresso?.concluido ? "outline" : "default"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {progresso?.concluido
                      ? "Refazer Tutorial"
                      : progresso
                      ? "Continuar"
                      : "Iniciar Tutorial"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
