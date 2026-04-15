"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Lock,
  UserRound,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

function CadastroConvidadoForm() {
  const router = useRouter();
  const [initLoading, setInitLoading] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sessionResolvedRef = useRef(false);

  const passwordRules = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const passwordValid =
    passwordRules.minLength &&
    passwordRules.hasNumber &&
    passwordRules.hasUppercase &&
    passwordRules.hasSpecial;

  const applyUser = useCallback((u: User) => {
    if (sessionResolvedRef.current) return;
    sessionResolvedRef.current = true;
    setUser(u);
    const meta = u.user_metadata || {};
    setNome(
      (meta.nome as string) ||
        (meta.full_name as string) ||
        (meta.name as string) ||
        "",
    );
    setSessionOk(true);
    setInitError(null);
    setInitLoading(false);
  }, []);

  const tryLoadSession = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    if (typeof window === "undefined") return;

    const href = window.location.href;
    const url = new URL(href);
    if (url.searchParams.get("code")) {
      const { error } = await supabase.auth.exchangeCodeForSession(href);
      if (error) {
        console.error("exchangeCodeForSession:", error);
      }
      window.history.replaceState({}, "", "/cadastro-convidado");
    }

    const readSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    };

    for (let i = 0; i < 5 && !sessionResolvedRef.current; i++) {
      const session = await readSession();
      if (session?.user) {
        applyUser(session.user);
        return;
      }
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }

    if (!sessionResolvedRef.current) {
      setSessionOk(false);
      setInitError(
        "Não foi possível validar o convite. O link pode ter expirado ou já foi usado. Peça um novo convite ou faça login se já tiver conta.",
      );
      setInitLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) return;
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED"
      ) {
        applyUser(session.user);
      }
    });
    void tryLoadSession();
    return () => subscription.unsubscribe();
  }, [tryLoadSession, applyUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;

    if (!nome.trim() || nome.trim().length < 2) {
      toast.error("Informe seu nome (mínimo 2 caracteres).");
      return;
    }
    if (!passwordValid) {
      toast.error("A senha não atende a todos os requisitos.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowser();
    const email = user.email;

    try {
      const { error: upErr } = await supabase.auth.updateUser({
        password,
        data: {
          nome: nome.trim(),
          full_name: nome.trim(),
          curso: curso.trim() || "",
          periodo: periodo.trim() || "",
        },
      });

      if (upErr) {
        toast.error(upErr.message || "Erro ao salvar cadastro.");
        setSubmitting(false);
        return;
      }

      await supabase.auth.signOut();
      toast.success("Cadastro concluído! Faça login com sua nova senha.");
      router.push(
        `/login?from=convite&email=${encodeURIComponent(email)}`,
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (initLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Validando seu convite…
        </p>
      </div>
    );
  }

  if (!sessionOk) {
    return (
      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <div className="absolute right-4 top-4">
          <ThemeToggle syncThemeToServer={false} />
        </div>
        <AuthHeader />
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <XCircle className="mx-auto mb-2 h-12 w-12 text-destructive" />
              <CardTitle>Convite inválido ou expirado</CardTitle>
              <CardDescription>{initError}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/login">Ir para login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Início</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle syncThemeToServer={false} />
      </div>
      <AuthHeader />
      <div className="flex flex-1 items-center justify-center py-8">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">
              Bem-vindo ao UFAM Hub
            </CardTitle>
            <CardDescription className="text-center">
              Você foi convidado. Confirme seus dados e defina uma{" "}
              <strong>nova senha</strong> para acessar a plataforma. Depois,
              use essa senha na tela de login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="convite-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="convite-email"
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="bg-muted/50 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-nome">Nome completo</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="convite-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-9"
                    placeholder="Seu nome"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="convite-curso">Curso (opcional)</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="convite-curso"
                      value={curso}
                      onChange={(e) => setCurso(e.target.value)}
                      className="pl-9"
                      placeholder="Ex.: Engenharia"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="convite-periodo">Período (opcional)</Label>
                  <Input
                    id="convite-periodo"
                    type="number"
                    min={1}
                    max={20}
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    placeholder="Ex.: 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-senha">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="convite-senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li className={passwordRules.minLength ? "text-emerald-600" : ""}>
                    Mínimo 6 caracteres
                  </li>
                  <li className={passwordRules.hasNumber ? "text-emerald-600" : ""}>
                    Pelo menos um número
                  </li>
                  <li className={passwordRules.hasUppercase ? "text-emerald-600" : ""}>
                    Pelo menos uma maiúscula
                  </li>
                  <li className={passwordRules.hasSpecial ? "text-emerald-600" : ""}>
                    Pelo menos um caractere especial
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convite-confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="convite-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !passwordValid}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Concluir cadastro e ir para o login"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/login" className="font-medium text-primary underline">
                  Fazer login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CadastroConvidadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <CadastroConvidadoForm />
    </Suspense>
  );
}
