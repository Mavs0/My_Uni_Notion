"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Users,
  Send,
  ArrowLeft,
  User,
  Settings,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
interface Mensagem {
  id: string;
  mensagem: string;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
interface Membro {
  id: string;
  role: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
interface Solicitacao {
  id: string;
  user_id: string;
  grupo_id: string;
  status: string;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}
export default function GrupoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const grupoId = params.id as string;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [grupoInfo, setGrupoInfo] = useState<any>(null);
  const [showAprovacaoDialog, setShowAprovacaoDialog] = useState(false);
  const [solicitacaoAprovar, setSolicitacaoAprovar] =
    useState<Solicitacao | null>(null);
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadGrupoInfo();
    loadMensagens();
    loadMembros();
    loadSolicitacoes();
    const interval = setInterval(() => {
      loadMensagens();
      loadSolicitacoes();
    }, 5000);
    return () => clearInterval(interval);
  }, [grupoId]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const loadGrupoInfo = async () => {
    try {
      const response = await fetch(`/api/colaboracao/grupos/${grupoId}`);
      if (response.ok) {
        const data = await response.json();
        setGrupoInfo(data.grupo || data.grupos?.[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar informações do grupo:", error);
    }
  };

  const loadMensagens = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens`
      );
      if (response.ok) {
        const { mensagens: mensagensData } = await response.json();
        setMensagens(mensagensData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembros = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/membros`
      );
      if (response.ok) {
        const { membros: membrosData } = await response.json();
        setMembros(membrosData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  };

  const loadSolicitacoes = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/solicitacoes`
      );
      if (response.ok) {
        const { solicitacoes: solicitacoesData } = await response.json();
        setSolicitacoes(solicitacoesData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };
  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagem: novaMensagem }),
        }
      );
      if (response.ok) {
        setNovaMensagem("");
        await loadMensagens();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleAprovarSolicitacao = async (
    solicitacaoId: string,
    aprovar: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/solicitacoes/${solicitacaoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aprovado: aprovar }),
        }
      );
      if (response.ok) {
        toast.success(
          aprovar ? "Solicitação aprovada!" : "Solicitação recusada"
        );
        setShowAprovacaoDialog(false);
        setSolicitacaoAprovar(null);
        await loadSolicitacoes();
        await loadMembros();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao processar solicitação");
      }
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast.error("Erro ao processar solicitação");
    }
  };

  const getInitials = (nome?: string, email?: string) => {
    if (nome) {
      const parts = nome.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return nome.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };
  return (
    <main className="mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/grupos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Grupo de Estudo</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat do Grupo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[500px] overflow-y-auto space-y-4 pr-2 border rounded-lg p-4 bg-muted/30">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      Carregando mensagens...
                    </p>
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      Nenhuma mensagem ainda. Seja o primeiro a escrever!
                    </p>
                  </div>
                ) : (
                  <>
                    {mensagens
                      .slice()
                      .reverse()
                      .map((msg) => {
                        const nomeUsuario =
                          msg.usuario?.raw_user_meta_data?.nome ||
                          msg.usuario?.raw_user_meta_data?.email ||
                          "Usuário";
                        const emailUsuario =
                          msg.usuario?.raw_user_meta_data?.email || "";
                        return (
                          <div key={msg.id} className="flex gap-3 group">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs">
                                {getInitials(nomeUsuario, emailUsuario)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {nomeUsuario}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleTimeString(
                                    "pt-BR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                              <div className="rounded-lg bg-background border p-3 shadow-sm">
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.mensagem}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={mensagensEndRef} />
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensagem();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button
                  onClick={handleEnviarMensagem}
                  disabled={!novaMensagem.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {}
        <div className="space-y-4">
          {grupoInfo?.requer_aprovacao &&
            grupoInfo?.visibilidade === "privado" &&
            solicitacoes.length > 0 && (
              <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <UserPlus className="h-5 w-5" />
                    Solicitações Pendentes ({solicitacoes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {solicitacoes.map((solicitacao) => (
                      <div
                        key={solicitacao.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background border"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(
                                solicitacao.usuario?.raw_user_meta_data?.nome,
                                solicitacao.usuario?.raw_user_meta_data?.email
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {solicitacao.usuario?.raw_user_meta_data?.nome ||
                                solicitacao.usuario?.raw_user_meta_data
                                  ?.email ||
                                "Usuário"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                solicitacao.created_at
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSolicitacaoAprovar(solicitacao);
                              setShowAprovacaoDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAprovarSolicitacao(solicitacao.id, false)
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros ({membros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {membros.map((membro) => {
                  const nomeUsuario =
                    membro.usuario?.raw_user_meta_data?.nome ||
                    membro.usuario?.raw_user_meta_data?.email ||
                    "Usuário";
                  const emailUsuario =
                    membro.usuario?.raw_user_meta_data?.email || "";
                  return (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(nomeUsuario, emailUsuario)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {nomeUsuario}
                        </span>
                      </div>
                      {membro.role === "admin" && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={showAprovacaoDialog} onOpenChange={setShowAprovacaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Você deseja permitir que{" "}
              {solicitacaoAprovar?.usuario?.raw_user_meta_data?.nome ||
                solicitacaoAprovar?.usuario?.raw_user_meta_data?.email ||
                "este usuário"}{" "}
              entre neste grupo?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowAprovacaoDialog(false);
                setSolicitacaoAprovar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (solicitacaoAprovar) {
                  handleAprovarSolicitacao(solicitacaoAprovar.id, true);
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
