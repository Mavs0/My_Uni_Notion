"use client";

import { ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLAB_WEB_LOGIN_URL } from "@/lib/external-links";
import { cn } from "@/lib/utils";

export function ColabWebCallout({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/25 p-4 flex flex-col sm:flex-row sm:items-center gap-4",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">ColabWeb (IComp)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Portal oficial do Instituto de Computação para entrega de trabalhos, provas e
          atividades. Use a mesma conta acadêmica; o link abre em nova aba.
        </p>
      </div>
      <Button variant="secondary" size="sm" className="shrink-0 w-full sm:w-auto" asChild>
        <a href={COLAB_WEB_LOGIN_URL} target="_blank" rel="noopener noreferrer">
          Abrir ColabWeb
          <ExternalLink className="h-3.5 w-3.5 ml-2" aria-hidden />
        </a>
      </Button>
    </div>
  );
}
