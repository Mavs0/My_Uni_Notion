"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LimparCookiesPage() {
  const handleCleanup = () => {
    try {
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0].trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    } catch (e) {
      console.error("Erro ao limpar cookies:", e);
    }
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {/* <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-6 w-6" />
            Erro 431 / 494 — Cookies ou cabeçalhos demasiado grandes
          </CardTitle>
          <CardDescription>
            Na Vercel, o erro <strong>494 REQUEST_HEADER_TOO_LARGE</strong> aparece quando o
            browser envia demasiados cookies de uma vez (sessão Supabase fragmentada, por
            exemplo com <code>avatar_url</code> em base64 no Auth). Use o botão abaixo ou, se
            esta página não carregar, limpe os cookies do site em Definições do browser.
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique no botão abaixo para limpar todos os cookies e fazer login
            novamente.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleCleanup} className="w-full" size="lg">
              Limpar Cookies e Ir para Login
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
