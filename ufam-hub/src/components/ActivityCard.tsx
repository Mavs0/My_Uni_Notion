"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  BookOpen,
  GraduationCap,
  FileText,
  Trophy,
  User,
  Heart,
  Lightbulb,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  X,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface ActivityUser {
  id: string;
  nome: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  activity_id: string;
  comentario: string;
  created_at: string;
  user: ActivityUser;
  is_owner: boolean;
}

interface Activity {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  created_at: string;
  user: ActivityUser;
  is_owner?: boolean;
  disciplina_id?: string;
  disciplina_nome?: string;
  disciplina_cor?: string;
  imagem_url?: string;
  link_url?: string;
}

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

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

const getActivityIcon = (tipo: string) => {
  switch (tipo) {
    case "pomodoro_completo":
      return <Clock className="h-5 w-5 text-blue-500" />;
    case "disciplina_criada":
      return <BookOpen className="h-5 w-5 text-green-500" />;
    case "avaliacao_adicionada":
      return <GraduationCap className="h-5 w-5 text-purple-500" />;
    case "nota_criada":
      return <FileText className="h-5 w-5 text-orange-500" />;
    case "conquista_desbloqueada":
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case "post_personalizado":
      return <User className="h-5 w-5 text-indigo-500" />;
    case "tarefa_concluida":
      return <FileText className="h-5 w-5 text-green-500" />;
    case "meta_atingida":
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    default:
      return <User className="h-5 w-5 text-gray-500" />;
  }
};

const getActivityLabel = (tipo: string) => {
  switch (tipo) {
    case "pomodoro_completo":
      return "Completou um Pomodoro";
    case "disciplina_criada":
      return "Adicionou uma disciplina";
    case "avaliacao_adicionada":
      return "Adicionou uma avaliação";
    case "nota_criada":
      return "Criou uma anotação";
    case "conquista_desbloqueada":
      return "Desbloqueou uma conquista";
    case "post_personalizado":
      return "Publicou no feed";
    case "tarefa_concluida":
      return "Concluiu uma tarefa";
    case "meta_atingida":
      return "Atingiu uma meta";
    default:
      return "Realizou uma atividade";
  }
};

export function ActivityCard({ activity, onUpdate }: ActivityCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [reactions, setReactions] = useState({
    like: 0,
    util: 0,
    inspirador: 0,
  });
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    checkOwnership();
    loadReactions();
    if (showComments) {
      loadComments();
    }
  }, [activity.id, showComments]);

  const checkOwnership = async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsOwner(user?.id === activity.user.id);
    } catch (error) {
      console.error("Erro ao verificar propriedade:", error);
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(
        `/api/feed/comments?activity_id=${activity.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadReactions = async () => {
    try {
      setLoadingReactions(true);
      const response = await fetch(
        `/api/feed/reactions?activity_id=${activity.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || { like: 0, util: 0, inspirador: 0 });
        setUserReactions(data.user_reactions || []);
      }
    } catch (error) {
      console.error("Erro ao carregar reações:", error);
    } finally {
      setLoadingReactions(false);
    }
  };

  const handleReaction = async (tipo: string) => {
    const isActive = userReactions.includes(tipo);
    const action = isActive ? "remove" : "add";

    try {
      const response = await fetch("/api/feed/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: activity.id,
          tipo,
          action,
        }),
      });

      if (response.ok) {
        await loadReactions();
      } else {
        toast.error("Erro ao reagir à atividade");
      }
    } catch (error) {
      console.error("Erro ao reagir:", error);
      toast.error("Erro ao reagir à atividade");
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSendingComment(true);
      const response = await fetch("/api/feed/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: activity.id,
          comentario: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment("");
        await loadComments();
        toast.success("Comentário adicionado!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao comentar");
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
      toast.error("Erro ao comentar");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/feed/comments?id=${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadComments();
        toast.success("Comentário deletado");
      } else {
        toast.error("Erro ao deletar comentário");
      }
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
      toast.error("Erro ao deletar comentário");
    }
  };

  const handleDeleteActivity = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/feed?id=${activity.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Atividade deletada");
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao deletar atividade");
      }
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
      toast.error("Erro ao deletar atividade");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const initials = activity.user.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatTimeAgo(activity.created_at);

  const getContextualLink = () => {
    if (!activity.referencia_id || !activity.referencia_tipo) return null;

    switch (activity.referencia_tipo) {
      case "disciplina":
        return {
          href: `/disciplinas/${activity.referencia_id}`,
          label: activity.disciplina_nome || "Ver disciplina",
          icon: <BookOpen className="h-3 w-3" />,
        };
      case "avaliacao":
        return {
          href: activity.disciplina_id
            ? `/disciplinas/${activity.disciplina_id}#avaliacoes`
            : "/avaliacoes",
          label: "Ver avaliação",
          icon: <GraduationCap className="h-3 w-3" />,
        };
      case "nota":
        return {
          href: activity.disciplina_id
            ? `/disciplinas/${activity.disciplina_id}#anotacoes`
            : "/busca-anotacoes",
          label: "Ver anotação",
          icon: <FileText className="h-3 w-3" />,
        };
      default:
        return null;
    }
  };

  const contextualLink = getContextualLink();
  const disciplinaColor = activity.disciplina_cor || "#6366f1";

  return (
    <>
      <Card className="group animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-300 hover:border-[#05865E]/25 hover:shadow-md dark:border-[#262626] dark:bg-[#101010] dark:shadow-none dark:hover:border-[#333]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Link href={`/perfil/${activity.user.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer border border-zinc-200/80 transition-all duration-200 hover:opacity-80 hover:ring-2 hover:ring-primary/20 dark:border-zinc-700">
                <AvatarImage
                  src={activity.user.avatar_url}
                  alt={activity.user.nome}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-0.5">{getActivityIcon(activity.tipo)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      <Link
                        href={`/perfil/${activity.user.id}`}
                        className="font-semibold text-zinc-900 hover:text-primary dark:text-white"
                      >
                        {activity.user.nome}
                      </Link>{" "}
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {getActivityLabel(activity.tipo)}
                      </span>
                    </p>
                    {activity.titulo && (
                      <p className="mt-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {activity.titulo}
                      </p>
                    )}
                    {activity.descricao && (
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {activity.descricao}
                      </p>
                    )}

                    {/* Imagem */}
                    {activity.imagem_url && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                        <img
                          src={activity.imagem_url}
                          alt={activity.titulo || "Imagem do post"}
                          className="w-full h-auto max-h-96 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Link compartilhado */}
                    {activity.link_url && (
                      <a
                        href={activity.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-3 flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-primary dark:text-zinc-400" />
                        <div className="flex-1 min-w-0">
                          <p className="mb-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Link compartilhado
                          </p>
                          <p className="truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-primary dark:text-zinc-100">
                            {activity.link_url}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-zinc-500 opacity-0 transition-colors group-hover:text-primary group-hover:opacity-100 dark:text-zinc-400" />
                      </a>
                    )}

                    {/* Badge de disciplina ou link contextual */}
                    {(activity.disciplina_id || contextualLink) && (
                      <div className="flex items-center gap-2 mt-2.5">
                        {activity.disciplina_id && activity.disciplina_nome && (
                          <Link
                            href={`/disciplinas/${activity.disciplina_id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: `${disciplinaColor}15`,
                              color: disciplinaColor,
                              border: `1px solid ${disciplinaColor}30`,
                            }}
                          >
                            <BookOpen className="h-3 w-3" />
                            {activity.disciplina_nome}
                            <ArrowRight className="h-3 w-3 opacity-60" />
                          </Link>
                        )}
                        {contextualLink && !activity.disciplina_id && (
                          <Link
                            href={contextualLink.href}
                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/90 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-all duration-200 hover:scale-105 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                          >
                            {contextualLink.icon}
                            {contextualLink.label}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>
                        )}
                      </div>
                    )}

                    <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {timeAgo}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Reações */}
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 ${
                    userReactions.includes("like")
                      ? "!text-red-500 dark:!text-red-400"
                      : ""
                  }`}
                  onClick={() => handleReaction("like")}
                  disabled={loadingReactions}
                >
                  <Heart
                    className={`h-4 w-4 mr-1 ${
                      userReactions.includes("like") ? "fill-current" : ""
                    }`}
                  />
                  {reactions.like}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 ${
                    userReactions.includes("util")
                      ? "!text-blue-500 dark:!text-blue-400"
                      : ""
                  }`}
                  onClick={() => handleReaction("util")}
                  disabled={loadingReactions}
                >
                  <ThumbsUp
                    className={`h-4 w-4 mr-1 ${
                      userReactions.includes("util") ? "fill-current" : ""
                    }`}
                  />
                  {reactions.util}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 ${
                    userReactions.includes("inspirador")
                      ? "!text-amber-500 dark:!text-amber-400"
                      : ""
                  }`}
                  onClick={() => handleReaction("inspirador")}
                  disabled={loadingReactions}
                >
                  <Lightbulb
                    className={`h-4 w-4 mr-1 ${
                      userReactions.includes("inspirador") ? "fill-current" : ""
                    }`}
                  />
                  {reactions.inspirador}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {comments.length}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`ml-auto h-8 ${
                    bookmarked
                      ? "text-[#05865E] dark:text-emerald-400"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                  onClick={() => setBookmarked((b) => !b)}
                  title={bookmarked ? "Remover dos salvos" : "Salvar publicação"}
                >
                  <Bookmark
                    className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`}
                  />
                </Button>
              </div>

              {/* Comentários */}
              {showComments && (
                <div className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  {loadingComments ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Carregando comentários...
                    </p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum comentário ainda. Seja o primeiro!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const commentInitials = comment.user.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                        return (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={comment.user.avatar_url}
                                alt={comment.user.nome}
                              />
                              <AvatarFallback>{commentInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">
                                    {comment.user.nome}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.comentario}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimeAgo(comment.created_at)}
                                  </p>
                                </div>
                                {comment.is_owner && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Formulário de comentário */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px]"
                      maxLength={1000}
                    />
                    <Button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || sendingComment}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de deleção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A atividade será permanentemente
              removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
