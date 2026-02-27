"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  GraduationCap,
  FileText,
  Flame,
  Lightbulb,
  Loader2,
  UserPlus,
  UserCheck,
  Users,
  MessageSquare,
  Heart,
  Sparkles,
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
import Link from "next/link";

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
    case "solicitacao_amizade":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "solicitacao_grupo":
      return <Users className="h-4 w-4 text-indigo-500" />;
    case "amizade_aceita":
      return <UserCheck className="h-4 w-4 text-green-500" />;
    case "novo_seguidor":
      return <UserPlus className="h-4 w-4 text-indigo-500" />;
    case "social_comment":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "social_reaction":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "lembrete":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "conquista":
      return <Sparkles className="h-4 w-4 text-yellow-500" />;
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
    case "activity":
      return `/feed`;
    case "friend_request":
      return `/perfil/amizades`;
    case "grupo":
      return notificacao.referencia_id
        ? `/grupos/${notificacao.referencia_id}`
        : null;
    case "perfil":
      return notificacao.referencia_id
        ? `/perfil/${notificacao.referencia_id}`
        : null;
    default:
      return null;
  }
};

interface NotificationListProps {
  notifications: any[];
  loading: boolean;
  markAsRead: (id?: string) => Promise<boolean>;
  onNotificationClick?: () => void;
}

function NotificationList({
  notifications,
  loading,
  markAsRead,
  onNotificationClick,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm font-medium text-muted-foreground">
          Nenhuma notificação
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Você não tem notificações ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const link = getNotificationLink(notification);
        const NotificationContent = (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              link ? "cursor-pointer hover:bg-muted/30" : ""
            } ${notification.lida ? "bg-muted/50" : "bg-background"}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {getNotificationIcon(notification.tipo)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
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
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

        return link ? (
          <Link
            key={notification.id}
            href={link}
            onClick={() => {
              onNotificationClick?.();
              if (!notification.lida) {
                markAsRead(notification.id);
              }
            }}
          >
            {NotificationContent}
          </Link>
        ) : (
          <div key={notification.id}>{NotificationContent}</div>
        );
      })}
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const {
    notifications,
    totalNaoLidas,
    loading,
    markAsRead,
    loadNotifications,
  } = useNotificationHistory();

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
        ? notifications.filter((n) => !n.lida)
        : notifications.filter((n) => n.lida);

  const handleMarkAllAsRead = async () => {
    const success = await markAsRead();
    if (success) {
      if (activeTab === "unread") {
        setActiveTab("all");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNaoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
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
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não lidas ({totalNaoLidas})
            </TabsTrigger>
            <TabsTrigger value="read">
              Lidas ({notifications.filter((n) => n.lida).length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="all" className="mt-0">
              <NotificationList
                notifications={notifications}
                loading={loading}
                markAsRead={markAsRead}
                onNotificationClick={() => setOpen(false)}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <NotificationList
                notifications={notifications.filter((n) => !n.lida)}
                loading={loading}
                markAsRead={markAsRead}
                onNotificationClick={() => setOpen(false)}
              />
            </TabsContent>

            <TabsContent value="read" className="mt-0">
              <NotificationList
                notifications={notifications.filter((n) => n.lida)}
                loading={loading}
                markAsRead={markAsRead}
                onNotificationClick={() => setOpen(false)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
