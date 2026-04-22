"use client";

import { Globe, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type FeedPostCategory,
  POST_CATEGORY_META,
} from "@/components/feed/feed-types";
import { Trophy, BookOpen, Lightbulb, CircleHelp } from "lucide-react";

const ICONS = {
  trophy: Trophy,
  book: BookOpen,
  lightbulb: Lightbulb,
  help: CircleHelp,
} as const;

export function PostLivePreview({
  userName,
  userAvatar,
  userInitials,
  category,
  body,
  imagePreview,
  linkUrl,
  visibilityLabel,
  likesMock,
  commentsMock,
}: {
  userName: string;
  userAvatar: string;
  userInitials: string;
  category: FeedPostCategory;
  body: string;
  imagePreview: string | null;
  linkUrl: string;
  visibilityLabel: string;
  likesMock?: number;
  commentsMock?: number;
}) {
  const meta = POST_CATEGORY_META[category];
  const Icon = ICONS[meta.icon];
  const trimmed = body.trim();
  const firstBreak = trimmed.indexOf("\n");
  const firstLine =
    firstBreak === -1 ? trimmed : trimmed.slice(0, firstBreak);
  const rest =
    firstBreak === -1 ? "" : trimmed.slice(firstBreak + 1).trim();

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280] dark:text-[#A3A3A3]">
        Prévia da publicação
      </p>
      <div
        className={cn(
          "flex flex-1 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-[#262626] dark:bg-[#151515]",
        )}
      >
        <div className="flex gap-3">
          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-[#05865E]/15">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-[#05865E]/20 text-[#05865E]">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#111827] dark:text-[#F5F5F5]">
              {userName || "Você"}
            </p>
            <p className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#A3A3A3]">
              <Globe className="h-3 w-3" />
              {visibilityLabel} · agora
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#05865E]/35 bg-[#05865E]/10 px-2.5 py-0.5 text-xs font-medium text-[#05865E] dark:text-[#34D399]">
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {meta.label}
            </span>
            {firstLine ? (
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#111827] dark:text-[#F5F5F5]">
                {firstLine}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-[#6B7280] dark:text-[#737373]">
                O texto aparecerá aqui…
              </p>
            )}
            {rest ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#374151] dark:text-[#D4D4D4]">
                {rest}
              </p>
            ) : null}
            {imagePreview ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#E5E7EB] dark:border-[#262626]">
                <img
                  src={imagePreview}
                  alt=""
                  className="max-h-48 w-full object-cover"
                />
              </div>
            ) : null}
            {linkUrl.trim() ? (
              <p className="mt-2 truncate text-xs text-[#05865E]">{linkUrl}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 border-t border-[#E5E7EB] pt-3 dark:border-[#262626]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-[#6B7280] dark:text-[#A3A3A3]"
            disabled
          >
            <Heart className="h-4 w-4" />
            {likesMock ?? 0}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-[#6B7280] dark:text-[#A3A3A3]"
            disabled
          >
            <MessageCircle className="h-4 w-4" />
            {commentsMock ?? 0}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 text-[#6B7280] dark:text-[#A3A3A3]"
            disabled
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
