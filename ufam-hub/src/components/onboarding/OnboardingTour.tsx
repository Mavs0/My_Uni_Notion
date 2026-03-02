"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  MessageSquare,
  Clock,
  Users,
  X,
  HelpCircle,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  target?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Aqui você tem uma visão geral do seu progresso, próximas avaliações e estatísticas de estudo. Tudo organizado em um só lugar.",
    icon: LayoutDashboard,
    target: "[data-tour='dashboard']",
  },
  {
    id: "disciplinas",
    title: "Disciplinas",
    description:
      "Gerencie todas as suas disciplinas, adicione horários, professores e organize seus estudos por matéria.",
    icon: BookOpen,
    action: { label: "Ver Disciplinas", href: "/disciplinas" },
  },
  {
    id: "anotacoes",
    title: "Anotações",
    description:
      "Crie e organize suas anotações em Markdown. Use a busca (⌘K) para encontrar rapidamente qualquer conteúdo.",
    icon: FileText,
    action: { label: "Buscar anotações", href: "/busca-anotacoes" },
  },
  {
    id: "chat-ia",
    title: "Chat com IA",
    description:
      "Use a inteligência artificial para tirar dúvidas, gerar quizzes, mapas mentais e resumos para turbinar seus estudos.",
    icon: MessageSquare,
    action: { label: "Experimentar Chat IA", href: "/chat" },
  },
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    description:
      "Use a técnica Pomodoro para manter o foco e registrar automaticamente suas horas de estudo por disciplina.",
    icon: Clock,
    action: { label: "Iniciar Pomodoro", href: "/pomodoro" },
  },
  {
    id: "social",
    title: "Rede e Descobrir",
    description:
      "Conecte-se com outros estudantes, descubra perfis públicos e acompanhe atividades no feed.",
    icon: Users,
    action: { label: "Explorar", href: "/descobrir" },
  },
  {
    id: "learn-more",
    title: "Quer saber mais?",
    description:
      "Explore a seção Ajuda para vídeos e tutoriais sobre a plataforma. Se precisar de uma recapitulação, você pode assistir ao tour novamente pelo botão \"Iniciar Tour\" no dashboard.",
    icon: HelpCircle,
  },
];

const WELCOME_FEATURES = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Disciplinas", icon: BookOpen },
  { label: "Chat IA", icon: MessageSquare },
  { label: "Pomodoro", icon: Clock },
  { label: "Rede", icon: Users },
  { label: "Anotações", icon: FileText },
];

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ open, onComplete, onSkip }: OnboardingTourProps) {
  const [phase, setPhase] = useState<"welcome" | "steps">("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const stepData = TOUR_STEPS[currentStep];
  const StepIcon = stepData?.icon;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (open) {
      setPhase("welcome");
      setCurrentStep(0);
    }
  }, [open]);

  // Mostrar borda/destaque apenas no passo Dashboard (abas não são destacadas)
  useEffect(() => {
    if (!open || phase !== "steps") return;
    if (stepData?.id !== "dashboard" || !stepData?.target) {
      setHighlightedElement(null);
      return;
    }
    const el = document.querySelector(stepData.target) as HTMLElement;
    if (el) {
      setHighlightedElement(el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setHighlightedElement(null);
    }
    return () => setHighlightedElement(null);
  }, [open, phase, currentStep, stepData?.id, stepData?.target]);

  useEffect(() => {
    if (!highlightedElement || !overlayRef.current) return;
    const rect = highlightedElement.getBoundingClientRect();
    const overlay = overlayRef.current;
    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }, [highlightedElement]);

  const handleMaybeLater = async () => {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourCompleted: true, skipped: true }),
    });
    onSkip();
  };

  const handleLetsGo = () => {
    setPhase("steps");
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
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

  const handleAction = () => {
    if (stepData?.action?.href) router.push(stepData.action.href);
    if (stepData?.action?.onClick) stepData.action.onClick();
  };

  if (!open) return null;

  return (
    <>
      {highlightedElement && phase === "steps" && stepData?.id === "dashboard" && (
        <div
          ref={overlayRef}
          className="fixed z-[9998] rounded-lg border-2 border-primary/80 shadow-2xl transition-all duration-300 pointer-events-none"
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
          }}
        />
      )}

      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className={cn(
            "z-[9999] p-0 gap-0 overflow-hidden rounded-2xl max-w-lg",
            phase === "welcome" ? "sm:max-w-md" : "sm:max-w-lg"
          )}
          showCloseButton={false}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">
            {phase === "welcome" ? "Bem-vindo ao UFAM Hub" : stepData?.title ?? "Tour"}
          </DialogTitle>
          {phase === "welcome" ? (
            <>
              <div className="flex justify-end pt-4 pr-4">
                <button
                  type="button"
                  onClick={handleMaybeLater}
                  className="rounded-full p-2 hover:bg-muted transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 pb-2 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Bem-vindo ao UFAM Hub!
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Queremos mostrar como você pode usar o UFAM Hub para melhorar seu fluxo de estudos!
                </p>
              </div>
              <div className="px-6 py-6">
                <div className="rounded-xl border bg-muted/30 p-4 flex flex-wrap justify-center gap-3">
                  {WELCOME_FEATURES.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 rounded-lg bg-background/80 px-3 py-2.5 border shadow-sm"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleMaybeLater}
                >
                  Depois
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleLetsGo}
                >
                  Vamos lá
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Cabeçalho: ícone + título à esquerda, X à direita (igual ao exemplo) */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <StepIcon className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {stepData.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Conteúdo: título, descrição, ação opcional */}
              <div className="px-4 py-4">
                <h4 className="text-lg font-bold text-foreground">
                  {stepData.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {stepData.description}
                </p>
                {stepData.action && !isLastStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-lg"
                    onClick={handleAction}
                  >
                    {stepData.action.label}
                  </Button>
                )}
              </div>
              {/* Rodapé: progresso à esquerda, Voltar + Próximo/Concluir à direita */}
              <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} de {TOUR_STEPS.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    Voltar
                  </Button>
                  {isLastStep ? (
                    <Button size="sm" className="rounded-lg" onClick={handleComplete}>
                      Concluir
                    </Button>
                  ) : (
                    <Button size="sm" className="rounded-lg" onClick={handleNext}>
                      Próximo
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
