"use client";
import { useState } from "react";
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
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!email.trim()) {
      setError("Email é obrigatório");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/resetar-senha`,
        }
      );
      if (resetError) {
        let errorMessage = resetError.message;
        if (resetError.message.includes("rate limit")) {
          errorMessage =
            "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (resetError.message.includes("not found")) {
          errorMessage =
            "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.";
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Erro ao solicitar reset de senha:", err);
      setError("Erro ao processar solicitação. Tente novamente mais tarde.");
      setLoading(false);
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
          <div className="space-y-6 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Recuperação de Senha</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight">
              Recupere seu acesso{" "}
              <span className="text-primary">rapidamente</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Digite seu email e enviaremos um link seguro para redefinir sua
              senha. O processo é rápido e simples.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
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
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </div>
              <CardTitle className="text-3xl font-bold">
                Esqueci minha senha
              </CardTitle>
              <CardDescription className="text-base">
                Digite seu email e enviaremos um link para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {success ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                          Email enviado!
                        </h3>
                        <p className="text-sm text-emerald-600/90 dark:text-emerald-300/90">
                          Se o email <strong>{email}</strong> estiver cadastrado,
                          você receberá um link para redefinir sua senha.
                          Verifique sua caixa de entrada e a pasta de spam.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setSuccess(false);
                        setEmail("");
                      }}
                      variant="outline"
                      className="w-full h-11"
                    >
                      Enviar outro email
                    </Button>
                    <Button asChild variant="ghost" className="w-full h-11">
                      <Link href="/login">Voltar para login</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email
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
                        required
                        className="pl-11 h-11"
                        disabled={loading}
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar link de recuperação"
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      ← Voltar para login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
