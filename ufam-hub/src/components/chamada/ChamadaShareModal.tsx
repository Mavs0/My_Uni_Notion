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
import { Check, Copy, Link2, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChamadaGroupInfo } from "./ChamadaSidebarContext";

type AcessoGeral = "restrito" | "qualquer_com_link";

type MembroApi = {
  user_id: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
      full_name?: string;
    };
  };
};

const AVATAR_BG = [
  "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100",
  "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100",
  "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  "bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-100",
];

function hashPick<T>(s: string, arr: T[]): T {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

function nomeMembro(m: MembroApi): string {
  const meta = m.usuario?.raw_user_meta_data;
  const n =
    (meta?.nome as string) ||
    (meta?.full_name as string) ||
    meta?.email?.split("@")[0];
  return n?.trim() || "Membro";
}

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
  const [acessoGeral, setAcessoGeral] =
    React.useState<AcessoGeral>("qualquer_com_link");
  const [membros, setMembros] = React.useState<MembroApi[]>([]);
  const [loadingMembros, setLoadingMembros] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const isPublico = groupInfo?.visibilidade === "publico";
  const showLinkOnly = Boolean(
    isPublico && acessoGeral === "qualquer_com_link",
  );
  const showRestricted = !isPublico || acessoGeral === "restrito";

  const callLink = React.useMemo(() => {
    if (typeof window === "undefined" || !groupInfo) return "";
    const base = window.location.origin;
    return `${base}/grupos/${groupInfo.id}/chamada`;
  }, [groupInfo?.id]);

  const copyLink = React.useCallback(() => {
    if (!callLink) return;
    void navigator.clipboard.writeText(callLink).then(
      () => toast.success("Link copiado para a área de transferência!"),
      () => toast.error("Não foi possível copiar o link."),
    );
  }, [callLink]);

  React.useEffect(() => {
    if (!isPublico) {
      setAcessoGeral("restrito");
    }
  }, [isPublico]);

  React.useEffect(() => {
    if (!open || !groupInfo?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const pr = await fetch("/api/profile", { credentials: "include" });
        const pj = await pr.json().catch(() => ({}));
        if (!cancelled && pj?.profile?.id) {
          setCurrentUserId(pj.profile.id);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, groupInfo?.id]);

  React.useEffect(() => {
    if (!open || !groupInfo?.id || !showRestricted) return;

    let cancelled = false;
    setLoadingMembros(true);
    fetch(`/api/colaboracao/grupos/${groupInfo.id}/membros`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = (data?.membros as MembroApi[]) || [];
        setMembros(list);
        setSelectedIds(new Set(list.map((m) => m.user_id)));
      })
      .catch(() => {
        if (!cancelled) {
          setMembros([]);
          toast.error("Não foi possível carregar os membros do grupo.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMembros(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, groupInfo?.id, showRestricted]);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleEnviarCompartilhamento = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um membro.");
      return;
    }
    if (!callLink) return;
    void navigator.clipboard.writeText(callLink).then(
      () => {
        const names = membros
          .filter((m) => selectedIds.has(m.user_id))
          .map(nomeMembro)
          .slice(0, 5);
        const extra =
          selectedIds.size > 5 ? ` e mais ${selectedIds.size - 5}` : "";
        toast.success(
          `Link copiado. Destinatários: ${names.join(", ")}${extra}`,
        );
        onOpenChange(false);
      },
      () => toast.error("Não foi possível copiar o link."),
    );
  };

  const ownerInitial = (userLabel || "?").charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-h-[min(90vh,720px)] w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg",
          showLinkOnly &&
            isPublico &&
            "border border-slate-600/80 bg-[#1e1e1e] text-slate-100 shadow-2xl [&_[data-slot=dialog-close]]:text-slate-400 [&_[data-slot=dialog-close]]:hover:bg-white/10 [&_[data-slot=dialog-close]]:hover:text-white",
          showRestricted && "border-border bg-background p-0 text-foreground",
        )}
      >
        {showLinkOnly && isPublico ? (
          <>
            <DialogHeader className="space-y-1 border-b border-white/10 px-6 pt-6 pb-4 text-left">
              <DialogTitle className="text-lg font-semibold text-white">
                Compartilhar &quot;{groupInfo?.nome ?? "Chamada"}&quot;
              </DialogTitle>
              <DialogDescription className="sr-only">
                Copiar link da chamada
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-6 pt-2">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
                  Pessoas com acesso
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-white">
                    {ownerInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {userLabel} (você)
                    </p>
                    <p className="text-xs text-slate-400">Proprietário</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
                  Acesso geral
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-2.5">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  <Select
                    value={acessoGeral}
                    onValueChange={(v) => setAcessoGeral(v as AcessoGeral)}
                  >
                    <SelectTrigger className="h-auto min-h-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-white shadow-none focus:ring-0 [&>svg]:text-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-zinc-900 text-slate-100">
                      <SelectItem value="qualquer_com_link">
                        Qualquer pessoa com link
                      </SelectItem>
                      <SelectItem value="restrito">Restrito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Qualquer pessoa na Internet com o link pode abrir a página da
                  chamada (conta UFAM Hub necessária para entrar na sala).
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-white/30 bg-transparent py-6 text-white hover:bg-white/10"
                onClick={copyLink}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copiar link
              </Button>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl bg-slate-200 px-8 font-medium text-zinc-900 hover:bg-white"
                >
                  Concluído
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-1 border-b border-border px-6 pt-6 pb-4 text-left">
              <div className="mb-2 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted shadow-sm dark:bg-slate-800">
                  <Link2 className="h-7 w-7 text-muted-foreground" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl font-semibold">
                Compartilhar chamada
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {!isPublico
                  ? "Grupo privado: você só pode compartilhar o link com membros do grupo."
                  : "Escolha quem deve receber o link entre os membros."}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[55vh] space-y-5 overflow-y-auto px-6 py-5">
              {isPublico && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Modo de compartilhamento
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Select
                      value={acessoGeral}
                      onValueChange={(v) => setAcessoGeral(v as AcessoGeral)}
                    >
                      <SelectTrigger className="h-auto flex-1 border-0 bg-transparent shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qualquer_com_link">
                          Qualquer pessoa com link
                        </SelectItem>
                        <SelectItem value="restrito">Restrito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Seu link
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 pr-1 dark:bg-slate-800/80">
                  <p className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">
                    {callLink || "…"}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0 rounded-lg"
                    onClick={copyLink}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4" />
                  Membros do grupo
                </p>
                {loadingMembros ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Carregando…
                  </p>
                ) : membros.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm font-medium text-foreground/80">
                    Nenhum membro encontrado.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {membros.map((m) => {
                      const selected = selectedIds.has(m.user_id);
                      const name = nomeMembro(m);
                      const initial = name.charAt(0).toUpperCase();
                      const isSelf = currentUserId === m.user_id;
                      const bg = hashPick(m.user_id, AVATAR_BG);
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() => toggleMember(m.user_id)}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center transition-colors",
                            selected
                              ? "border-blue-500 bg-blue-500/10 dark:border-blue-400 dark:bg-blue-950/40"
                              : "border-transparent bg-muted/30 hover:bg-muted/50 dark:bg-slate-800/50",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold",
                              bg,
                            )}
                          >
                            {initial}
                          </span>
                          {selected && (
                            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow dark:bg-blue-500">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                          <span className="line-clamp-2 w-full text-[11px] font-medium leading-tight text-foreground sm:text-xs">
                            {isSelf ? "Você" : name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isPublico && groupInfo && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-950 dark:text-amber-100">
                  Grupo privado: o link só deve ser enviado a membros. Quem não
                  está no grupo não consegue acessar.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-6 py-4 dark:bg-slate-900/50">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl font-semibold"
                disabled={
                  loadingMembros ||
                  membros.length === 0 ||
                  selectedIds.size === 0
                }
                onClick={handleEnviarCompartilhamento}
              >
                Copiar link e concluir
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              {isPublico && (
                <Button variant="link" className="text-xs" asChild>
                  <Link href={`/grupos/${groupInfo?.id ?? ""}`}>
                    Gerenciar grupo
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
