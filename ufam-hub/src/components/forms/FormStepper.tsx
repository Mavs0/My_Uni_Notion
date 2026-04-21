"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type FormStepperProps = {
  /** Passo atual (1-based). */
  currentStep: number;
  /** Rótulo curto por passo (ex.: "Info geral", "Horários"). */
  labels: readonly [string, string];
  className?: string;
};

export function FormStepper({
  currentStep,
  labels,
  className,
}: FormStepperProps) {
  return (
    <div className={cn("border-b bg-muted/10", className)}>
      <div className="flex items-center justify-center gap-0 px-6 pt-6 pb-3">
        {[1, 2].map((s) => {
          const done = currentStep > s;
          const active = currentStep === s;
          return (
            <div key={s} className="flex items-center">
              {s === 2 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-8 sm:w-16 rounded-full transition-colors",
                    currentStep >= 2 ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-all",
                  done &&
                    "bg-primary text-primary-foreground shadow-primary/25",
                  active &&
                    !done &&
                    "bg-primary text-primary-foreground ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
                  !active &&
                    !done &&
                    "bg-muted text-muted-foreground border border-border/80",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                ) : (
                  <span>{s}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-10 sm:gap-20 px-6 pb-4 text-center text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            "max-w-[8rem] transition-colors",
            currentStep === 1 && "text-foreground",
          )}
        >
          {labels[0]}
        </span>
        <span
          className={cn(
            "max-w-[8rem] transition-colors",
            currentStep === 2 && "text-foreground",
          )}
        >
          {labels[1]}
        </span>
      </div>
    </div>
  );
}
