"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Activity,
  Loader2,
  Send,
  Lock,
  Smile,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PostTypeSelector } from "./PostTypeSelector";
import { PostQuickSuggestions } from "./PostQuickSuggestions";
import { PostMediaUploader } from "./PostMediaUploader";
import { PostLivePreview } from "./PostLivePreview";
import {
  type FeedPostCategory,
  splitComposerToTituloDescricao,
} from "@/components/feed/feed-types";

const MAX_CHARS = 1000;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
  userName: string;
  userAvatar: string;
  userInitials: string;
};

export function CreatePostComposerModal({
  open,
  onOpenChange,
  onPublished,
  userName,
  userAvatar,
  userInitials,
}: Props) {
  const [category, setCategory] = useState<FeedPostCategory>("conquista");
  const [composerText, setComposerText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setCategory("conquista");
    setComposerText("");
    setLinkUrl("");
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    setLoading(false);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const applyFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione apenas imagens (JPG, PNG, GIF…).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return imageUrl;
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
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro no upload");
      }
      const data = await response.json();
      return data.url as string;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      toast.error(msg);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const isValidUrl = (s: string) => {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handlePublish = async () => {
    const text = composerText.trim();
    if (!text) {
      toast.error("Escreva algo antes de publicar.");
      return;
    }
    if (linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
      toast.error("URL inválida.");
      return;
    }

    const { titulo, descricao } = splitComposerToTituloDescricao(composerText);
    if (!titulo) {
      toast.error("Conteúdo inválido.");
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = imageUrl;
      if (selectedImage && !imageUrl) {
        finalImageUrl = await uploadImage();
        if (selectedImage && !finalImageUrl) return;
      }

      const response = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao: descricao || null,
          tipo: "post_personalizado",
          visibilidade: "public",
          imagem_url: finalImageUrl || null,
          link_url: linkUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao publicar");
      }

      toast.success("Publicação criada com sucesso.");
      reset();
      onOpenChange(false);
      onPublished();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao publicar");
    } finally {
      setLoading(false);
    }
  };

  const canPublish =
    composerText.trim().length > 0 && !loading && !uploadingImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-h-[95vh] gap-0 overflow-hidden border-0 p-0 sm:max-w-[min(100vw-2rem,920px)]",
          "bg-[#F7F7F8] dark:bg-[#050505]",
        )}
      >
        <DialogTitle className="sr-only">Criar publicação</DialogTitle>
        <div className="flex max-h-[95vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4 pr-14 dark:border-[#262626] sm:px-6 sm:pr-16">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#05865E]/15 text-[#05865E]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827] dark:text-[#F5F5F5]">
                  Criar publicação
                </h2>
                <p className="text-sm text-[#6B7280] dark:text-[#A3A3A3]">
                  Compartilhe algo com a comunidade UFAM Hub.
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_min(320px,38%)] lg:gap-8 sm:px-6">
              {/* Composer */}
              <div className="space-y-5">
                <PostTypeSelector
                  value={category}
                  onChange={setCategory}
                  label="Tipo de publicação"
                />

                <PostQuickSuggestions onPick={(s) => setComposerText(s)} />

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-[#6B7280] dark:text-[#A3A3A3]">
                    No que você quer compartilhar?
                  </Label>
                  <div className="relative rounded-2xl border border-[#E5E7EB] bg-white dark:border-[#262626] dark:bg-[#101010]">
                    <div className="flex gap-3 p-3 sm:p-4">
                      <div className="hidden shrink-0 sm:block">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#05865E]/15 text-sm font-semibold text-[#05865E]">
                          {userInitials || "?"}
                        </div>
                      </div>
                      <Textarea
                        placeholder="O que você gostaria de dividir com a comunidade?"
                        value={composerText}
                        onChange={(e) =>
                          setComposerText(
                            e.target.value.slice(0, MAX_CHARS),
                          )
                        }
                        rows={8}
                        className={cn(
                          "min-h-[180px] resize-none border-0 bg-transparent p-0 text-base text-[#111827] shadow-none focus-visible:ring-0 dark:text-[#F5F5F5]",
                          "placeholder:text-[#6B7280] dark:placeholder:text-[#737373]",
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-[#E5E7EB] px-3 py-2 dark:border-[#262626] sm:px-4">
                      <span className="text-xs tabular-nums text-[#6B7280] dark:text-[#A3A3A3]">
                        {composerText.length}/{MAX_CHARS}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-[#6B7280] transition-colors hover:bg-black/[0.04] hover:text-[#05865E] dark:text-[#737373] dark:hover:bg-white/[0.06]"
                        title="Emojis (em breve)"
                        disabled
                      >
                        <Smile className="h-4 w-4 opacity-50" />
                      </button>
                    </div>
                  </div>
                </div>

                <PostMediaUploader
                  imagePreview={imagePreview}
                  uploadingImage={uploadingImage}
                  isDragging={isDragging}
                  linkUrl={linkUrl}
                  onLinkChange={setLinkUrl}
                  onOpenFilePicker={() => fileInputRef.current?.click()}
                  onFileInputChange={handleFileInputChange}
                  onRemoveImage={handleRemoveImage}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  fileInputRef={fileInputRef}
                  disabled={loading || uploadingImage}
                />

                <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#A3A3A3]">
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Quem pode ver?
                  </span>
                  <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#111827] dark:border-[#262626] dark:bg-[#151515] dark:text-[#F5F5F5]">
                    Público
                  </span>
                </div>
              </div>

              {/* Preview — à direita no desktop; no mobile fica abaixo do composer */}
              <div className="border-t border-[#E5E7EB] pt-5 dark:border-[#262626] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <PostLivePreview
                  userName={userName}
                  userAvatar={userAvatar}
                  userInitials={userInitials}
                  category={category}
                  body={composerText}
                  imagePreview={imagePreview}
                  linkUrl={linkUrl}
                  visibilityLabel="Público"
                  likesMock={12}
                  commentsMock={3}
                />
              </div>
            </div>
          </div>

          <footer className="border-t border-[#E5E7EB] bg-white/90 px-5 py-4 dark:border-[#262626] dark:bg-[#101010]/95 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center justify-center gap-2 text-center text-xs text-[#6B7280] dark:text-[#A3A3A3] sm:justify-start sm:text-left">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#05865E]" />
                Seja respeitoso e mantenha um ambiente acolhedor para todos.
              </p>
              <div className="flex shrink-0 justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-[#E5E7EB] dark:border-[#333]"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={!canPublish}
                  onClick={() => void handlePublish()}
                  className="gap-2 rounded-xl bg-[#05865E] px-5 text-white shadow-md shadow-[#05865E]/20 hover:bg-[#047a52] disabled:opacity-50"
                >
                  {loading || uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publicando…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
