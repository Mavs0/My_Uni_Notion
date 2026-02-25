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
  BookOpen,
  GraduationCap,
  FileText,
  MessageSquare,
  Clock,
  Users,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  target?: string; // Seletor CSS do elemento a destacar
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao UFAM Hub! 🎓",
    description:
      "Vamos fazer um tour rápido para você conhecer as principais funcionalidades da plataforma.",
    icon: BookOpen,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Aqui você vê uma visão geral do seu progresso, próximas avaliações e estatísticas de estudo.",
    icon: GraduationCap,
    target: "[data-tour='dashboard']",
  },
  {
    id: "disciplinas",
    title: "Disciplinas",
    description:
      "Gerencie todas as suas disciplinas, adicione horários, professores e organize seus estudos.",
    icon: BookOpen,
    action: {
      label: "Ver Disciplinas",
      href: "/disciplinas",
    },
  },
  {
    id: "anotacoes",
    title: "Anotações",
    description:
      "Crie e organize suas anotações em Markdown. Use a busca para encontrar rapidamente qualquer conteúdo.",
    icon: FileText,
    action: {
      label: "Ver Anotações",
      href: "/busca-anotacoes",
    },
  },
  {
    id: "chat-ia",
    title: "Chat com IA",
    description:
      "Use a inteligência artificial para tirar dúvidas, gerar quizzes, mapas mentais e muito mais!",
    icon: MessageSquare,
    action: {
      label: "Experimentar Chat IA",
      href: "/chat",
    },
  },
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    description:
      "Use a técnica Pomodoro para manter o foco e registrar automaticamente suas horas de estudo.",
    icon: Clock,
    action: {
      label: "Iniciar Pomodoro",
      href: "/pomodoro",
    },
  },
  {
    id: "social",
    title: "Rede Social",
    description:
      "Conecte-se com outros estudantes, descubra perfis públicos e acompanhe atividades no feed.",
    icon: Users,
    action: {
      label: "Explorar",
      href: "/descobrir",
    },
  },
];

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ open, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = TOUR_STEPS[currentStep];
  const Icon = currentStepData.icon;

  useEffect(() => {
    if (!open) return;

    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }

    if (highlightedElement && overlayRef.current) {
      const rect = highlightedElement.getBoundingClientRect();
      const overlay = overlayRef.current;
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    }
  }, [open, currentStep, currentStepData.target, highlightedElement]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
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

  const handleAction = () => {
    if (currentStepData.action) {
      if (currentStepData.action.href) {
        router.push(currentStepData.action.href);
      }
      if (currentStepData.action.onClick) {
        currentStepData.action.onClick();
      }
    }
  };

  const handleComplete = async () => {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourCompleted: true }),
    });
    onComplete();
  };

  const handleSkip = async () => {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourCompleted: true, skipped: true }),
    });
    onSkip();
  };

  return (
    <>
      {/* Overlay de destaque */}
      {highlightedElement && (
        <div
          ref={overlayRef}
          className="fixed z-[9998] rounded-lg border-4 border-primary shadow-2xl transition-all duration-300"
          style={{
            pointerEvents: "none",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />
      )}

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle>{currentStepData.title}</DialogTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    Passo {currentStep + 1} de {TOUR_STEPS.length}
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
            {currentStepData.description}
          </DialogDescription>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Ação opcional */}
          {currentStepData.action && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleAction}
            >
              {currentStepData.action.label}
            </Button>
          )}

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
              {currentStep < TOUR_STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Concluir Tour
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

