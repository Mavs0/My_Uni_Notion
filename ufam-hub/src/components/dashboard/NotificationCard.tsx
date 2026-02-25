"use client";
import { Bell, GraduationCap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Disciplina } from "@/hooks/useDisciplinas";

interface Notificacao {
  id: string;
  titulo: string;
  tipo: "avaliacao" | "tarefa";
  data: string;
  urgente?: boolean;
  disciplina_id?: string;
}

interface NotificationCardProps {
  notificacoes: Notificacao[];
  loading: boolean;
  disciplinasMap: Map<string, Disciplina>;
  linkHref?: string;
  linkText?: string;
}

export function NotificationCard({
  notificacoes,
  loading,
  disciplinasMap,
  linkHref = "/avaliacoes",
  linkText = "Ver todas →",
}: NotificationCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border p-3 animate-pulse"
              >
                <div className="h-4 w-4 rounded-full bg-muted mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notificacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação recente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notificacoes.map((notif) => {
            const dias = Math.ceil(
              (new Date(notif.data).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const disciplinaNome =
              notif.disciplina_id &&
              disciplinasMap.get(notif.disciplina_id)?.nome;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  notif.urgente
                    ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                    : "hover:bg-accent/50"
                }`}
              >
                <div
                  className={`mt-0.5 ${
                    notif.tipo === "avaliacao"
                      ? "text-blue-500"
                      : "text-emerald-500"
                  }`}
                >
                  {notif.tipo === "avaliacao" ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {notif.titulo}
                  </div>
                  {disciplinaNome && (
                    <div className="text-xs text-muted-foreground">
                      {disciplinaNome}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {dias === 0
                      ? "Hoje"
                      : dias === 1
                      ? "Amanhã"
                      : dias < 0
                      ? `Há ${Math.abs(dias)} dias`
                      : `Em ${dias} dias`}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="pt-2 text-center">
            <Link
              href={linkHref}
              className="text-xs text-primary hover:underline"
            >
              {linkText}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
