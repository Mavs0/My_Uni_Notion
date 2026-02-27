"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Info,
} from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";

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
    curso?: string;
    periodo?: string;
  }>({});
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const checkResponse = await fetch("/api/auth/cleanup-cookies");
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const totalSizeKB = parseFloat(checkData.totalSizeKB || "0");
          
          if (totalSizeKB > 10) {
            console.log("Cookies grandes detectados na página de login, limpando...");
            await fetch("/api/auth/cleanup-cookies", {
              method: "POST",
              credentials: "include",
            });
          }
        }
      } catch (error) {
      }
      
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkAuth();
  }, [router, redirectTo]);

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
    if (!password) {
      errors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const cleanupCookiesBeforeLogin = async () => {
    try {
      const checkResponse = await fetch("/api/auth/cleanup-cookies", {
        method: "GET",
        credentials: "include",
      }).catch(() => null);
      
      if (checkResponse?.ok) {
        try {
          const checkData = await checkResponse.json();
          const totalSizeKB = parseFloat(checkData.totalSizeKB || "0");
          
          if (totalSizeKB > 8) {
            console.log("Cookies grandes detectados, limpando antes do login...");
            const cleanupResponse = await fetch("/api/auth/cleanup-cookies", {
              method: "POST",
              credentials: "include",
            }).catch(() => null);
            
            if (cleanupResponse?.ok) {
              console.log("Cookies limpos com sucesso");
              try {
                const chatThreads = localStorage.getItem("chatThreads:v1");
                if (chatThreads && chatThreads.length > 100000) {
                  const threads = JSON.parse(chatThreads);
                  if (Array.isArray(threads) && threads.length > 20) {
                    const recentThreads = threads
                      .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0))
                      .slice(0, 20);
                    localStorage.setItem("chatThreads:v1", JSON.stringify(recentThreads));
                  }
                }
              } catch (e) {
              }
            }
          }
        } catch (jsonError) {
          console.warn("Erro ao parsear resposta de verificação de cookies");
        }
      }
    } catch (error) {
      console.warn("Erro ao verificar/limpar cookies (não crítico):", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFieldErrors({});
    if (!validateForm()) {
      return;
    }
    
    await cleanupCookiesBeforeLogin();
    
    setLoading(true);
    const supabase = createSupabaseBrowser();
    try {
      if (isLogin) {
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
          const errorMessage = networkError?.message || String(networkError || "");
          
          if (
            errorMessage.includes("Failed to fetch") ||
            errorMessage.includes("ERR_NAME_NOT_RESOLVED") ||
            errorMessage.includes("ERR_INTERNET_DISCONNECTED") ||
            errorMessage.includes("NetworkError") ||
            networkError?.name === "TypeError"
          ) {
            setError(
              "Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, pode ser necessário limpar os cookies do navegador."
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
            errorMessage = "Erro 431: Cookies muito grandes. Limpando cookies...";
            try {
              await fetch("/api/auth/cleanup-cookies", {
                method: "POST",
                credentials: "include",
              }).catch(() => {
                const cookiesToDelete = [
                  "sb-access-token",
                  "sb-refresh-token",
                  "supabase-auth-token",
                  "sb-auth-token",
                ];
                for (const cookieName of cookiesToDelete) {
                  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                }
              });
              const chatThreads = localStorage.getItem("chatThreads:v1");
              if (chatThreads && chatThreads.length > 50000) {
                localStorage.removeItem("chatThreads:v1");
              }
              setTimeout(() => {
                window.location.reload();
              }, 1000);
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
          router.push(redirectTo);
          router.refresh();
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
                  "Erro ao iniciar verificação 2FA. Tente novamente ou desative o 2FA temporariamente."
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
                "Erro ao fazer login. Verifique suas credenciais. Se você tem 2FA ativado, certifique-se de que está configurado corretamente."
              );
              setLoading(false);
            }
          } catch (mfaError: any) {
            console.error("Erro ao verificar MFA:", mfaError);
            setError(
              "Erro ao fazer login. Verifique suas credenciais ou tente novamente."
            );
            setLoading(false);
          }
        }
      } else {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          (typeof window !== "undefined" ? window.location.origin : "");
        const emailRedirectTo = baseUrl ? `${baseUrl.replace(/\/$/, "")}/auth/confirm` : undefined;
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
            "Conta criada com sucesso! Verifique seu email para confirmar sua conta."
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
          "Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, pode ser necessário limpar os cookies do navegador."
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
          
          router.push(redirectTo);
          router.refresh();
        } else {
          setError("Erro ao completar login. Tente novamente.");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Código inválido ou expirado. Tente novamente.");
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
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Plataforma Acadêmica</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight">
                Organize seus estudos com{" "}
                <span className="text-primary">inteligência</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Gerencie disciplinas, avaliações, tarefas e muito mais em um só
                lugar. Potencializado por IA.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Gestão Completa</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize disciplinas, horários e materiais de estudo
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Acompanhe Progresso</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize estatísticas e métricas do seu desempenho
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Comunidade</h3>
                  <p className="text-sm text-muted-foreground">
                    Conecte-se com outros estudantes e compartilhe conhecimento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-700">
          <AuthHeader />

          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl font-bold text-center">
                {isLogin ? "Bem-vindo de volta!" : "Criar conta"}
              </CardTitle>
              <CardDescription className="text-center text-base">
                {isLogin
                  ? "Entre para continuar organizando seus estudos"
                  : "Comece sua jornada acadêmica hoje"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {message && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLogin && (
                <div className="rounded-lg bg-muted/50 border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    Campos marcados com{" "}
                    <span className="text-destructive font-semibold">*</span> são
                    obrigatórios
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-foreground"
                    >
                      Nome completo <span className="text-destructive">*</span>
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
                )}

                {!isLogin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="curso" className="text-sm font-medium">
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
                      <label htmlFor="periodo" className="text-sm font-medium">
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
                  {!fieldErrors.password && !isLogin && (
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <Link
                        href="/esqueci-senha"
                        className="text-xs text-primary hover:underline font-medium transition-colors"
                      >
                        Esqueci minha senha
                      </Link>
                      <Link
                        href="/perfil"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        title="Ativar autenticação de dois fatores"
                      >
                        <Shield className="h-3 w-3" />
                        <span>2FA</span>
                      </Link>
                    </div>
                  )}
                </div>

                {isLogin && !showMfaInput && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Proteja sua conta:</strong> Ative a autenticação de dois fatores (2FA) em{" "}
                          <Link href="/perfil" className="underline font-medium">
                            Meu Perfil → Segurança
                          </Link>
                        </p>
                      </div>
                    </div>
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
                          Abra seu aplicativo autenticador e digite o código de 6 dígitos
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
                              e.target.value.replace(/\D/g, "").slice(0, 6)
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
                        <AlertCircle className="h-3 w-3" />
                        O código expira em alguns segundos. Se necessário, gere um novo código no seu app.
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
                      className="w-full h-11 text-base font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isLogin ? "Entrando..." : "Criando conta..."}
                        </>
                      ) : (
                        <>{isLogin ? "Entrar" : "Criar conta"}</>
                      )}
                    </Button>
                  )}
                </div>

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
    </div>
  );
}
