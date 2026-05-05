"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
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
  Loader2,
  Mail,
  Lock,
  GraduationCap,
  AlertCircle,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Brain,
  CalendarDays,
  BarChart3,
  Shield,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  AuthModernShell,
  LoginModernShell,
  LOGIN_GREEN,
  LOGIN_GLOW,
  LOGIN_MUTED,
  LOGIN_TEXT,
  LOGIN_ERROR,
  type AuthModernFeature,
  type MascotFocus,
} from "@/components/auth/login-modern";
import { cn } from "@/lib/utils";

const SIGNUP_MARKETING_FEATURES: AuthModernFeature[] = [
  {
    Icon: Brain,
    title: "Inteligência que acompanha você",
    subtitle: "IA para simplificar seus estudos",
  },
  {
    Icon: CalendarDays,
    title: "Organize tudo em um só lugar",
    subtitle: "Disciplinas, tarefas e prazos",
  },
  {
    Icon: Users,
    title: "Conecte-se e colabore",
    subtitle: "Aprenda junto com outras pessoas",
  },
  {
    Icon: BarChart3,
    title: "Acompanhe seu progresso",
    subtitle: "Metas e indicadores no seu ritmo",
  },
];

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
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccessPulse, setLoginSuccessPulse] = useState(false);
  const [signupFieldFocus, setSignupFieldFocus] = useState<MascotFocus>(null);

  const signupMascotMode = useMemo(() => {
    if (loading) return "loading" as const;
    if (error) return "error" as const;
    if (signupFieldFocus === "password") return "focus-password" as const;
    if (signupFieldFocus === "email") return "focus-email" as const;
    return "idle" as const;
  }, [loading, error, signupFieldFocus]);

  const signupFieldShell = useCallback((hasErr?: boolean) => {
    return cn(
      "flex items-center gap-3 rounded-xl border px-3 py-2 transition-[border-color,box-shadow] duration-200",
      "border-white/[0.1] bg-white/[0.04] focus-within:border-[#05865E]",
      "focus-within:shadow-[0_0_0_1px_rgba(5,134,94,0.45),0_0_28px_rgba(5,134,94,0.12)]",
      hasErr && "!border-red-500/80 focus-within:!shadow-none",
    );
  }, []);

  const signupNativeInputClass =
    "min-h-[40px] w-full flex-1 border-0 bg-transparent py-1 text-[15px] outline-none ring-0 placeholder:text-neutral-500 focus-visible:ring-0";

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem("ufam-login-remember") === "1") {
        setRememberMe(true);
        const em = localStorage.getItem("ufam-login-email");
        if (em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
          setEmail(em);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

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
      errors.email = "O e-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "E-mail inválido";
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
      errors.email = "O e-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "E-mail inválido";
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
            persistRememberAndRedirect(dest);
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
              "Os cookies da sessão excederam o limite (431). Limpando cookies do Supabase…";
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
              "Não foi possível fazer login com esses dados. Confira o e-mail e a senha e tente novamente.";
          } else if (signInError.message.includes("Email not confirmed")) {
            errorMessage =
              "E-mail não confirmado. Verifique sua caixa de entrada.";
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
          persistRememberAndRedirect(redirectTo);
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
            errorMessage =
              "E-mail inválido. Verifique o formato do endereço.";
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
          persistRememberAndRedirect(redirectTo);
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

  const oauthHref = useMemo(
    () =>
      `/api/auth/oauth?provider=google&redirectTo=${encodeURIComponent(redirectTo)}`,
    [redirectTo],
  );

  const persistRememberAndRedirect = useCallback(
    (url: string) => {
      try {
        if (rememberMe) {
          localStorage.setItem("ufam-login-remember", "1");
          localStorage.setItem("ufam-login-email", email.trim());
        } else {
          localStorage.removeItem("ufam-login-remember");
          localStorage.removeItem("ufam-login-email");
        }
      } catch {
        /* ignore */
      }
      setLoginSuccessPulse(true);
      window.setTimeout(() => {
        window.location.assign(url);
      }, 420);
    },
    [rememberMe, email],
  );

  if (isLogin && !showMfaInput) {
    return (
      <LoginModernShell
        successPulse={loginSuccessPulse}
        clearedSlot={
          searchParams.get("cleared") === "1" ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
            >
              Cookies deste site foram limpos. Use e-mail e senha para entrar
              novamente.
            </div>
          ) : null
        }
        messageSlot={
          message ? <ErrorMessage message={message} variant="success" /> : null
        }
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        fieldErrors={fieldErrors}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        googleHref={oauthHref}
        institutionalHref={oauthHref}
        onCreateAccount={() => {
          setIsLogin(false);
          setError(null);
          setMessage(null);
          setFieldErrors({});
          setSignupStep(1);
          setSignupFieldFocus(null);
        }}
      />
    );
  }

  return (
    <AuthModernShell
      variant={isLogin && showMfaInput ? "formOnly" : "split"}
      {...(!isLogin
        ? {
            title: (
              <>
                A sua jornada acadêmica{" "}
                <span style={{ color: LOGIN_GREEN }} className="font-semibold">
                  começa aqui.
                </span>
              </>
            ),
            description:
              "Preencha seus dados para começar a usar a plataforma — é rápido e gratuito.",
            features: SIGNUP_MARKETING_FEATURES,
            speechBubble: {
              default: "Vamos criar sua conta? É rápido e gratuito! 🚀",
              password: "Prometo não olhar! 🙈",
            },
            mascotMode: signupMascotMode,
            mascotFocus: signupFieldFocus,
            mascotAttentionDisabled: loading || signupFieldFocus === "password",
            leftFooter: (
              <div
                className="flex items-start gap-2.5 text-[11px] leading-relaxed sm:text-xs"
                style={{ color: "rgba(250,250,250,0.5)" }}
              >
                <Shield
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: LOGIN_GREEN }}
                  aria-hidden
                />
                <span>
                  Seus dados estão protegidos com segurança avançada.
                </span>
              </div>
            ),
          }
        : {})}
      topSlots={
        <>
          {searchParams.get("cleared") === "1" ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
            >
              Cookies deste site foram limpos. Use e-mail e senha para entrar
              novamente.
            </div>
          ) : null}
          {message ? (
            <ErrorMessage message={message} variant="success" />
          ) : null}
        </>
      }
    >
      <div
        className={`mx-auto w-full space-y-6 ${isLogin && showMfaInput ? "max-w-md" : "max-w-[400px] lg:max-w-[380px]"}`}
      >
        {isLogin && showMfaInput ? <AuthHeader /> : null}

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border p-6 shadow-xl backdrop-blur-xl sm:p-7"
          style={{
            backgroundColor: "rgba(18,18,18,0.55)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 16px 48px -12px rgba(0,0,0,0.4), 0 0 40px -24px ${LOGIN_GLOW}`,
          }}
        >
          <div className="mb-6 space-y-2 text-center">
            {!isLogin ? (
              <>
                <h1
                  className="text-3xl font-bold tracking-tight sm:text-[1.75rem]"
                  style={{ color: LOGIN_TEXT }}
                >
                  Criar sua{" "}
                  <span
                    style={{ color: LOGIN_GREEN }}
                    className="font-semibold"
                  >
                    conta
                  </span>
                </h1>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: LOGIN_MUTED }}
                >
                  Preencha seus dados para começar.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Bem-vindo de volta!
                </h1>
                <p className="text-base text-muted-foreground">
                  Entre para continuar organizando seus estudos
                </p>
              </>
            )}
          </div>
          <div className="space-y-6">
            <ErrorMessage message={error} variant="error" />

            {!isLogin && (
              <div
                className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: LOGIN_GREEN }}
                  aria-hidden
                />
                <p
                  className="text-left text-xs leading-relaxed"
                  style={{ color: LOGIN_MUTED }}
                >
                  Campos marcados com{" "}
                  <span
                    style={{ color: LOGIN_ERROR }}
                    className="font-semibold"
                  >
                    *
                  </span>{" "}
                  são obrigatórios
                </p>
              </div>
            )}

            {!isLogin && (
              <div
                className="flex gap-2 rounded-xl border p-1.5"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                }}
                role="tablist"
                aria-label="Passos do cadastro"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={signupStep === 1}
                  onClick={() => setSignupStep(1)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
                    signupStep === 1
                      ? "text-white shadow-md"
                      : "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200",
                  )}
                  style={
                    signupStep === 1
                      ? { backgroundColor: LOGIN_GREEN }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      signupStep === 1 ? "bg-white/20" : "bg-white/10",
                    )}
                  >
                    1
                  </span>
                  Dados e email
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={signupStep === 2}
                  onClick={() =>
                    signupStep === 1 && validateStep1() && setSignupStep(2)
                  }
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
                    signupStep === 2
                      ? "text-white shadow-md"
                      : "text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200",
                  )}
                  style={
                    signupStep === 2
                      ? { backgroundColor: LOGIN_GREEN }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      signupStep === 2 ? "bg-white/20" : "bg-white/10",
                    )}
                  >
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
                      className="text-sm font-medium"
                      style={{ color: LOGIN_MUTED }}
                    >
                      Nome completo{" "}
                      <span style={{ color: LOGIN_ERROR }}>*</span>
                    </label>
                    <div
                      className={signupFieldShell(Boolean(fieldErrors.name))}
                    >
                      <GraduationCap
                        className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                        style={{ color: LOGIN_GREEN }}
                        aria-hidden
                      />
                      <input
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
                        onFocus={() => setSignupFieldFocus("email")}
                        onBlur={() => setSignupFieldFocus(null)}
                        required
                        className={signupNativeInputClass}
                        style={{ color: LOGIN_TEXT }}
                      />
                    </div>
                    {fieldErrors.name ? (
                      <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="curso"
                        className="text-sm font-medium"
                        style={{ color: LOGIN_MUTED }}
                      >
                        Curso{" "}
                        <span className="text-xs opacity-80">(opcional)</span>
                      </label>
                      <div
                        className={signupFieldShell(Boolean(fieldErrors.curso))}
                      >
                        <BookOpen
                          className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                          style={{ color: LOGIN_GREEN }}
                          aria-hidden
                        />
                        <input
                          id="curso"
                          type="text"
                          placeholder="Ex.: Engenharia"
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
                          onFocus={() => setSignupFieldFocus("email")}
                          onBlur={() => setSignupFieldFocus(null)}
                          className={signupNativeInputClass}
                          style={{ color: LOGIN_TEXT }}
                        />
                      </div>
                      {fieldErrors.curso ? (
                        <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                          {fieldErrors.curso}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="periodo"
                        className="text-sm font-medium"
                        style={{ color: LOGIN_MUTED }}
                      >
                        Período{" "}
                        <span className="text-xs opacity-80">(opcional)</span>
                      </label>
                      <div
                        className={signupFieldShell(
                          Boolean(fieldErrors.periodo),
                        )}
                      >
                        <Calendar
                          className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                          style={{ color: LOGIN_GREEN }}
                          aria-hidden
                        />
                        <input
                          id="periodo"
                          type="number"
                          placeholder="Ex.: 8"
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
                          onFocus={() => setSignupFieldFocus("email")}
                          onBlur={() => setSignupFieldFocus(null)}
                          min={1}
                          max={20}
                          className={cn(signupNativeInputClass, "pr-1")}
                          style={{ color: LOGIN_TEXT }}
                        />
                      </div>
                      {fieldErrors.periodo ? (
                        <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                          {fieldErrors.periodo}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="signup-email"
                      className="text-sm font-medium"
                      style={{ color: LOGIN_MUTED }}
                    >
                      E-mail <span style={{ color: LOGIN_ERROR }}>*</span>
                    </label>
                    <div
                      className={signupFieldShell(Boolean(fieldErrors.email))}
                    >
                      <Mail
                        className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                        style={{ color: LOGIN_GREEN }}
                        aria-hidden
                      />
                      <input
                        id="signup-email"
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
                        onFocus={() => setSignupFieldFocus("email")}
                        onBlur={() => setSignupFieldFocus(null)}
                        required
                        autoComplete="email"
                        className={signupNativeInputClass}
                        style={{ color: LOGIN_TEXT }}
                      />
                    </div>
                    {fieldErrors.email ? (
                      <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setSignupStep(2);
                    }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex h-[52px] w-full items-center justify-between gap-3 rounded-xl px-5 text-[15px] font-semibold text-white transition-shadow"
                    style={{
                      background: LOGIN_GREEN,
                      boxShadow: `0 0 24px ${LOGIN_GLOW}`,
                    }}
                  >
                    <span className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:justify-start">
                      Próximo
                    </span>
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25"
                      aria-hidden
                    >
                      <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                  </motion.button>
                </>
              )}

              {isLogin && (
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    E-mail <span className="text-destructive">*</span>
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

              {isLogin && (
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
                      className={`h-11 pl-11 pr-11 ${
                        fieldErrors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : "dark:border-zinc-700/80 dark:bg-zinc-900/50 dark:focus-visible:border-zinc-500"
                      }`}
                    />
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.password}
                    </p>
                  ) : null}
                  <div>
                    <Link
                      href="/esqueci-senha"
                      className="text-xs font-medium transition-colors hover:underline"
                      style={{ color: LOGIN_GREEN }}
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                </div>
              )}

              {!isLogin && signupStep === 2 && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium"
                      style={{ color: LOGIN_MUTED }}
                    >
                      Senha <span style={{ color: LOGIN_ERROR }}>*</span>
                    </label>
                    <div
                      className={signupFieldShell(
                        Boolean(fieldErrors.password),
                      )}
                    >
                      <Lock
                        className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                        style={{ color: LOGIN_GREEN }}
                        aria-hidden
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crie uma senha segura"
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
                        onFocus={() => setSignupFieldFocus("password")}
                        onBlur={() => setSignupFieldFocus(null)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className={cn(signupNativeInputClass, "pr-1")}
                        style={{ color: LOGIN_TEXT }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="shrink-0 p-1.5 opacity-65 transition hover:opacity-100"
                        style={{ color: LOGIN_MUTED }}
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                        {fieldErrors.password}
                      </p>
                    ) : null}
                    <ul className="mt-2 space-y-1 text-xs">
                      {(
                        [
                          [passwordRules.minLength, "Mínimo de 6 caracteres"],
                          [passwordRules.hasNumber, "Pelo menos um número"],
                          [
                            passwordRules.hasUppercase,
                            "Pelo menos uma letra maiúscula",
                          ],
                          [
                            passwordRules.hasSpecial,
                            "Pelo menos um caractere especial (!@#$%...)",
                          ],
                        ] as const
                      ).map(([ok, text]) => (
                        <li
                          key={text}
                          className="flex items-center gap-2"
                          style={{ color: ok ? LOGIN_GREEN : LOGIN_MUTED }}
                        >
                          <span
                            style={{ color: ok ? LOGIN_GREEN : LOGIN_ERROR }}
                          >
                            {ok ? "✓" : "•"}
                          </span>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                      style={{ color: LOGIN_MUTED }}
                    >
                      Confirmar senha{" "}
                      <span style={{ color: LOGIN_ERROR }}>*</span>
                    </label>
                    <div
                      className={signupFieldShell(
                        Boolean(fieldErrors.confirmPassword),
                      )}
                    >
                      <Lock
                        className="pointer-events-none h-[1.1rem] w-[1.1rem] shrink-0"
                        style={{ color: LOGIN_GREEN }}
                        aria-hidden
                      />
                      <input
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
                        onFocus={() => setSignupFieldFocus("password")}
                        onBlur={() => setSignupFieldFocus(null)}
                        required
                        autoComplete="new-password"
                        className={cn(signupNativeInputClass, "pr-1")}
                        style={{ color: LOGIN_TEXT }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="shrink-0 p-1.5 opacity-65 transition hover:opacity-100"
                        style={{ color: LOGIN_MUTED }}
                        aria-label={
                          showConfirmPassword
                            ? "Ocultar confirmação"
                            : "Mostrar confirmação"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword ? (
                      <p className="text-xs" style={{ color: LOGIN_ERROR }}>
                        {fieldErrors.confirmPassword}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSignupStep(1)}
                      className="h-[52px] flex-1 border-white/15 bg-transparent hover:bg-white/[0.06]"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={loading ? undefined : { scale: 1.02 }}
                      whileTap={loading ? undefined : { scale: 0.99 }}
                      className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-white transition-shadow disabled:opacity-60"
                      style={{
                        background: LOGIN_GREEN,
                        boxShadow: `0 0 24px ${LOGIN_GLOW}`,
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                          Criando conta…
                        </>
                      ) : (
                        "Criar conta"
                      )}
                    </motion.button>
                  </div>
                </>
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
                        Abra seu aplicativo autenticador e digite o código de 6
                        dígitos
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
                      alguns segundos. Se necessário, gere um novo código no seu
                      app.
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

              <div className="pt-2 text-center text-sm">
                {isLogin ? (
                  <p style={{ color: LOGIN_MUTED }}>
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
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: LOGIN_GREEN }}
                    >
                      Criar conta
                    </button>
                  </p>
                ) : (
                  <p style={{ color: LOGIN_MUTED }}>
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
                      className="font-semibold transition-colors hover:underline"
                      style={{ color: LOGIN_GREEN }}
                    >
                      Fazer login
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AuthModernShell>
  );
}
