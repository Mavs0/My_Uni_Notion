"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";
export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  // Estados para MFA
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [router]);
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
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) {
          let errorMessage = signInError.message;
          if (signInError.message.includes("Invalid login credentials")) {
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

        // Verificar se há MFA ativado
        if (data.session) {
          // Login bem-sucedido sem MFA
          router.push("/dashboard");
          router.refresh();
        } else {
          // Sem sessão - pode ser MFA
          // Tentar listar fatores MFA (funciona mesmo sem sessão completa quando MFA está ativado)
          try {
            const { data: factorsData, error: factorsError } =
              await supabase.auth.mfa.listFactors();

            if (
              !factorsError &&
              factorsData?.totp &&
              factorsData.totp.length > 0
            ) {
              // MFA está ativado, precisa verificar código
              const factor = factorsData.totp[0];

              // Criar challenge MFA
              const { data: challengeData, error: challengeError } =
                await supabase.auth.mfa.challenge({
                  factorId: factor.id,
                });

              if (challengeError || !challengeData) {
                console.error("Erro ao criar challenge MFA:", challengeError);
                setError("Erro ao iniciar verificação 2FA. Tente novamente.");
                setLoading(false);
                return;
              }

              setMfaFactorId(factor.id);
              setMfaChallengeId(challengeData.id);
              setShowMfaInput(true);
              setLoading(false);
              return;
            }
          } catch (mfaError) {
            console.error("Erro ao verificar MFA:", mfaError);
          }

          // Se chegou aqui, não há MFA ou houve erro
          setError("Erro ao fazer login. Verifique suas credenciais.");
          setLoading(false);
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
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
            const confirmationLink = `${
              process.env.NEXT_PUBLIC_APP_URL || window.location.origin
            }/auth/confirm?email=${encodeURIComponent(data.user.email)}`;
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
      setError(err.message || "Ocorreu um erro inesperado");
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
        const { session } = await response.json();
        if (session) {
          // Atualizar a sessão no cliente
          const supabase = createSupabaseBrowser();
          await supabase.auth.setSession(session);
          router.push("/dashboard");
          router.refresh();
        } else {
          setError("Erro ao completar login. Tente novamente.");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Código inválido");
      }
    } catch (error) {
      console.error("Erro ao verificar código 2FA:", error);
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setMfaVerifying(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AuthHeader />
        {}
        <Card className="border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              {isLogin ? "Bem-vindo de volta!" : "Criar conta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Entre para continuar organizando seus estudos"
                : "Crie sua conta e comece a organizar seus estudos"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isLogin && (
              <div className="mb-2 p-3 rounded-md bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  Campos marcados com{" "}
                  <span className="text-destructive font-semibold">*</span> são
                  obrigatórios
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              {}
              {message && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {message}
                </div>
              )}
              {}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {}
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
                      className={`pl-10 ${
                        fieldErrors.name
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              )}
              {}
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="curso" className="text-sm font-medium">
                      Curso{" "}
                      <span className="text-zinc-400 text-xs">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="curso"
                        type="text"
                        placeholder="Ex: Engenharia de Software"
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
                        className={`pl-10 ${
                          fieldErrors.curso
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                    {fieldErrors.curso && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.curso}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="periodo" className="text-sm font-medium">
                      Período{" "}
                      <span className="text-zinc-400 text-xs">(opcional)</span>
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
                        className={`pl-10 ${
                          fieldErrors.periodo
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                    {fieldErrors.periodo && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.periodo}
                      </p>
                    )}
                    {!fieldErrors.periodo && periodo && (
                      <p className="text-xs text-zinc-500">
                        Período deve ser entre 1 e 20
                      </p>
                    )}
                  </div>
                </div>
              )}
              {}
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
                    className={`pl-10 ${
                      fieldErrors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              {}
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
                    type="password"
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
                    className={`pl-10 ${
                      fieldErrors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <div className="text-right">
                    <Link
                      href="/esqueci-senha"
                      className="text-xs text-primary hover:underline font-medium transition-colors"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                )}
              </div>
              {}
              {showMfaInput && (
                <div className="space-y-3 p-4 rounded-md bg-muted/50 border border-border">
                  <div className="space-y-2">
                    <label
                      htmlFor="mfaCode"
                      className="text-sm font-medium text-foreground"
                    >
                      Código de Verificação 2FA{" "}
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
                        className="pl-10 text-center text-lg tracking-widest"
                        autoFocus
                      />
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite o código de 6 dígitos do seu aplicativo
                      autenticador
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
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              )}
              {}
              <div className="pt-2">
                {showMfaInput ? (
                  <Button
                    type="button"
                    onClick={handleMfaVerify}
                    className="w-full"
                    disabled={mfaVerifying || !mfaCode.trim()}
                    size="lg"
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
                    className="w-full"
                    disabled={loading}
                    size="lg"
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
              {}
              <div className="text-center text-sm pt-1">
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
                      className="text-primary hover:underline font-medium transition-colors"
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
                      className="text-primary hover:underline font-medium transition-colors"
                    >
                      Fazer login
                    </button>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        {}
      </div>
    </div>
  );
}
