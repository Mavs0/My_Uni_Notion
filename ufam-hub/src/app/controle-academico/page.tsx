"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { FaltasPanel } from "@/components/controle-academico/FaltasPanel";
import { NotasPanel } from "@/components/controle-academico/NotasPanel";

const tabTriggerClass =
  "rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none sm:text-base";

function ControleAcademicoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab =
    searchParams.get("tab") === "notas" ? "notas" : ("faltas" as const);

  const setTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "faltas") next.delete("tab");
      else next.set("tab", value);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { disciplinas, disciplinasAtivas, loading } = useDisciplinas();
  const lista = disciplinasAtivas.length ? disciplinasAtivas : disciplinas;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-muted/40">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Controle Acadêmico
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Faltas com limite por encontros semanais (75% de presença) e notas
              com regras ME / PF. A MF completa será calculada quando a fórmula
              oficial da disciplina estiver integrada.
            </p>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-border/80 bg-muted/30 p-1">
          <TabsTrigger value="faltas" className={tabTriggerClass}>
            Faltas
          </TabsTrigger>
          <TabsTrigger value="notas" className={tabTriggerClass}>
            Notas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faltas" className="mt-0 outline-none">
          <FaltasPanel disciplinas={lista} loadingDisciplinas={loading} />
        </TabsContent>
        <TabsContent value="notas" className="mt-0 outline-none">
          <NotasPanel disciplinas={lista} loadingDisciplinas={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ControleFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ControleAcademicoPage() {
  return (
    <Suspense fallback={<ControleFallback />}>
      <ControleAcademicoContent />
    </Suspense>
  );
}
