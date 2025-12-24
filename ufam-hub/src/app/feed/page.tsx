"use client";
import { useState, useRef } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Users,
  Globe,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function FeedPage() {
  const [type, setType] = useState<
    "all" | "following" | "public" | "personalized"
  >("personalized");
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [visibilidade, setVisibilidade] = useState<"public" | "private">(
    "public"
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas imagens");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setSelectedImage(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("folder", "feed");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao fazer upload da imagem");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    // Validar URL do link se fornecido
    if (linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
      toast.error("Por favor, insira uma URL válida");
      return;
    }

    try {
      setLoading(true);

      // Fazer upload da imagem se houver
      let finalImageUrl = imageUrl;
      if (selectedImage && !imageUrl) {
        finalImageUrl = await handleUploadImage();
        if (selectedImage && !finalImageUrl) {
          toast.error("Erro ao fazer upload da imagem");
          return;
        }
      }

      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          tipo: "post_personalizado",
          visibilidade,
          imagem_url: finalImageUrl || null,
          link_url: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Erro ao publicar";
        const errorDetails = errorData.details ? `: ${errorData.details}` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success("Atividade publicada com sucesso!");
      setTitulo("");
      setDescricao("");
      setLinkUrl("");
      setVisibilidade("public");
      setSelectedImage(null);
      setImagePreview(null);
      setImageUrl(null);
      setOpen(false);

      // Recarregar o feed
      window.location.reload();
    } catch (error: any) {
      console.error("Erro ao publicar:", error);
      toast.error(error.message || "Erro ao publicar atividade");
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8" />
              Feed de Atividades
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Veja o que está acontecendo na comunidade
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Publicar no Feed</DialogTitle>
                <DialogDescription>
                  Compartilhe uma atividade ou conquista com a comunidade
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Completei meu primeiro pomodoro!"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {titulo.length}/200 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Adicione mais detalhes sobre sua atividade..."
                    value={descricao}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDescricao(e.target.value)
                    }
                    maxLength={1000}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {descricao.length}/1000 caracteres
                  </p>
                </div>

                {/* Upload de Imagem */}
                <div className="space-y-2">
                  <Label htmlFor="imagem">Imagem (opcional)</Label>
                  <div className="space-y-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="imagem"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {uploadingImage ? "Enviando..." : "Adicionar Imagem"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Máximo 5MB (JPG, PNG, GIF)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo de Link */}
                <div className="space-y-2">
                  <Label htmlFor="link">Link (opcional)</Label>
                  <div className="flex gap-2">
                    <LinkIcon className="h-4 w-4 mt-2.5 text-muted-foreground" />
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://exemplo.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compartilhe um link relacionado ao seu post
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibilidade">Visibilidade</Label>
                  <Select
                    value={visibilidade}
                    onValueChange={(v) =>
                      setVisibilidade(v as "public" | "private")
                    }
                  >
                    <SelectTrigger id="visibilidade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público</SelectItem>
                      <SelectItem value="private">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={loading || uploadingImage}
                  >
                    {loading || uploadingImage ? "Publicando..." : "Publicar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
        <TabsList>
          <TabsTrigger value="personalized">
            <Sparkles className="h-4 w-4 mr-2" />
            Personalizado
          </TabsTrigger>
          <TabsTrigger value="all">
            <Activity className="h-4 w-4 mr-2" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="following">
            <Users className="h-4 w-4 mr-2" />
            Seguindo
          </TabsTrigger>
          <TabsTrigger value="public">
            <Globe className="h-4 w-4 mr-2" />
            Públicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized">
          <ActivityFeed type="personalized" />
        </TabsContent>
        <TabsContent value="all">
          <ActivityFeed type="all" />
        </TabsContent>
        <TabsContent value="following">
          <ActivityFeed type="following" />
        </TabsContent>
        <TabsContent value="public">
          <ActivityFeed type="public" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
