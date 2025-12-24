"use client";
import { useState, useEffect } from "react";
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
  ArrowLeft,
  Download,
  Heart,
  Eye,
  User,
  Calendar,
  Tag,
  Users,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  Share2,
  Send,
  Trash2,
  Image as ImageIcon,
  FileImage,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Comentario {
  id: string;
  conteudo: string;
  created_at: string;
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}

interface Material {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  categoria?: string;
  arquivo_url?: string;
  arquivo_tipo?: string;
  arquivo_tamanho?: number;
  visualizacoes: number;
  downloads: number;
  curtidas: number;
  tags?: string[];
  created_at: string;
  grupo?: {
    id: string;
    nome: string;
  };
  usuario?: {
    id: string;
    raw_user_meta_data?: {
      nome?: string;
      email?: string;
    };
  };
}

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [curtido, setCurtido] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadMaterial();
    loadComentarios();
    loadCurrentUser();
  }, [materialId]);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setCurrentUserId(profile?.id || null);
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const loadComentarios = async () => {
    try {
      setLoadingComentarios(true);
      const response = await fetch(
        `/api/colaboracao/biblioteca/${materialId}/comentarios`
      );
      if (response.ok) {
        const { comentarios: data } = await response.json();
        setComentarios(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    } finally {
      setLoadingComentarios(false);
    }
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) return;

    try {
      setEnviandoComentario(true);
      const response = await fetch(
        `/api/colaboracao/biblioteca/${materialId}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conteudo: novoComentario }),
        }
      );

      if (response.ok) {
        const { comentario } = await response.json();
        setComentarios([comentario, ...comentarios]);
        setNovoComentario("");
        toast.success("Comentário adicionado!");
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao adicionar comentário");
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      toast.error("Erro ao enviar comentário");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: string) => {
    try {
      const response = await fetch(
        `/api/colaboracao/biblioteca/${materialId}/comentarios?comentario_id=${comentarioId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setComentarios(comentarios.filter((c) => c.id !== comentarioId));
        toast.success("Comentário removido!");
      } else {
        const { error } = await response.json();
        toast.error(error || "Erro ao remover comentário");
      }
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
      toast.error("Erro ao remover comentário");
    }
  };

  const isPDF = (url?: string, tipo?: string) => {
    if (!url) return false;
    return url.toLowerCase().endsWith(".pdf") || tipo === "application/pdf";
  };

  const isImage = (url?: string, tipo?: string) => {
    if (!url) return false;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const urlLower = url.toLowerCase();
    return (
      imageExtensions.some((ext) => urlLower.endsWith(ext)) ||
      tipo?.startsWith("image/")
    );
  };

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/colaboracao/biblioteca/${materialId}`);
      if (response.ok) {
        const { material: materialData } = await response.json();
        setMaterial(materialData);
      } else {
        const { error } = await response.json();
        toast.error(error || "Material não encontrado");
        router.push("/biblioteca");
      }
    } catch (error) {
      console.error("Erro ao carregar material:", error);
      toast.error("Erro ao carregar material");
      router.push("/biblioteca");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!material?.arquivo_url) return;

    try {
      await fetch(`/api/colaboracao/biblioteca/${materialId}/download`, {
        method: "POST",
      });
      window.open(material.arquivo_url, "_blank");
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao registrar download:", error);
      window.open(material.arquivo_url, "_blank");
    }
  };

  const handleCurtir = async () => {
    try {
      const response = await fetch(
        `/api/colaboracao/biblioteca/${materialId}/curtir`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setCurtido(!curtido);
        if (material) {
          setMaterial({
            ...material,
            curtidas: curtido ? material.curtidas - 1 : material.curtidas + 1,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-12 animate-pulse mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando material...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!material) {
    return (
      <main className="mx-auto max-w-4xl p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Material não encontrado
            </h2>
            <p className="text-muted-foreground mb-4">
              Este material pode ter sido removido ou o link está inválido.
            </p>
            <Button asChild>
              <Link href="/biblioteca">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Biblioteca
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const nomeUsuario =
    material.usuario?.raw_user_meta_data?.nome ||
    material.usuario?.raw_user_meta_data?.email ||
    "Usuário";
  const emailUsuario = material.usuario?.raw_user_meta_data?.email || "";

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/biblioteca">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Material</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{material.titulo}</CardTitle>
              {material.descricao && (
                <CardDescription className="mt-2 text-base">
                  {material.descricao}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {material.tipo === "arquivo" && <FileText className="h-3 w-3" />}
              {material.tipo === "link" && <LinkIcon className="h-3 w-3" />}
              <span className="capitalize">{material.tipo}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">
                  {material.visualizacoes || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Visualizações
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{material.downloads || 0}</div>
                <div className="text-xs text-muted-foreground">Downloads</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{material.curtidas || 0}</div>
                <div className="text-xs text-muted-foreground">Curtidas</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(nomeUsuario, emailUsuario)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{nomeUsuario}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(material.created_at).toLocaleDateString("pt-BR", {
                    dateStyle: "long",
                  })}
                </div>
              </div>
            </div>

            {material.grupo && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Grupo:</span>
                <Link
                  href={`/grupos/${material.grupo.id}`}
                  className="font-medium hover:underline"
                >
                  {material.grupo.nome}
                </Link>
              </div>
            )}

            {material.categoria && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium capitalize">
                  {material.categoria}
                </span>
              </div>
            )}

            {material.tags && material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {material.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-muted px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {material.arquivo_url && (
              <div className="space-y-4">
                {/* Pré-visualização para imagens */}
                {isImage(material.arquivo_url, material.arquivo_tipo) && (
                  <div className="relative group">
                    <div className="rounded-lg border overflow-hidden bg-muted/30">
                      <img
                        src={material.arquivo_url}
                        alt={material.titulo}
                        className="w-full max-h-[400px] object-contain cursor-pointer"
                        onClick={() => setShowPreview(true)}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setShowPreview(true)}
                    >
                      <Maximize2 className="h-4 w-4 mr-1" />
                      Expandir
                    </Button>
                  </div>
                )}

                {/* Pré-visualização para PDFs */}
                {isPDF(material.arquivo_url, material.arquivo_tipo) && (
                  <div className="rounded-lg border overflow-hidden bg-muted/30">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-red-500" />
                        Visualização do PDF
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(true)}
                      >
                        <Maximize2 className="h-4 w-4 mr-1" />
                        Tela cheia
                      </Button>
                    </div>
                    <iframe
                      src={`${material.arquivo_url}#toolbar=0&navpanes=0`}
                      className="w-full h-[500px]"
                      title={material.titulo}
                    />
                  </div>
                )}

                {/* Informações do arquivo */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    {isImage(material.arquivo_url, material.arquivo_tipo) ? (
                      <FileImage className="h-8 w-8 text-blue-500" />
                    ) : isPDF(material.arquivo_url, material.arquivo_tipo) ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : (
                      <FileText className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <div className="font-medium">
                        {material.tipo === "link" ? "Link externo" : "Arquivo"}
                      </div>
                      {material.arquivo_tamanho && (
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(material.arquivo_tamanho)}
                        </div>
                      )}
                    </div>
                  </div>
                  {material.tipo === "link" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(material.arquivo_url, "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Link
                    </Button>
                  ) : (
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant={curtido ? "default" : "outline"}
              onClick={handleCurtir}
              className="flex-1"
            >
              <Heart
                className={`h-4 w-4 mr-2 ${curtido ? "fill-current" : ""}`}
              />
              Curtir
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copiado!");
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Comentários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários ({comentarios.length})
          </CardTitle>
          <CardDescription>
            Compartilhe sua opinião sobre este material
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de novo comentário */}
          <div className="flex gap-2">
            <Input
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário... (ex: 'Ótimo resumo para revisar antes da prova!')"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviarComentario();
                }
              }}
              disabled={enviandoComentario}
            />
            <Button
              onClick={handleEnviarComentario}
              disabled={enviandoComentario || !novoComentario.trim()}
            >
              {enviandoComentario ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Lista de comentários */}
          {loadingComentarios ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comentarios.map((comentario) => {
                const nomeComentario =
                  comentario.usuario?.raw_user_meta_data?.nome ||
                  comentario.usuario?.raw_user_meta_data?.email ||
                  "Usuário";
                const emailComentario =
                  comentario.usuario?.raw_user_meta_data?.email || "";

                return (
                  <div
                    key={comentario.id}
                    className="flex gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(nomeComentario, emailComentario)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {nomeComentario}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comentario.created_at).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        {comentario.usuario?.id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              handleDeletarComentario(comentario.id)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm mt-1">{comentario.conteudo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de pré-visualização em tela cheia */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{material.titulo}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 pt-0">
            {isImage(material.arquivo_url, material.arquivo_tipo) && (
              <img
                src={material.arquivo_url}
                alt={material.titulo}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            {isPDF(material.arquivo_url, material.arquivo_tipo) && (
              <iframe
                src={material.arquivo_url}
                className="w-full h-[80vh]"
                title={material.titulo}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
