"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw, ArrowLeft } from "lucide-react";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro capturado:", error);
  }, [error]);
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">500</CardTitle>
          <p className="text-muted-foreground">Erro interno do servidor</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Ops! Algo deu errado. Nossa equipe foi notificada e está trabalhando
            para resolver o problema.
          </p>
          {error.message && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir para Home
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}