"use client";
import { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ContextualTip {
  id: string;
  chave: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  prioridade: number;
  elemento_alvo?: string;
  posicao: string;
  acao_sugerida?: {
    tipo: string;
    url?: string;
    texto?: string;
  };
}

interface SmartContextualTipProps {
  tip: ContextualTip;
  onDismiss: () => void;
  onAction?: () => void;
}

export function SmartContextualTip({
  tip,
  onDismiss,
  onAction,
}: SmartContextualTipProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se já foi mostrada recentemente
    const shownKey = `tip_${tip.id}_shown`;
    const lastShown = localStorage.getItem(shownKey);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (lastShown && parseInt(lastShown) > oneDayAgo) {
      setDismissed(true);
      return;
    }

    // Encontrar elemento alvo
    if (tip.elemento_alvo) {
      const checkElement = () => {
        try {
          const element = document.querySelector(
            tip.elemento_alvo!
          ) as HTMLElement;
          if (element) {
            targetRef.current = element;
            // Mostrar após delay
            setTimeout(() => {
              setOpen(true);
              localStorage.setItem(shownKey, Date.now().toString());
            }, 2000);
          }
        } catch (e) {
          // Elemento não encontrado, mostrar mesmo assim após delay
          setTimeout(() => {
            setOpen(true);
            localStorage.setItem(shownKey, Date.now().toString());
          }, 3000);
        }
      };

      // Aguardar um pouco para garantir que elementos estão carregados
      setTimeout(checkElement, 1000);
    } else {
      // Sem elemento alvo, mostrar após delay
      setTimeout(() => {
        setOpen(true);
        localStorage.setItem(`tip_${tip.id}_shown`, Date.now().toString());
      }, 2000);
    }
  }, [tip]);

  const handleDismiss = async () => {
    setOpen(false);
    setDismissed(true);

    // Registrar interação
    await fetch("/api/tips/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip_id: tip.id,
        acao: "dismissed",
        contexto: { pagina: window.location.pathname },
      }),
    });

    onDismiss();
  };

  const handleAction = async () => {
    if (tip.acao_sugerida?.url) {
      router.push(tip.acao_sugerida.url);
    }

    // Registrar interação
    await fetch("/api/tips/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip_id: tip.id,
        acao: "action_taken",
        contexto: { pagina: window.location.pathname },
      }),
    });

    setOpen(false);
    setDismissed(true);
    onAction?.();
  };

  const handleShow = async () => {
    // Registrar que foi mostrada
    await fetch("/api/tips/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip_id: tip.id,
        acao: "shown",
        contexto: { pagina: window.location.pathname },
      }),
    });
  };

  useEffect(() => {
    if (open) {
      handleShow();
    }
  }, [open]);

  if (dismissed || !open) return null;

  const getCategoryColor = () => {
    switch (tip.categoria) {
      case "produtividade":
        return "border-blue-500/30 bg-blue-500/10";
      case "descoberta":
        return "border-purple-500/30 bg-purple-500/10";
      case "otimizacao":
        return "border-green-500/30 bg-green-500/10";
      case "alerta":
        return "border-red-500/30 bg-red-500/10";
      default:
        return "border-yellow-500/30 bg-yellow-500/10";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute z-50 h-8 w-8 p-0 animate-pulse",
            tip.posicao === "top" && "bottom-full mb-2",
            tip.posicao === "bottom" && "top-full mt-2",
            tip.posicao === "left" && "right-full mr-2",
            tip.posicao === "right" && "left-full ml-2"
          )}
          style={{
            ...(targetRef.current && {
              top: `${targetRef.current.offsetTop}px`,
              left: `${targetRef.current.offsetLeft}px`,
            }),
          }}
        >
          <Lightbulb className="h-4 w-4 text-yellow-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-80 z-[9999]", getCategoryColor())}
        side={tip.posicao as any}
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">{tip.titulo}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm text-foreground">{tip.conteudo}</p>
          {tip.acao_sugerida && (
            <Button
              size="sm"
              onClick={handleAction}
              className="w-full"
              variant="outline"
            >
              {tip.acao_sugerida.texto || "Ver mais"}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TipManagerProps {
  pagina: string;
  maxTips?: number;
}

export function TipManager({ pagina, maxTips = 1 }: TipManagerProps) {
  const [tips, setTips] = useState<ContextualTip[]>([]);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTips();
  }, [pagina]);

  const loadTips = async () => {
    try {
      const response = await fetch(
        `/api/tips/contextual?pagina=${pagina}&limite=${maxTips}`
      );
      if (response.ok) {
        const data = await response.json();
        setTips(data.tips || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dicas:", error);
    }
  };

  const handleDismiss = (tipId: string) => {
    setDismissedTips((prev) => new Set(prev).add(tipId));
  };

  return (
    <>
      {tips
        .filter((tip) => !dismissedTips.has(tip.id))
        .map((tip) => (
          <SmartContextualTip
            key={tip.id}
            tip={tip}
            onDismiss={() => handleDismiss(tip.id)}
          />
        ))}
    </>
  );
}
