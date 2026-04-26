"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Info,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  UserRound,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MSG_MAX = 200;

/** URL pública de cadastro (convite por link). */
export function getCadastroConvidadoUrl(): string {
  if (typeof window === "undefined") {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "";
    return base
      ? `${base.replace(/\/$/, "")}/cadastro-convidado`
      : "";
  }
  return `${window.location.origin}/cadastro-convidado`;
}

export type InviteUserPanelProps = {
  nomeUsuario: string;
  onNomeUsuarioChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  mensagem: string;
  onMensagemChange: (v: string) => void;
  inviteLink: string;
  onSubmit: () => void;
  loading: boolean;
  locale: string;
  showCancel?: boolean;
  onCancel?: () => void;
  /** Título exibido (ex.: i18n conviteUsuario) */
  title: string;
  /** Subtítulo curto */
  subtitle: string;
  /** Sem padding extra no topo (útil dentro de Dialog que já tem close) */
  compactTop?: boolean;
};

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };
  return { copied, copy };
}

export function InviteUserPanel({
  nomeUsuario,
  onNomeUsuarioChange,
  email,
  onEmailChange,
  mensagem,
  onMensagemChange,
  inviteLink,
  onSubmit,
  loading,
  locale,
  showCancel,
  onCancel,
  title,
  subtitle,
  compactTop,
}: InviteUserPanelProps) {
  const pt = locale === "pt-BR";
  const { copied, copy } = useCopy();

  const copyLabel = pt ? "Copiar link" : "Copy link";

  const strings = useMemo(
    () =>
      pt
        ? {
            userLabel: "Nome de usuário",
            userPh: "ex.: joaosilva",
            userHelp: "Informe o nome de usuário da pessoa.",
            emailLabel: "E-mail",
            emailPh: "ex.: nome@ufam.edu.br",
            emailHelp:
              "Informe o e-mail da pessoa que você deseja convidar.",
            msgLabel: "Mensagem (opcional)",
            msgPh:
              "Oi! Estou te convidando para usar o UFAM Hub, uma plataforma para organizar sua vida acadêmica.",
            comoTitulo: "Como funciona?",
            comoTexto:
              "A pessoa convidada receberá um e-mail com instruções para criar a conta e acessar a plataforma.",
            linkTitulo: "Ou compartilhe o link de convite",
            linkSub:
              "Qualquer pessoa com o link poderá se cadastrar.",
            cancelar: "Cancelar",
            enviar: "Enviar convite",
          }
        : {
            userLabel: "Username",
            userPh: "e.g. johnsmith",
            userHelp: "Enter the person's username.",
            emailLabel: "Email",
            emailPh: "e.g. name@university.edu",
            emailHelp: "Enter the email of the person you want to invite.",
            msgLabel: "Message (optional)",
            msgPh:
              "Hi! I'm inviting you to use UFAM Hub to organize your academic life.",
            comoTitulo: "How does it work?",
            comoTexto:
              "The invitee will receive an email with instructions to create an account and access the platform.",
            linkTitulo: "Or share the invite link",
            linkSub: "Anyone with the link can sign up.",
            cancelar: "Cancel",
            enviar: "Send invite",
          },
    [pt]
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card text-card-foreground shadow-lg",
          "dark:border-[#262626] dark:bg-[#101010] dark:text-[#F5F5F5]"
        )}
      >
        <div
          className={cn(
            "border-b border-border/60 px-5 pb-4 pt-5 dark:border-[#262626]",
            compactTop && "pt-4"
          )}
        >
          <div className="flex gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#05865E]/15 ring-1 ring-[#05865E]/35"
              aria-hidden
            >
              <UserPlus className="h-6 w-6 text-[#05865E]" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-[#F5F5F5]">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground dark:text-[#A3A3A3]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="space-y-2">
            <Label
              htmlFor="invite-panel-user"
              className="text-sm font-medium text-foreground dark:text-[#E5E5E5]"
            >
              {strings.userLabel}{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-[#737373]" />
              <Input
                id="invite-panel-user"
                value={nomeUsuario}
                onChange={(e) => onNomeUsuarioChange(e.target.value)}
                placeholder={strings.userPh}
                autoComplete="username"
                className={cn(
                  "h-11 border-border/80 pl-10 dark:border-[#262626] dark:bg-[#151515] dark:text-[#F5F5F5] dark:placeholder:text-[#737373]"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground dark:text-[#A3A3A3]">
              {strings.userHelp}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-panel-email"
              className="text-sm font-medium text-foreground dark:text-[#E5E5E5]"
            >
              {strings.emailLabel}{" "}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-[#737373]" />
              <Input
                id="invite-panel-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder={strings.emailPh}
                autoComplete="email"
                className={cn(
                  "h-11 border-border/80 pl-10 dark:border-[#262626] dark:bg-[#151515] dark:text-[#F5F5F5] dark:placeholder:text-[#737373]"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground dark:text-[#A3A3A3]">
              {strings.emailHelp}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="invite-panel-msg"
              className="text-sm font-medium text-foreground dark:text-[#E5E5E5]"
            >
              {strings.msgLabel}
            </Label>
            <div className="relative">
              <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-[#737373]" />
              <Textarea
                id="invite-panel-msg"
                value={mensagem}
                onChange={(e) =>
                  onMensagemChange(e.target.value.slice(0, MSG_MAX))
                }
                placeholder={strings.msgPh}
                rows={4}
                className={cn(
                  "min-h-[100px] resize-y border-border/80 pl-10 pt-3 dark:border-[#262626] dark:bg-[#151515] dark:text-[#F5F5F5] dark:placeholder:text-[#737373]"
                )}
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground dark:text-[#737373]">
                {mensagem.length}/{MSG_MAX}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "flex gap-3 rounded-xl border border-[#05865E]/25 bg-[#05865E]/[0.08] p-4",
              "dark:border-[#05865E]/30 dark:bg-[#05865E]/10"
            )}
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#05865E]" />
            <div>
              <p className="text-sm font-medium text-[#05865E]">
                {strings.comoTitulo}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-[#A3A3A3]">
                {strings.comoTexto}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            {showCancel && onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="h-11 rounded-xl border-border/80 dark:border-[#333] dark:bg-transparent dark:text-[#F5F5F5] dark:hover:bg-[#1a1a1a]"
              >
                {strings.cancelar}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="h-11 gap-2 rounded-xl bg-[#05865E] px-5 text-white shadow-md shadow-[#05865E]/20 hover:bg-[#047a52]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {strings.enviar}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-md",
          "dark:border-[#262626] dark:bg-[#121212] dark:text-[#F5F5F5]"
        )}
      >
        <p className="text-sm font-medium text-foreground dark:text-[#F5F5F5]">
          {strings.linkTitulo}
        </p>
        <p className="mt-1 text-xs text-muted-foreground dark:text-[#A3A3A3]">
          {strings.linkSub}
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            readOnly
            value={inviteLink}
            className="h-11 flex-1 border-border/80 font-mono text-xs dark:border-[#262626] dark:bg-[#151515] dark:text-[#E5E5E5]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl border-[#05865E]/40 text-[#05865E] hover:bg-[#05865E]/10 dark:border-[#05865E]/45"
            onClick={() => copy(inviteLink)}
            title={copyLabel}
            aria-label={copyLabel}
          >
            <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
          </Button>
        </div>
      </div>
    </div>
  );
}
