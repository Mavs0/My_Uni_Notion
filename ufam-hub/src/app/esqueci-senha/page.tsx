"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Shield,
  Zap,
  MousePointerClick,
} from "lucide-react";
import {
  AuthModernShell,
  LOGIN_GREEN,
  LOGIN_GLOW,
  type AuthMascotMode,
  type AuthModernFeature,
  type MascotFocus,
} from "@/components/auth/login-modern";
import { cn } from "@/lib/utils";

const FORGOT_FEATURES: AuthModernFeature[] = [
  {
    Icon: Shield,
    title: "Seguro",
    subtitle:
      "Conexão criptografada e boas práticas de segurança no envio do link.",
  },
  {
    Icon: Zap,
    title: "Rápido",
    subtitle:
      "Você recebe o e-mail em instantes — verifique também o spam.",
  },
  {
    Icon: MousePointerClick,
    title: "Fácil",
    subtitle: "Abra o link, defina uma nova senha e volte ao Hub.",
  },
];

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const mascotFocus: MascotFocus = emailFocused ? "email" : null;

  const mascotMode: AuthMascotMode = useMemo(() => {
    if (success) return "success";
    if (loading) return "loading";
    if (error) return "error";
    if (emailFocused) return "focus-email";
    return "idle";
  }, [success, loading, error, emailFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!email.trim()) {
      setError("O e-mail é obrigatório");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("E-mail inválido");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/resetar-senha`,
        },
      );
      if (resetError) {
        let errorMessage = resetError.message;
        if (resetError.message.includes("rate limit")) {
          errorMessage =
            "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (resetError.message.includes("not found")) {
          errorMessage =
            "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.";
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao solicitar reset de senha:", err);
      setError("Erro ao processar o pedido. Tente novamente mais tarde.");
      setLoading(false);
    }
  };

  return (
    <AuthModernShell
      eyebrow={
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(5,134,94,0.35)] bg-[rgba(5,134,94,0.12)] px-4 py-2 text-sm font-medium text-[#fafafa]">
          <Lock className="h-4 w-4" style={{ color: LOGIN_GREEN }} aria-hidden />
          Recuperação de senha
        </span>
      }
      title={
        <>
          Recupere seu{" "}
          <span style={{ color: LOGIN_GREEN }} className="font-semibold">
            acesso
          </span>{" "}
          rapidamente
        </>
      }
      description="Informe seu e-mail e enviaremos um link seguro para redefinir sua senha. O processo é rápido e simples."
      features={FORGOT_FEATURES}
      speechBubble={{
        default: "Vamos te ajudar a voltar o quanto antes! 🚀",
      }}
      mascotMode={mascotMode}
      mascotFocus={mascotFocus}
      mascotAttentionDisabled={loading || success}
      topSlots={
        <div className="flex w-full justify-end">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
            style={{ color: LOGIN_GREEN }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Voltar para o login
          </Link>
        </div>
      }
      leftFooter={
        <div
          className="flex items-start gap-2.5 text-[11px] leading-relaxed sm:text-xs"
          style={{ color: "rgba(250,250,250,0.5)" }}
        >
          <Lock
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            style={{ color: LOGIN_GREEN }}
            aria-hidden
          />
          <span>Seus dados estão protegidos com segurança avançada.</span>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[400px] space-y-6 lg:max-w-[380px]">
        <Card className="rounded-2xl border border-white/10 bg-[rgba(18,18,18,0.55)] shadow-xl backdrop-blur-xl dark:border-white/10">
          <CardHeader className="space-y-2 pb-6">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(5,134,94,0.45)] bg-[rgba(5,134,94,0.15)] shadow-[0_0_24px_rgba(5,134,94,0.12)]">
              <Mail className="h-7 w-7" style={{ color: LOGIN_GREEN }} aria-hidden />
            </div>
            <CardTitle className="text-center text-3xl font-bold tracking-tight text-foreground">
              Esqueci minha{" "}
              <span style={{ color: LOGIN_GREEN }} className="font-semibold">
                senha
              </span>
            </CardTitle>
            <CardDescription className="text-center text-base text-muted-foreground">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 font-semibold text-emerald-100">
                        E-mail enviado!
                      </h3>
                      <p className="text-sm leading-relaxed text-emerald-100/90">
                        Se o e-mail <strong>{email}</strong> estiver cadastrado,
                        você receberá um link para redefinir sua senha.
                        Verifique a caixa de entrada e a pasta de spam.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="h-11 w-full border-white/15 bg-transparent"
                  >
                    Enviar outro email
                  </Button>
                  <Button asChild variant="ghost" className="h-11 w-full">
                    <Link href="/login">Voltar para o login</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div
                    className="flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm"
                    style={{
                      borderColor: "rgba(255,77,77,0.35)",
                      background: "rgba(255,77,77,0.08)",
                      color: "#FF4D4D",
                    }}
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                      className="h-11 pl-11"
                      disabled={loading}
                    />
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex h-[52px] w-full items-center gap-3 rounded-xl px-5 text-[15px] font-semibold text-white transition-shadow disabled:opacity-60",
                    loading ? "justify-center" : "justify-between",
                  )}
                  style={{
                    background: LOGIN_GREEN,
                    boxShadow: `0 0 24px ${LOGIN_GLOW}`,
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:justify-start">
                    {loading ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    ) : null}
                    {loading ? "Enviando…" : "Enviar link de recuperação"}
                  </span>
                  {!loading ? (
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25"
                      aria-hidden
                    >
                      <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                  ) : null}
                </motion.button>

                <div className="relative py-1">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
                  <span className="relative mx-auto block w-fit bg-[rgba(18,18,18,0.92)] px-3 text-xs tracking-wide text-muted-foreground">
                    ou
                  </span>
                </div>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthModernShell>
  );
}
