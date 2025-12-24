"use client";
import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  GraduationCap,
  FileText,
  Flame,
  Lightbulb,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
// Função simples para formatar tempo relativo
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
};
import Link from "next/link";

const getNotificationIcon = (tipo: string) => {
  switch (tipo) {
    case "avaliacao":
      return <GraduationCap className="h-4 w-4 text-purple-500" />;
    case "tarefa":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "streak":
      return <Flame className="h-4 w-4 text-orange-500" />;
    case "revisao":
      return <Clock className="h-4 w-4 text-green-500" />;
    case "sugestao":
      return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationLink = (notificacao: any) => {
  if (!notificacao.referencia_id || !notificacao.referencia_tipo) return null;

  switch (notificacao.referencia_tipo) {
    case "avaliacao":
      return `/avaliacoes`;
    case "tarefa":
      return notificacao.metadata?.disciplina_id
        ? `/disciplinas/${notificacao.metadata.disciplina_id}#tarefas`
        : null;
    case "disciplina":
      return `/disciplinas/${notificacao.referencia_id}`;
    default:
      return null;
  }
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const { notifications, totalNaoLidas, loading, markAsRead } =
    useNotificationHistory();

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
      ? notifications.filter((n) => !n.lida)
      : notifications.filter((n) => n.lida);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNaoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Central de Notificações</DialogTitle>
              <DialogDescription>
                {totalNaoLidas > 0
                  ? `${totalNaoLidas} notificação${
                      totalNaoLidas > 1 ? "ões" : ""
                    } não lida${totalNaoLidas > 1 ? "s" : ""}`
                  : "Todas as notificações foram lidas"}
              </DialogDescription>
            </div>
            {totalNaoLidas > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead()}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="all"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" onClick={() => setFilter("all")}>
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" onClick={() => setFilter("unread")}>
              Não lidas ({totalNaoLidas})
            </TabsTrigger>
            <TabsTrigger value="read" onClick={() => setFilter("read")}>
              Lidas
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Carregando notificações...
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma notificação
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filter === "unread"
                    ? "Todas as notificações foram lidas!"
                    : "Você não tem notificações ainda."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const link = getNotificationLink(notification);
                  const NotificationContent = (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        notification.lida
                          ? "bg-muted/50"
                          : "bg-background hover:bg-muted/30"
                      }`}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                notification.lida
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {notification.titulo}
                            </p>
                            {notification.descricao && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.descricao}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.lida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link key={notification.id} href={link}>
                      {NotificationContent}
                    </Link>
                  ) : (
                    <div key={notification.id}>{NotificationContent}</div>
                  );
                })}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
