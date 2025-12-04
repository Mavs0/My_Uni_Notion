"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    const confirmEmail = async () => {
      const email = searchParams.get("email");
      if (!email) {
        setStatus("error");
        setMessage("Email não fornecido na URL.");
        return;
      }
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email === email && user.email_confirmed_at) {
        setStatus("success");
        setMessage("Seu email já está confirmado!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
        return;
      }
      setStatus("error");
      setMessage(
        "Por favor, use o link de confirmação enviado pelo Supabase no seu email. Ou faça login e solicite um novo link de confirmação."
      );
    };
    confirmEmail();
  }, [searchParams, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Confirmando email...</h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Aguarde enquanto verificamos sua conta.
              </p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-green-600">
                Email confirmado!
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {message ||
                  "Sua conta foi confirmada com sucesso. Redirecionando..."}
              </p>
              <Button asChild>
                <Link href="/dashboard">Ir para o Dashboard</Link>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-red-600">
                Erro ao confirmar
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">Fazer Login</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">Voltar ao Início</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}