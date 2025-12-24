"use client";
import { useState, useEffect, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualTip {
  id: string;
  title: string;
  content: string;
  target?: string; // Seletor CSS
  position?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  delay?: number; // Delay em ms antes de mostrar
}

interface ContextualTipProps {
  tip: ContextualTip;
  onDismiss: (tipId: string) => void;
}

export function ContextualTip({ tip, onDismiss }: ContextualTipProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Verificar se já foi mostrado
    if (tip.showOnce) {
      const shown = localStorage.getItem(`tip_${tip.id}_shown`);
      if (shown === "true") {
        setDismissed(true);
        return;
      }
    }

    // Encontrar elemento alvo
    if (tip.target) {
      const element = document.querySelector(tip.target) as HTMLElement;
      if (element) {
        targetRef.current = element;

        // Adicionar delay se especificado
        const timeout = setTimeout(() => {
          setOpen(true);
          if (tip.showOnce) {
            localStorage.setItem(`tip_${tip.id}_shown`, "true");
          }
        }, tip.delay || 1000);

        return () => clearTimeout(timeout);
      }
    } else {
      // Mostrar imediatamente se não há target
      const timeout = setTimeout(() => {
        setOpen(true);
        if (tip.showOnce) {
          localStorage.setItem(`tip_${tip.id}_shown`, "true");
        }
      }, tip.delay || 1000);

      return () => clearTimeout(timeout);
    }
  }, [tip]);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    onDismiss(tip.id);
    if (tip.showOnce) {
      localStorage.setItem(`tip_${tip.id}_shown`, "true");
    }
  };

  if (dismissed) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="sm"
          className={cn(
            "absolute z-50 h-8 w-8 p-0",
            tip.position === "top" && "bottom-full mb-2",
            tip.position === "bottom" && "top-full mt-2",
            tip.position === "left" && "right-full mr-2",
            tip.position === "right" && "left-full ml-2"
          )}
          style={{
            display: open ? "flex" : "none",
            ...(targetRef.current && {
              top: targetRef.current.offsetTop,
              left: targetRef.current.offsetLeft,
            }),
          }}
        >
          <Lightbulb className="h-4 w-4 text-yellow-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 z-[9999]"
        side={tip.position || "top"}
        align="start"
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">{tip.title}</h4>
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
          <p className="text-sm text-muted-foreground">{tip.content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ContextualTipsManagerProps {
  tips: ContextualTip[];
}

export function ContextualTipsManager({ tips }: ContextualTipsManagerProps) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  const handleDismiss = (tipId: string) => {
    setDismissedTips((prev) => new Set(prev).add(tipId));
  };

  return (
    <>
      {tips
        .filter((tip) => !dismissedTips.has(tip.id))
        .map((tip) => (
          <ContextualTip key={tip.id} tip={tip} onDismiss={handleDismiss} />
        ))}
    </>
  );
}
