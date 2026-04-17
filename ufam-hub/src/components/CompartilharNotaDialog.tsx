"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Link2,
  Check,
  Users,
  Shield,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Vis = "publico" | "geral" | "privado";

interface CompartilharNotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notaId: string;
  disciplinaId?: string;
  tituloNota: string;
}

type CompartilhadaRow = {
  id: string;
  nota_id: string;
  link_compartilhamento: string;
  visibilidade: Vis;
  email_permitido?: string | null;
  codigo_acesso?: string | null;
  permite_comentarios?: boolean;
  permite_download?: boolean;
};

/** Só dois modos na UI: convidados (geral) ou link aberto (publico). */
function visToMode(v: Vis): "invited" | "link" {
  if (v === "geral") return "invited";
  return "link";
}

function modeToVis(m: "invited" | "link"): Vis {
  if (m === "invited") return "geral";
  return "publico";
}

export function CompartilharNotaDialog({
  open,
  onOpenChange,
  notaId,
  disciplinaId,
  tituloNota,
}: CompartilharNotaDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [compartilhada, setCompartilhada] = React.useState<CompartilhadaRow | null>(
    null,
  );
  const [link, setLink] = React.useState<string | null>(null);

  const [generalMode, setGeneralMode] = React.useState<"invited" | "link">("link");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"view" | "edit">("view");
  const [ownerName, setOwnerName] = React.useState("Você");
  const [ownerEmail, setOwnerEmail] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [peopleSearch, setPeopleSearch] = React.useState("");

  const load = React.useCallback(async () => {
    if (!notaId) return;
    setLoading(true);
    try {
      const [shareRes, profileRes] = await Promise.all([
        fetch(`/api/colaboracao/compartilhar?nota_id=${encodeURIComponent(notaId)}`),
        fetch("/api/profile"),
      ]);
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        const nome =
          profile?.nome ||
          profile?.email?.split("@")[0] ||
          "Você";
        setOwnerName(nome);
        setOwnerEmail(profile?.email || "");
      }
      if (shareRes.ok) {
        const data = await shareRes.json();
        if (data.compartilhada) {
          setCompartilhada(data.compartilhada);
          setLink(data.link || null);
          setGeneralMode(visToMode(data.compartilhada.visibilidade as Vis));
        } else {
          setCompartilhada(null);
          setLink(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [notaId]);

  React.useEffect(() => {
    if (open && notaId) {
      load();
    }
  }, [open, notaId, load]);

  const shortLink = React.useMemo(() => {
    if (!link) return "";
    try {
      const u = new URL(link);
      return `${u.host}${u.pathname}`;
    } catch {
      return link.slice(0, 48) + (link.length > 48 ? "…" : "");
    }
  }, [link]);

  const ensureShare = async (vis: Vis, email?: string | null) => {
    const body = {
      nota_id: notaId,
      disciplina_id: disciplinaId || null,
      titulo: tituloNota.trim() || "Anotação",
      descricao: null as string | null,
      visibilidade: vis,
      email_permitido: vis === "geral" && email ? email : null,
      permite_comentarios: true,
      permite_download: true,
    };
    const res = await fetch("/api/colaboracao/compartilhar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Erro ao compartilhar");
    setCompartilhada(data.compartilhada);
    setLink(data.link);
    return data;
  };

  /** Cria ou atualiza sempre via POST (o servidor trata registro já existente). */
  const applyGeneralAccess = async () => {
    const vis = modeToVis(generalMode);
    const emailGeral =
      vis === "geral"
        ? inviteEmail.trim() || compartilhada?.email_permitido || null
        : null;
    if (vis === "geral" && !emailGeral) {
      toast.error(
        "Informe um e-mail (acima ou no campo Convidar) ou escolha «Qualquer pessoa com o link».",
      );
      return;
    }
    setSaving(true);
    try {
      await ensureShare(vis, emailGeral);
      toast.success(
        vis === "geral"
          ? compartilhada
            ? "Acesso de convidados atualizado."
            : "Convite registrado."
          : compartilhada
            ? "Link público atualizado."
            : "Link público criado.",
      );
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Digite um e-mail.");
      return;
    }
    if (inviteRole === "edit") {
      toast.info("Coedição em breve. Por enquanto apenas visualização está disponível.");
      return;
    }
    setSaving(true);
    try {
      setGeneralMode("invited");
      await ensureShare("geral", inviteEmail.trim());
      toast.success(
        "Pronto. Só esse e-mail (logado na plataforma) poderá abrir pelo link.",
      );
      setInviteEmail("");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao convidar");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setCopied(false);
        setInviteEmail("");
        setPeopleSearch("");
      }, 200);
    }
  };

  const peopleRows = React.useMemo(() => {
    const rows: { id: string; title: string; subtitle: string; role: string }[] =
      [
        {
          id: "owner",
          title: ownerName,
          subtitle: ownerEmail,
          role: "Proprietário",
        },
      ];
    if (compartilhada?.email_permitido) {
      rows.push({
        id: "guest",
        title: "Convidado",
        subtitle: compartilhada.email_permitido,
        role: "Pode ver",
      });
    }
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
  }, [ownerName, ownerEmail, compartilhada?.email_permitido, peopleSearch]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,760px)] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl",
          "sm:max-w-xl sm:w-full",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 pr-12 text-left sm:px-6 sm:py-5 sm:pr-14">
          <DialogTitle className="text-base font-semibold leading-snug sm:text-lg">
            Compartilhar &quot;{tituloNota || "Anotação"}&quot;
          </DialogTitle>
          <DialogDescription className="sr-only">
            Defina quem pode acessar esta anotação pelo link
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Acesso geral — sempre visível para alternar o modo */}
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acesso geral
                </p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setGeneralMode("invited")}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors sm:p-4",
                      generalMode === "invited"
                        ? "border-primary/40 bg-primary/10 ring-1 ring-inset ring-primary/20"
                        : "border-border bg-muted/20 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        Apenas convidados
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Convide por e-mail e defina a permissão. Sem link público.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneralMode("link")}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors sm:p-4",
                      generalMode === "link"
                        ? "border-primary/40 bg-primary/10 ring-1 ring-inset ring-primary/20"
                        : "border-border bg-muted/20 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        Qualquer pessoa com o link
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Qualquer pessoa com o link pode ver na página pública de
                        compartilhamento (sem precisar estar logado).
                      </p>
                    </div>
                  </button>
                </div>
                {compartilhada?.visibilidade === "privado" && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
                    Esta nota ainda usa o modo antigo com código. Escolha um dos
                    modos acima e toque em &quot;Aplicar&quot; para substituir.
                  </p>
                )}
              </section>

              {generalMode === "invited" && (
                <>
                  <div className="h-px bg-border" />

                  {/* Convidar por e-mail */}
                  <section className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <Input
                        placeholder="E-mail do convidado"
                        type="email"
                        autoComplete="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="h-11 min-w-0 rounded-xl border-border bg-muted/30 sm:flex-1"
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      />
                      <div className="flex gap-2 sm:shrink-0">
                        <Select
                          value={inviteRole}
                          onValueChange={(v) => setInviteRole(v as "view" | "edit")}
                        >
                          <SelectTrigger className="h-11 min-w-[7.5rem] flex-1 rounded-xl border-border sm:w-[124px] sm:flex-none">
                            <SelectValue placeholder="Permissão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">Pode ver</SelectItem>
                            <SelectItem value="edit">Pode editar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="h-11 shrink-0 rounded-xl px-4 font-medium whitespace-nowrap sm:px-5"
                          onClick={handleInvite}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Convidar"
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &quot;Pode editar&quot; (coedição) virá em uma versão futura.
                    </p>
                  </section>

                  <div className="h-px bg-border" />

                  {/* Pessoas com acesso */}
                  <section className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pessoas com acesso
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Quem pode abrir esta anotação com o e-mail logado na plataforma.
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou e-mail…"
                        value={peopleSearch}
                        onChange={(e) => setPeopleSearch(e.target.value)}
                        className="h-10 rounded-xl border-border bg-muted/20 pl-9"
                      />
                    </div>
                    <ul className="space-y-2">
                      {peopleRows.length === 0 ? (
                        <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                          Nenhum resultado para essa busca.
                        </li>
                      ) : (
                        peopleRows.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-col gap-2 rounded-xl border border-border bg-muted/15 px-3 py-3 sm:flex-row sm:items-center sm:gap-3"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback
                                  className={cn(
                                    "text-xs",
                                    row.id === "owner" &&
                                      "bg-primary/15 text-primary",
                                  )}
                                >
                                  {row.id === "owner"
                                    ? ownerName.slice(0, 2).toUpperCase()
                                    : (row.subtitle || row.title)
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {row.title}
                                </p>
                                {row.subtitle && (
                                  <p className="break-all text-xs text-muted-foreground">
                                    {row.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              className={cn(
                                "flex shrink-0 items-center gap-1.5 self-start sm:self-center sm:pl-0 pl-12",
                                row.id === "owner"
                                  ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                  : "text-xs text-muted-foreground",
                              )}
                            >
                              {row.id === "owner" ? (
                                <>
                                  <Shield className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">{row.role}</span>
                                </>
                              ) : (
                                <span className="whitespace-nowrap">{row.role}</span>
                              )}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </section>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl"
                    disabled={saving}
                    onClick={applyGeneralAccess}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : compartilhada ? (
                      "Aplicar acesso geral"
                    ) : (
                      "Criar convite com este acesso"
                    )}
                  </Button>
                </>
              )}

              {generalMode === "link" && (
                <>
                  <div className="h-px bg-border" />
                  <section className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Link de compartilhamento
                    </p>
                    {compartilhada?.visibilidade === "geral" && (
                      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
                        O acesso ainda está em &quot;Apenas convidados&quot;. Use
                        &quot;Gerar link público&quot; para permitir qualquer pessoa com o
                        link.
                      </p>
                    )}
                    {link ? (
                      <p
                        className={cn(
                          "break-all font-mono text-[11px] leading-relaxed sm:text-xs",
                          compartilhada?.visibilidade === "geral"
                            ? "text-muted-foreground"
                            : "text-foreground",
                        )}
                        title={link}
                      >
                        {shortLink}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ainda não há link público. Toque em &quot;Aplicar&quot; abaixo
                        para gerar o link com acesso aberto.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full rounded-xl"
                      disabled={saving}
                      onClick={applyGeneralAccess}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : compartilhada?.visibilidade === "publico" ? (
                        "Atualizar configuração do link"
                      ) : (
                        "Gerar link público"
                      )}
                    </Button>
                  </section>
                </>
              )}
            </>
          )}
        </div>

        {/* Rodapé: no modo convidados só fecha; no modo link, copiar + concluir */}
        <div className="shrink-0 border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {generalMode === "link" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-border bg-background"
                disabled={!link || loading}
                onClick={copyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Copiar link
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="rounded-full px-5"
              onClick={() => handleClose(false)}
            >
              Concluído
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
