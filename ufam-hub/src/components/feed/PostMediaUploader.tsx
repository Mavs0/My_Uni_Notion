"use client";

import {
  Image as ImageIcon,
  Link as LinkIcon,
  BarChart3,
  Film,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PostMediaUploader({
  imagePreview,
  uploadingImage,
  isDragging,
  linkUrl,
  onLinkChange,
  onOpenFilePicker,
  onFileInputChange,
  onRemoveImage,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  disabled,
}: {
  imagePreview: string | null;
  uploadingImage: boolean;
  isDragging: boolean;
  linkUrl: string;
  onLinkChange: (v: string) => void;
  onOpenFilePicker: () => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}) {
  const hasImage = !!imagePreview;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={onFileInputChange}
      />

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onOpenFilePicker}
          className="h-10 w-10 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] dark:border-[#262626] dark:bg-[#151515]"
          title="Imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onOpenFilePicker}
          className="h-10 w-10 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] dark:border-[#262626] dark:bg-[#151515]"
          title="GIF"
        >
          <Film className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled
          className="h-10 w-10 rounded-xl border-[#E5E7EB] opacity-50 dark:border-[#262626]"
          title="Enquete (em breve)"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {hasImage ? (
          <div className="relative aspect-video max-h-44 w-full overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#262626] sm:max-w-[220px]">
            <img
              src={imagePreview!}
              alt=""
              className="h-full w-full object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80"
              onClick={onRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
            {uploadingImage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
                Enviando…
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && onOpenFilePicker()}
          className={cn(
            "flex min-h-[120px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
            isDragging
              ? "border-[#05865E] bg-[#05865E]/10"
              : "border-[#E5E7EB] bg-[#FAFAFA]/50 hover:border-[#05865E]/40 dark:border-[#262626] dark:bg-[#151515]/50",
          )}
        >
          <ImageIcon className="mb-2 h-8 w-8 text-[#6B7280] dark:text-[#737373]" />
          <p className="text-center text-sm font-medium text-[#111827] dark:text-[#F5F5F5]">
            {hasImage
              ? "Adicionar outra imagem"
              : "Arraste ou clique para adicionar"}
          </p>
          <p className="mt-1 text-center text-xs text-[#6B7280] dark:text-[#A3A3A3]">
            JPG, PNG ou GIF até 5MB
          </p>
        </div>
      </div>

      <div className="relative">
        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280] dark:text-[#737373]" />
        <Input
          type="url"
          placeholder="Colar link (artigo, vídeo, recurso…)"
          value={linkUrl}
          onChange={(e) => onLinkChange(e.target.value)}
          disabled={disabled}
          className="h-11 rounded-xl border-[#E5E7EB] bg-[#FAFAFA] pl-10 dark:border-[#262626] dark:bg-[#151515]"
        />
      </div>
    </div>
  );
}
