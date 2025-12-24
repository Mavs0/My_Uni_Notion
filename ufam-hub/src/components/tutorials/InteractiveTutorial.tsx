"use client";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TutorialStep {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tipo: string;
  acao_esperada: any;
  validacao: any;
  elemento_alvo?: string;
  posicao_popover: string;
  dica?: string;
  opcional: boolean;
  completado?: boolean;
}

interface Tutorial {
  id: string;
  funcionalidade: string;
  titulo: string;
  descricao: string;
  icone: string;
  steps: TutorialStep[];
  progresso?: {
    passo_atual: number;
    concluido: boolean;
  };
}

interface InteractiveTutorialProps {
  tutorialId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  startFromStep?: number;
}

export function InteractiveTutorial({
  tutorialId,
  onComplete,
  onSkip,
  startFromStep = 0,
}: InteractiveTutorialProps) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(startFromStep);
  const [loading, setLoading] = useState(true);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadTutorial();
  }, [tutorialId]);

  useEffect(() => {
    if (tutorial && tutorial.steps[currentStep]) {
      highlightElement();
    }
  }, [currentStep, tutorial]);

  const loadTutorial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tutorials/${tutorialId}`);
      if (!response.ok) throw new Error("Erro ao carregar tutorial");
      const data = await response.json();
      setTutorial(data.tutorial);

      // Iniciar progresso se não existir
      if (!data.tutorial.progresso) {
        await fetch(`/api/tutorials/${tutorialId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passo_atual: startFromStep }),
        });
      } else {
        setCurrentStep(data.tutorial.progresso.passo_atual);
      }
    } catch (error) {
      console.error("Erro ao carregar tutorial:", error);
    } finally {
      setLoading(false);
    }
  };

  const highlightElement = () => {
    if (!tutorial) return;
    const step = tutorial.steps[currentStep];
    if (!step?.elemento_alvo) {
      setHighlightedElement(null);
      return;
    }

    // Aguardar um pouco para garantir que o elemento existe
    setTimeout(() => {
      try {
        const element = document.querySelector(
          step.elemento_alvo!
        ) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          setHighlightedElement(null);
        }
      } catch (e) {
        setHighlightedElement(null);
      }
    }, 300);
  };

  const updateOverlayPosition = () => {
    if (highlightedElement && overlayRef.current) {
      const rect = highlightedElement.getBoundingClientRect();
      const overlay = overlayRef.current;
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    }
  };

  useEffect(() => {
    updateOverlayPosition();
    window.addEventListener("scroll", updateOverlayPosition);
    window.addEventListener("resize", updateOverlayPosition);
    return () => {
      window.removeEventListener("scroll", updateOverlayPosition);
      window.removeEventListener("resize", updateOverlayPosition);
    };
  }, [highlightedElement]);

  const handleNext = async () => {
    if (!tutorial) return;

    const step = tutorial.steps[currentStep];
    if (step) {
      // Marcar passo como completado
      await fetch(`/api/tutorials/${tutorialId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passo_atual: currentStep + 1,
          passo_completado_id: step.id,
          acao: {
            tipo: "complete",
            sucesso: true,
          },
        }),
      });
    }

    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!tutorial) return;

    const tempoTotal = Math.floor((Date.now() - startTimeRef.current) / 1000);

    await fetch(`/api/tutorials/${tutorialId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passo_atual: tutorial.steps.length,
        tempo_total: tempoTotal,
      }),
    });

    onComplete?.();
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (loading || !tutorial) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const step = tutorial.steps[currentStep];
  if (!step) return null;

  const isLastStep = currentStep === tutorial.steps.length - 1;
  const progress = ((currentStep + 1) / tutorial.steps.length) * 100;

  return (
    <>
      {/* Overlay de destaque */}
      {highlightedElement && (
        <div
          ref={overlayRef}
          className="fixed z-[9998] rounded-lg border-4 border-primary shadow-2xl transition-all duration-300 pointer-events-none"
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{step.titulo}</DialogTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    Passo {currentStep + 1} de {tutorial.steps.length} •{" "}
                    {tutorial.titulo}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <DialogDescription className="text-base mt-4">
            {step.descricao}
          </DialogDescription>

          {step.dica && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {step.dica}
                </p>
              </div>
            </div>
          )}

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {step.opcional && (
                <Button variant="ghost" onClick={handleNext}>
                  Pular
                </Button>
              )}
              {isLastStep ? (
                <Button onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
