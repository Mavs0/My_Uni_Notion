"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { shrinkJwtByStrippingInlineAvatarClient } from "@/lib/profile/avatar-metadata-client";
import { markPostLoginNavigation } from "@/lib/auth/post-login-grace";
import {
  runClientSupabaseCookieSweepIfNeeded,
  clearSupabaseCookieSweepCounter,
  sweepAllSupabaseCookiesFromDocument,
} from "@/lib/supabase/cookie-emergency-client";
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
  Lock,
  GraduationCap,
  AlertCircle,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ErrorMessage } from "@/components/ui/error-message";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TypewriterText } from "@/components/ui/typewriter-text";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = (() => {
    const r = searchParams.get("redirect");
    if (!r || !r.startsWith("/") || r.startsWith("//")) return "/dashboard";
    return r;
  })();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [curso, setCurso] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    curso?: string;
    periodo?: string;
  }>({});
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [signupStep, setSignupStep] = useState(1);

  useEffect(() => {
    const signup = searchParams.get("signup");
    const emailParam = searchParams.get("email");
    const fromConvite = searchParams.get("from") === "convite";

    if (fromConvite) {
      setIsLogin(true);
      setMessage(
        "Cadastro de convidado concluído. Entre com o mesmo e-mail e a nova senha que você definiu.",
      );
      if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
        setEmail(decodeURIComponent(emailParam));
      }
      return;
    }

    if (signup === "1") {
      setIsLogin(false);
      if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
        setEmail(decodeURIComponent(emailParam));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    /* Cabeçalho Cookie gigante: o sweep no cliente não apaga HttpOnly; pedidos a
     * /api/auth/session continuam a falhar ou o middleware volta a meter cookie_limit.
     * Este endpoint ignora o limite de emergência e limpa sb-* no servidor + Clear-Site-Data. */
    if (searchParams.get("reason") === "cookie_limit") {
      const qs = new URLSearchParams();
      const r = searchParams.get("redirect");
      if (r && r.startsWith("/") && !r.startsWith("//")) {
        qs.set("redirect", r);
      }
      window.location.replace(
        `/api/auth/force-clear-session${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      return;
    }

    runClientSupabaseCookieSweepIfNeeded();

    const checkAuth = async () => {
      // Fonte de verdade = API (cookies no servidor).
      // /api/auth/session devolve 200 + { authenticated } — evita 401 no console ao visitar /login.
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json()) as { authenticated?: boolean };
      if (body.authenticated) {
        markPostLoginNavigation();
        router.push(redirectTo);
        return;
      }
      /* Não fazer signOut() aqui: se o servidor ainda não vê os cookies (corrida/HMR)
       * mas o cliente tem sessão, signOut apagava tudo e parecia “impossível entrar”. */
    };
    checkAuth();
  }, [router, redirectTo, searchParams]);

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

  const validateStep1 = () => {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) {
      errors.name = "Nome completo é obrigatório";
    } else if (name.trim().length < 3) {
      errors.name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (
      periodo &&
      (isNaN(Number(periodo)) || Number(periodo) < 1 || Number(periodo) > 20)
    ) {
      errors.periodo = "Período deve ser um número entre 1 e 20";
    }
    if (!email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email inválido";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    if (!isLogin) {
      if (!name.trim()) {
        errors.name = "Nome completo é obrigatório";
      } else if (name.trim().length < 3) {
        errors.name = "Nome deve ter pelo menos 3 caracteres";
      }
      if (
        periodo &&
        (isNaN(Number(periodo)) || Number(periodo) < 1 || Number(periodo) > 20)
      ) {
        errors.periodo = "Período deve ser um número entre 1 e 20";
      }
    }
    if (!email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email inválido";
    }
    if (!isLogin) {
      if (!password) {
        errors.password = "Senha é obrigatória";
      } else if (!passwordValid) {
        errors.password = "A senha não atende aos requisitos";
      }
      if (!confirmPassword) {
        errors.confirmPassword = "Confirmar senha é obrigatório";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "As senhas não coincidem";
      }
    } else {
      if (!password) {
        errors.password = "Senha é obrigatória";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldErrors({});
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowser();
    try {
      if (isLogin) {
        /* Login no servidor primeiro: remove avatar/base64 pesado do JWT antes dos
         * cookies ficarem estáveis (evita só conseguir «limpar sessão» em loop). */
        try {
          const serverRes = await fetch("/api/auth/sign-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email,
              password,
              redirect: redirectTo,
            }),
          });
          const serverJson = (await serverRes.json().catch(() => ({}))) as {
            ok?: boolean;
            redirect?: string;
            needsClientFallback?: boolean;
            error?: string;
          };

          if (serverRes.ok && serverJson.ok === true) {
            clearSupabaseCookieSweepCounter();
            try {
              if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem("ufam-avatar-inline-check", "1");
              }
            } catch {
              /* ignore */
            }
            markPostLoginNavigation();
            const dest =
              typeof serverJson.redirect === "string" &&
              serverJson.redirect.startsWith("/")
                ? serverJson.redirect
                : redirectTo;
            window.location.assign(dest);
            return;
          }

          if (serverRes.status === 401 && serverJson.error) {
            setError(serverJson.error);
            setLoading(false);
            return;
          }
          if (serverRes.status === 429) {
            setError(
              serverJson.error ||
                "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
            );
            setLoading(false);
            return;
          }
          if (serverRes.status === 500 && serverJson.error) {
            setError(serverJson.error);
            setLoading(false);
            return;
          }
          if (
            !serverRes.ok &&
            serverJson.error &&
            !serverJson.needsClientFallback
          ) {
            setError(serverJson.error);
            setLoading(false);
            return;
          }
          /* 200 + needsClientFallback (MFA, etc.) ou falha de rede → fluxo cliente. */
        } catch {
          /* rede: continua para signIn no browser */
        }

        let signInError: any = null;
        let data: any = null;

        try {
          const result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          data = result.data;
          signInError = result.error;
        } catch (networkError: any) {
          const errorMessage =
            networkError?.message || String(networkError || "");

          if (
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("ERR_NAME_NOT_RESOLVED") ||
            errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
            errorMessage.includes("NetworkError") ||
            networkError?.name === "TypeError"
          ) {
            setError(
              "Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, pode ser necessário limpar os cookies do navegador.",
            );
            setLoading(false);
            return;
          }

          signInError = {
            message: errorMessage || "Erro ao conectar com o servidor",
          };
        }

        if (signInError) {
          let errorMessage = signInError.message || "Erro desconhecido";

          if (
            errorMessage.includes("431") ||
            errorMessage.includes("Header Fields Too Large") ||
            errorMessage.includes("Request header fields too large")
          ) {
            errorMessage =
              "Cookies da sessão excederam o limite (431). A limpar cookies Supabase…";
            try {
              sweepAllSupabaseCookiesFromDocument();
              await fetch("/api/auth/cleanup-cookies?reset=1", {
                method: "POST",
                credentials: "include",
              }).catch(() => {});
              const chatThreads = localStorage.getItem("chatThreads:v1");
              if (chatThreads && chatThreads.length > 50000) {
                localStorage.removeItem("chatThreads:v1");
              }
              setTimeout(() => {
                window.location.reload();
              }, 400);
            } catch (cleanupError) {
              console.error("Erro ao limpar cookies:", cleanupError);
            }
          } else if (errorMessage.includes("Invalid login credentials")) {
            errorMessage =
              "Email ou senha incorretos. Verifique suas credenciais.";
          } else if (signInError.message.includes("Email not confirmed")) {
            errorMessage =
              "Email não confirmado. Verifique sua caixa de entrada.";
          } else if (signInError.message.includes("Too many requests")) {
            errorMessage =
              "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        if (data.session) {
          clearSupabaseCookieSweepCounter();
          try {
            await shrinkJwtByStrippingInlineAvatarClient(
              supabase,
              data.session.user,
            );
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem("ufam-avatar-inline-check", "1");
            }
          } catch {
            /* ignore — updateUser pode falhar com JWT gigante */
          }
          // Navegação de seguida: não esperar mais trabalho async (evita erro visível
          // e reload estranho se o PUT a auth/v1/user falhar).
          markPostLoginNavigation();
          window.location.assign(redirectTo);
          return;
        } else {
          try {
            const { data: factorsData, error: factorsError } =
              await supabase.auth.mfa.listFactors();

            if (
              !factorsError &&
              factorsData?.totp &&
              factorsData.totp.length > 0
            ) {
              const factor = factorsData.totp[0];
              const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({
                  factorId: factor.id,
                });

              if (challengeError || !challengeData) {
                console.error("Erro ao criar challenge MFA:", challengeError);
                setError(
                  "Erro ao iniciar verificação 2FA. Tente novamente ou desative o 2FA temporariamente.",
                );
                setLoading(false);
                return;
              }

              setMfaFactorId(factor.id);
              setMfaChallengeId(challengeData.id);
              setShowMfaInput(true);
              setLoading(false);
              setMessage(null);
              setError(null);
              return;
            } else {
              setError(
                "Erro ao fazer login. Verifique suas credenciais. Se você tem 2FA ativado, certifique-se de que está configurado corretamente.",
              );
              setLoading(false);
            }
          } catch (mfaError: any) {
            console.error("Erro ao verificar MFA:", mfaError);
            setError(
              "Erro ao fazer login. Verifique suas credenciais ou tente novamente.",
            );
            setLoading(false);
          }
        }
      } else {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        const emailRedirectTo = baseUrl
          ? `${baseUrl.replace(/\/$/, "")}/auth/confirm`
          : undefined;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailRedirectTo || undefined,
            data: {
              nome: name,
              curso: curso || "",
              periodo: periodo || "",
            },
          },
        });
        if (signUpError) {
          let errorMessage = signUpError.message;
          if (signUpError.message.includes("User already registered")) {
            errorMessage = "Este email já está cadastrado. Tente fazer login.";
          } else if (
            signUpError.message.includes("Password should be at least")
          ) {
            errorMessage = "A senha deve ter pelo menos 6 caracteres.";
          } else if (signUpError.message.includes("Invalid email")) {
            errorMessage = "Email inválido. Verifique o formato do email.";
          } else if (
            signUpError.message.includes("Email rate limit exceeded")
          ) {
            errorMessage =
              "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }
        if (data.user) {
          if (data.session === null && data.user.email) {
            const confirmationLink = `${baseUrl.replace(/\/$/, "")}/auth/confirm?email=${encodeURIComponent(data.user.email)}`;
            try {
              await fetch("/api/auth/send-confirmation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: data.user.email,
                  nome: name || undefined,
                  confirmationLink: confirmationLink,
                }),
              });
            } catch (emailError) {
              console.error("Erro ao enviar email personalizado:", emailError);
            }
          }
          setMessage(
            "Conta criada com sucesso! Verifique seu email para confirmar sua conta.",
          );
          setTimeout(() => {
            setIsLogin(true);
            setEmail("");
            setPassword("");
            setName("");
            setCurso("");
            setPeriodo("");
            setMessage(null);
          }, 3000);
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || String(err || "");

      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_NAME_NOT_RESOLVED") ||
        errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
        errorMessage.includes("NetworkError") ||
        err?.name === "TypeError"
      ) {
        setError(
          "Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, pode ser necessário limpar os cookies do navegador.",
        );
      } else {
        setError(errorMessage || "Ocorreu um erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || !mfaFactorId || !mfaChallengeId) {
      setError("Digite o código de verificação");
      return;
    }

    setMfaVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/mfa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factorId: mfaFactorId,
          challengeId: mfaChallengeId,
          code: mfaCode.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          const supabase = createSupabaseBrowser();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (sessionError) {
            console.error("Erro ao definir sessão:", sessionError);
            setError("Erro ao completar login. Tente novamente.");
            return;
          }

          clearSupabaseCookieSweepCounter();
          try {
            const { data: sessWrap } = await supabase.auth.getSession();
            await shrinkJwtByStrippingInlineAvatarClient(
              supabase,
              sessWrap.session?.user,
            );
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem("ufam-avatar-inline-check", "1");
            }
          } catch {
            /* ignore */
          }
          markPostLoginNavigation();
          window.location.assign(redirectTo);
          return;
        } else {
          setError("Erro ao completar login. Tente novamente.");
        }
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Código inválido ou expirado. Tente novamente.",
        );
      }
    } catch (error) {
      console.error("Erro ao verificar código 2FA:", error);
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setMfaVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Ilustração/Info */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/95 to-zinc-950 lg:flex lg:flex-1">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-sm">
                <Sparkles className="h-4 w-4 text-amber-400/90" />
                <span className="text-sm font-medium tracking-tight">
                  Plataforma Acadêmica
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 xl:text-5xl">
                Organize seus estudos com{" "}
                <TypewriterText
                  text="inteligência"
                  className="text-zinc-50"
                  speed={120}
                  pauseBeforeErase={2800}
                  eraseSpeed={45}
                />
              </h1>
              <p className="max-w-md text-lg text-zinc-400">
                Gerencie disciplinas, avaliações, tarefas e muito mais em um só
                lugar. Potencializado por IA.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 pt-6">
              {[
                {
                  Icon: BookOpen,
                  title: "Gestão Completa",
                  desc: "Organize disciplinas, horários e materiais de estudo",
                },
                {
                  Icon: TrendingUp,
                  title: "Acompanhe Progresso",
                  desc: "Visualize estatísticas e métricas do seu desempenho",
                },
                {
                  Icon: Users,
                  title: "Comunidade",
                  desc: "Conecte-se com outros estudantes e compartilhe conhecimento",
                },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="group flex items-start gap-5 rounded-2xl border border-transparent p-1 transition-colors hover:border-zinc-700/40 hover:bg-zinc-900/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700/50 bg-zinc-800/90 shadow-inner ring-1 ring-white/5">
                    <Icon
                      className="h-7 w-7 text-zinc-100"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="mb-1 text-base font-bold tracking-tight text-zinc-50">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex flex-1 items-center justify-center bg-background p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-700">
          <AuthHeader />

          {searchParams.get("cleared") === "1" && (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
            >
              Cookies deste site foram limpos. Usa email e senha para entrar de
              novo.
            </div>
          )}

          {searchParams.get("cleared") !== "1" ? (
            <div className="rounded-xl border border-amber-500/55 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-50">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-2">
                  <p className="font-medium leading-snug">
                    Erro 494/431 ou dezenas de cookies «sb-»? Os cookies httpOnly
                    não se apagam só com JavaScript — usa o botão abaixo.
                  </p>
                  <a
                    href="/api/auth/force-clear-session"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-amber-700 sm:w-auto"
                  >
                    Limpar sessão neste site
                  </a>
                  <p className="text-xs opacity-90">
                    Depois entra outra vez: o login corrige sozinho foto em base64 no
                    perfil. Se ainda falhar, remove a foto no painel Supabase
                    (Authentication → Users).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Entra com email e senha — a sessão deve ficar normal. Se voltar erro
              494/431, usa{" "}
              <a
                href="/api/auth/force-clear-session"
                className="font-medium text-primary underline underline-offset-2"
              >
                limpar sessão
              </a>
              .
            </p>
          )}

          <Card className="rounded-2xl border border-border bg-card shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:shadow-2xl dark:shadow-black/30 dark:backdrop-blur-sm">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-center text-3xl font-bold tracking-tight text-foreground">
                {isLogin ? "Bem-vindo de volta!" : "Criar conta"}
              </CardTitle>
              <CardDescription className="text-center text-base text-muted-foreground">
                {isLogin
                  ? "Entre para continuar organizando seus estudos"
                  : "Comece sua jornada acadêmica hoje"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ErrorMessage message={message} variant="success" />
              <ErrorMessage message={error} variant="error" />

              {!isLogin && (
                <div className="rounded-lg bg-muted/50 border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Campos marcados com{" "}
                    <span className="text-destructive font-semibold">
                      *
                    </span>{" "}
                    são obrigatórios
                  </p>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      signupStep === 1
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs">
                      1
                    </span>
                    Dados e email
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      signupStep === 1 && validateStep1() && setSignupStep(2)
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      signupStep === 2
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/20 text-xs">
                      2
                    </span>
                    Senha
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && signupStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-sm font-medium text-foreground"
                      >
                        Nome completo{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                name: undefined,
                              }));
                            }
                          }}
                          required={!isLogin}
                          className={`pl-11 h-11 ${
                            fieldErrors.name
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {fieldErrors.name && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    {!isLogin && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label
                            htmlFor="curso"
                            className="text-sm font-medium"
                          >
                            Curso{" "}
                            <span className="text-muted-foreground text-xs">
                              (opcional)
                            </span>
                          </label>
                          <div className="relative">
                            <Input
                              id="curso"
                              type="text"
                              placeholder="Ex: Engenharia"
                              value={curso}
                              onChange={(e) => {
                                setCurso(e.target.value);
                                if (fieldErrors.curso) {
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    curso: undefined,
                                  }));
                                }
                              }}
                              className={`pl-11 h-11 ${
                                fieldErrors.curso
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                            />
                            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          {fieldErrors.curso && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fieldErrors.curso}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="periodo"
                            className="text-sm font-medium"
                          >
                            Período{" "}
                            <span className="text-muted-foreground text-xs">
                              (opcional)
                            </span>
                          </label>
                          <div className="relative">
                            <Input
                              id="periodo"
                              type="number"
                              placeholder="Ex: 8"
                              value={periodo}
                              onChange={(e) => {
                                setPeriodo(e.target.value);
                                if (fieldErrors.periodo) {
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    periodo: undefined,
                                  }));
                                }
                              }}
                              min="1"
                              max="20"
                              className={`pl-11 h-11 ${
                                fieldErrors.periodo
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : ""
                              }`}
                            />
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          {fieldErrors.periodo && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fieldErrors.periodo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium text-foreground"
                      >
                        Email <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({
                                ...prev,
                                email: undefined,
                              }));
                            }
                          }}
                          required
                          className={`pl-11 h-11 ${
                            fieldErrors.email
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          }`}
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setSignupStep(2);
                      }}
                      className="w-full h-11 text-base font-medium"
                    >
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}

                {isLogin && (
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email)
                            setFieldErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                        }}
                        required
                        className={`pl-11 h-11 ${
                          fieldErrors.email
                            ? "border-destructive focus-visible:ring-destructive"
                            : "dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:focus-visible:border-zinc-500"
                        }`}
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                )}

                {(isLogin || signupStep === 2) && (
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Senha <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        required
                        minLength={6}
                        className={`pl-11 pr-11 h-11 ${
                          fieldErrors.password
                            ? "border-destructive focus-visible:ring-destructive"
                            : isLogin
                              ? "dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:focus-visible:border-zinc-500"
                              : ""
                        }`}
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.password}
                      </p>
                    )}
                    {!isLogin && (
                      <ul className="text-xs space-y-1 mt-2">
                        <li
                          className={`flex items-center gap-2 ${passwordRules.minLength ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                        >
                          <span
                            className={
                              passwordRules.minLength
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive"
                            }
                          >
                            {passwordRules.minLength ? "✓" : "•"}
                          </span>
                          Mínimo de 6 caracteres
                        </li>
                        <li
                          className={`flex items-center gap-2 ${passwordRules.hasNumber ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                        >
                          <span
                            className={
                              passwordRules.hasNumber
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive"
                            }
                          >
                            {passwordRules.hasNumber ? "✓" : "•"}
                          </span>
                          Pelo menos um número
                        </li>
                        <li
                          className={`flex items-center gap-2 ${passwordRules.hasUppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                        >
                          <span
                            className={
                              passwordRules.hasUppercase
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive"
                            }
                          >
                            {passwordRules.hasUppercase ? "✓" : "•"}
                          </span>
                          Pelo menos uma letra maiúscula
                        </li>
                        <li
                          className={`flex items-center gap-2 ${passwordRules.hasSpecial ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                        >
                          <span
                            className={
                              passwordRules.hasSpecial
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive"
                            }
                          >
                            {passwordRules.hasSpecial ? "✓" : "•"}
                          </span>
                          Pelo menos um caractere especial (!@#$%...)
                        </li>
                      </ul>
                    )}
                    {isLogin && (
                      <div>
                        <Link
                          href="/esqueci-senha"
                          className="text-xs text-primary hover:underline font-medium transition-colors"
                        >
                          Esqueci minha senha
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {!isLogin && signupStep === 2 && (
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirmar senha{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              confirmPassword: undefined,
                            }));
                          }
                        }}
                        required={!isLogin}
                        className={`pl-11 pr-11 h-11 ${
                          fieldErrors.confirmPassword
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {!isLogin && signupStep === 2 && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSignupStep(1)}
                      className="flex-1 h-11"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11 text-base font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar conta"
                      )}
                    </Button>
                  </div>
                )}

                {showMfaInput && (
                  <div className="space-y-4 p-5 rounded-lg bg-primary/5 border-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          Verificação de Segurança (2FA)
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Abra seu aplicativo autenticador e digite o código de
                          6 dígitos
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="mfaCode"
                        className="text-sm font-medium text-foreground"
                      >
                        Código de Verificação{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mfaCode"
                          type="text"
                          placeholder="000000"
                          value={mfaCode}
                          onChange={(e) => {
                            setMfaCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            );
                            setError(null);
                          }}
                          maxLength={6}
                          required
                          className="pl-11 pr-11 text-center text-xl tracking-[0.3em] h-12 font-mono"
                          autoFocus
                        />
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> O código expira em
                        alguns segundos. Se necessário, gere um novo código no
                        seu app.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMfaInput(false);
                        setMfaCode("");
                        setMfaFactorId(null);
                        setMfaChallengeId(null);
                        setError(null);
                        setPassword("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
                    >
                      Voltar ao login
                    </button>
                  </div>
                )}

                {isLogin && (
                  <div className="pt-2">
                    {showMfaInput ? (
                      <Button
                        type="button"
                        onClick={handleMfaVerify}
                        className="w-full h-11 text-base font-medium"
                        disabled={mfaVerifying || !mfaCode.trim()}
                      >
                        {mfaVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Verificar e Entrar"
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <div className="text-center text-sm pt-2">
                  {isLogin ? (
                    <p className="text-muted-foreground">
                      Não tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setError(null);
                          setMessage(null);
                          setFieldErrors({});
                          setSignupStep(1);
                        }}
                        className="text-primary hover:underline font-semibold transition-colors"
                      >
                        Criar conta
                      </button>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setError(null);
                          setMessage(null);
                          setFieldErrors({});
                          setName("");
                          setCurso("");
                          setPeriodo("");
                          setConfirmPassword("");
                          setSignupStep(1);
                        }}
                        className="text-primary hover:underline font-semibold transition-colors"
                      >
                        Fazer login
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle variant="floating" syncThemeToServer={false} />
      </div>
    </div>
  );
}
