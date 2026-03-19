"use client";

import * as React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { ChamadaGroupInfo } from "./ChamadaSidebarContext";

type AcessoGeral = "restrito" | "qualquer_com_link";

export function ChamadaShareModal({
  open,
  onOpenChange,
  groupInfo,
  userLabel = "Você",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupInfo: ChamadaGroupInfo | null;
  userLabel?: string;
}) {
  const [acessoGeral, setAcessoGeral] = React.useState<AcessoGeral>("qualquer_com_link");
  const callLink = React.useMemo(() => {
    if (typeof window === "undefined" || !groupInfo) return "";
    const base = window.location.origin;
    return `${base}/grupos/${groupInfo.id}/chamada`;
  }, [groupInfo?.id]);

  const copyLink = () => {
    if (!callLink) return;
    navigator.clipboard.writeText(callLink).then(
      () => toast.success("Link copiado. Qualquer pessoa com o link pode entrar na chamada (precisa estar logada)."),
      () => toast.error("Não foi possível copiar o link.")
    );
  };

  const isPublico = groupInfo?.visibilidade === "publico";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Compartilhar &quot;{groupInfo?.nome ?? "Chamada"}&quot;
          </DialogTitle>
          <DialogDescription className="sr-only">
            Convidar pessoas para a chamada do grupo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Pessoas com acesso */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Pessoas com acesso
            </p>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
                {(userLabel || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{userLabel} (você)</p>
                <p className="text-xs text-muted-foreground">Proprietário</p>
              </div>
            </div>
          </div>

          {/* Acesso geral: público = dropdown; privado = só membros */}
          {isPublico ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Acesso geral
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select
                  value={acessoGeral}
                  onValueChange={(v) => setAcessoGeral(v as AcessoGeral)}
                >
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 h-auto py-0 flex-1 min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restrito">
                      Restrito
                    </SelectItem>
                    <SelectItem value="qualquer_com_link">
                      Qualquer pessoa com link
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {acessoGeral === "restrito"
                  ? "Só as pessoas com acesso podem abrir usando o link."
                  : "Qualquer pessoa na Internet com o link pode ver."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/10 px-3 py-3">
              <p className="text-sm text-muted-foreground">
                Grupo privado. Apenas membros do grupo podem entrar na chamada.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Para convidar mais pessoas, adicione-as ao grupo pela página do grupo.
              </p>
              {groupInfo && (
                <Button variant="outline" size="sm" className="mt-3 rounded-lg" asChild>
                  <Link href={`/grupos/${groupInfo.id}`}>
                    Abrir página do grupo
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Copiar link: só para grupo público */}
          {isPublico && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={copyLink}
              >
                <Link2 className="h-4 w-4" />
                Copiar link
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button type="button" onClick={() => onOpenChange(false)} className="rounded-lg">
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
