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
  Library,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGrupoMensagensRealtime } from "@/hooks/useGrupoMensagensRealtime";
interface Mensagem {
  id: string;
  mensagem: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  mencionados?: string[];
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
  user_id?: string;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mensagemToDelete, setMensagemToDelete] = useState<Mensagem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadMensagensRef = useRef<() => void>(() => {});

  useGrupoMensagensRealtime(grupoId, () => loadMensagensRef.current());

  useEffect(() => {
    loadCurrentUser();
    loadGrupoInfo();
    loadMensagens();
    loadMembros();
    loadSolicitacoes();
    const interval = setInterval(() => {
      loadSolicitacoes();
      loadMensagens();
    }, 30000);
    return () => clearInterval(interval);
  }, [grupoId]);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setCurrentUserId(profile.id);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error);
    }
  };

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
  loadMensagensRef.current = loadMensagens;

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

  const renderMessageWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={index}
            className="font-semibold text-primary bg-primary/10 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getMentionSuggestions = (query: string) => {
    if (!query || query.length < 1) return [];
    const queryLower = query.toLowerCase();
    return membros
      .filter((membro) => {
        const nome =
          membro.usuario?.raw_user_meta_data?.nome ||
          membro.usuario?.raw_user_meta_data?.email ||
          "";
        return nome.toLowerCase().includes(queryLower);
      })
      .slice(0, 5);
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionSuggestions(true);
      setMentionPosition({
        start: cursorPos - mentionMatch[1].length - 1,
        end: cursorPos,
      });
    } else {
      setShowMentionSuggestions(false);
    }
    
    setNovaMensagem(value);
  };

  const insertMention = (membro: Membro) => {
    const nome =
      membro.usuario?.raw_user_meta_data?.nome ||
      membro.usuario?.raw_user_meta_data?.email ||
      "";
    const nomeSemEspacos = nome.replace(/\s+/g, "");
    const beforeMention = novaMensagem.substring(0, mentionPosition.start);
    const afterMention = novaMensagem.substring(mentionPosition.end);
    const newText = `${beforeMention}@${nomeSemEspacos} ${afterMention}`;
    setNovaMensagem(newText);
    setShowMentionSuggestions(false);
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = beforeMention.length + nomeSemEspacos.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleEditMessage = (mensagem: Mensagem) => {
    setEditingMessageId(mensagem.id);
    setEditingText(mensagem.mensagem);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens/${editingMessageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensagem: editingText }),
        }
      );
      
      if (response.ok) {
        toast.success("Mensagem editada com sucesso!");
        setEditingMessageId(null);
        setEditingText("");
        await loadMensagens();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao editar mensagem");
      }
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
      toast.error("Erro ao editar mensagem");
    }
  };

  const handleDeleteClick = (mensagem: Mensagem) => {
    setMensagemToDelete(mensagem);
    setShowDeleteDialog(true);
  };

  const handleDeleteMessage = async () => {
    if (!mensagemToDelete) return;
    
    try {
      const response = await fetch(
        `/api/colaboracao/grupos/${grupoId}/mensagens/${mensagemToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      
      if (response.ok) {
        toast.success("Mensagem deletada com sucesso!");
        setShowDeleteDialog(false);
        setMensagemToDelete(null);
        await loadMensagens();
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao deletar mensagem");
      }
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      toast.error("Erro ao deletar mensagem");
    }
  };

  const canEditMessage = (mensagem: Mensagem) => {
    if (!mensagem.created_at) return false;
    const createdAt = new Date(mensagem.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 5;
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
                        const isOwnMessage = msg.user_id === currentUserId;
                        const isEditing = editingMessageId === msg.id;
                        
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
                                {msg.updated_at && (
                                  <span className="text-xs text-muted-foreground italic">
                                    (editado)
                                  </span>
                                )}
                                {isOwnMessage && !isEditing && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEditMessage(msg) && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleEditMessage(msg)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => handleDeleteClick(msg)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="rounded-lg bg-background border p-3 shadow-sm">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      className="min-h-[60px]"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditingText("");
                                        }}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancelar
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Salvar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {renderMessageWithMentions(msg.mensagem)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={mensagensEndRef} />
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t relative">
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={novaMensagem}
                    onChange={handleMessageInputChange}
                    onKeyDown={(e) => {
                      if (showMentionSuggestions && e.key === "ArrowDown") {
                        e.preventDefault();
                      } else if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviarMensagem();
                      } else if (e.key === "Escape") {
                        setShowMentionSuggestions(false);
                      }
                    }}
                    placeholder="Digite sua mensagem... Use @ para mencionar alguém"
                    className="min-h-[60px] resize-none"
                    rows={2}
                  />
                  {showMentionSuggestions && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {getMentionSuggestions(mentionQuery).length > 0 ? (
                        getMentionSuggestions(mentionQuery).map((membro) => {
                          const nome =
                            membro.usuario?.raw_user_meta_data?.nome ||
                            membro.usuario?.raw_user_meta_data?.email ||
                            "Usuário";
                          return (
                            <button
                              key={membro.id}
                              type="button"
                              onClick={() => insertMention(membro)}
                              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    membro.usuario?.raw_user_meta_data?.nome,
                                    membro.usuario?.raw_user_meta_data?.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{nome}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Nenhum membro encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleEnviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5" />
                  Materiais do Grupo
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/biblioteca?grupo_id=${grupoId}`;
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Materiais compartilhados neste grupo aparecerão aqui.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `/biblioteca?grupo_id=${grupoId}`;
                  }}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Ver todos os materiais do grupo
                </Button>
              </div>
            </CardContent>
          </Card>
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

          {currentUserId &&
            grupoInfo?.visibilidade === "privado" &&
            (grupoInfo?.criador_id === currentUserId ||
              membros.find(
                (m) =>
                  m.user_id === currentUserId || m.usuario?.id === currentUserId
              )?.role === "admin") && (
              <Card className="border-orange-500/30 bg-orange-500/5 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-base">
                    <UserPlus className="h-4 w-4" />
                    Solicitações pendentes
                    {solicitacoes.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({solicitacoes.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {solicitacoes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {grupoInfo?.requer_aprovacao
                        ? "Nenhuma solicitação pendente. Quem pedir para entrar no grupo aparecerá aqui."
                        : "Nenhuma solicitação pendente. Para receber pedidos de entrada aqui, crie um novo grupo privado com a opção \"Requer aprovação do admin\" ativada."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {solicitacoes.map((solicitacao) => (
                        <div
                          key={solicitacao.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="text-xs">
                                {getInitials(
                                  solicitacao.usuario?.raw_user_meta_data?.nome,
                                  solicitacao.usuario?.raw_user_meta_data?.email
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {solicitacao.usuario?.raw_user_meta_data?.nome ||
                                  solicitacao.usuario?.raw_user_meta_data?.email ||
                                  "Usuário"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(solicitacao.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 px-2"
                              onClick={() => {
                                setSolicitacaoAprovar(solicitacao);
                                setShowAprovacaoDialog(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() =>
                                handleAprovarSolicitacao(solicitacao.id, false)
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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

      {/* Dialog de confirmação para deletar mensagem */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Deletar Mensagem
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta mensagem?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {mensagemToDelete && (
              <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                <p className="text-muted-foreground mb-2">
                  <strong>Mensagem:</strong>
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {mensagemToDelete.mensagem.length > 200
                    ? `${mensagemToDelete.mensagem.substring(0, 200)}...`
                    : mensagemToDelete.mensagem}
                </p>
              </div>
            )}
            <div className="mt-4 rounded-lg border bg-destructive/10 border-destructive/30 p-4 text-sm">
              <p className="text-destructive dark:text-destructive">
                <strong>⚠️ Atenção:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>Esta ação não pode ser desfeita</li>
                <li>A mensagem será permanentemente removida</li>
                <li>Outros membros do grupo não poderão mais vê-la</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setMensagemToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMessage}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
