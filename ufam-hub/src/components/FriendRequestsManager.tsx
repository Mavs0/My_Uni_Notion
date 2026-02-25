"use client";
import { useState, useEffect } from "react";
import {
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendRequests, FriendRequest } from "@/hooks/useFriendRequests";
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

export function FriendRequestsManager() {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const {
    requests,
    loading,
    loadRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  } = useFriendRequests();

  useEffect(() => {
    loadRequests(activeTab);
  }, [activeTab, loadRequests]);

  const receivedRequests = requests.filter(
    (req) => req.status === "pending" && !req.isRequester
  );
  const sentRequests = requests.filter(
    (req) => req.status === "pending" && req.isRequester
  );

  const getInitials = (nome: string, email: string) => {
    if (nome) {
      const parts = nome.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : nome.substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações de Amizade</CardTitle>
        <CardDescription>
          Gerencie suas solicitações de amizade enviadas e recebidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Recebidas ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Enviadas ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação recebida</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.user?.avatar_url} />
                            <AvatarFallback>
                              {request.user
                                ? getInitials(request.user.nome, request.user.email)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.user?.nome || request.user?.email || "Usuário"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptRequest(request.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRequest(request.id)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação enviada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.user?.avatar_url} />
                            <AvatarFallback>
                              {request.user
                                ? getInitials(request.user.nome, request.user.email)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {request.user?.nome || request.user?.email || "Usuário"}
                              </p>
                              <Badge variant="outline">Pendente</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(request.created_at)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
