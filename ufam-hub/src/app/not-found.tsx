"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold mb-2">404</CardTitle>
          <p className="text-muted-foreground">Página não encontrada</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            A página que você está procurando não existe ou foi movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir para Home
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}